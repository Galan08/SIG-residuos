from conftest import DOMINIO, PASSWORD, png_minimo


# HU-01: registro, inicio de sesión y rutas protegidas
def test_registro_rechaza_correo_repetido(client, ciudadano):
    r = client.post(
        "/auth/registro",
        json={"nombre_completo": "Repetido", "correo": f"ciudadano@{DOMINIO}", "password": PASSWORD},
    )
    assert r.status_code == 409


def test_login_con_clave_incorrecta(client, ciudadano):
    r = client.post("/auth/login", json={"correo": f"ciudadano@{DOMINIO}", "password": "Otra1234"})
    assert r.status_code == 401


def test_rutas_privadas_exigen_token(client):
    assert client.get("/reportes").status_code == 401
    assert client.get("/reportes/mapa").status_code == 401
    assert client.get("/admin/reportes").status_code == 401


# HU-02: reporte con foto y coordenadas
def test_crear_reporte_con_foto(client, ciudadano, reporte):
    r = client.post(
        f"/reportes/{reporte['id']}/foto",
        files={"archivo": ("foto.png", png_minimo(), "image/png")},
        headers=ciudadano,
    )
    assert r.status_code == 200
    detalle = client.get(f"/reportes/{reporte['id']}", headers=ciudadano).json()
    assert detalle["foto_url"].startswith("/uploads/reportes/")
    assert round(detalle["latitud"], 4) == 8.2376


def test_foto_rechaza_archivos_que_no_son_imagen(client, ciudadano, reporte):
    r = client.post(
        f"/reportes/{reporte['id']}/foto",
        files={"archivo": ("nota.txt", b"hola", "text/plain")},
        headers=ciudadano,
    )
    assert r.status_code == 415


# HU-03: mapa en GeoJSON
def test_mapa_devuelve_geojson_solo_con_reportes_propios(client, ciudadano, otro_ciudadano, reporte):
    propio = client.get("/reportes/mapa", headers=ciudadano).json()
    assert propio["type"] == "FeatureCollection"
    ids = [f["properties"]["id"] for f in propio["features"]]
    assert reporte["id"] in ids
    lon, lat = next(f for f in propio["features"] if f["properties"]["id"] == reporte["id"])["geometry"]["coordinates"]
    assert (round(lat, 4), round(lon, 4)) == (8.2376, -73.3561)

    ajeno = client.get("/reportes/mapa", headers=otro_ciudadano).json()
    assert reporte["id"] not in [f["properties"]["id"] for f in ajeno["features"]]


def test_mapa_filtrado_sin_resultados(client, otro_ciudadano):
    r = client.get("/reportes/mapa?estado=limpio", headers=otro_ciudadano)
    assert r.status_code == 200
    assert r.json()["features"] == []


# HU-04: gestión solo para el administrador
def test_ciudadano_no_gestiona(client, ciudadano, reporte):
    assert client.get("/admin/reportes", headers=ciudadano).status_code == 403
    r = client.patch(f"/reportes/{reporte['id']}/estado", json={"estado": "en_proceso"}, headers=ciudadano)
    assert r.status_code == 403


def test_admin_lista_y_asigna(client, admin, reporte):
    lista = client.get("/admin/reportes?estado=pendiente", headers=admin).json()
    fila = next(r for r in lista if r["id"] == reporte["id"])
    assert fila["ciudadano"] == "Prueba ciudadano"

    r = client.patch(
        f"/reportes/{reporte['id']}/estado",
        json={"estado": "en_proceso", "cuadrilla": "Cuadrilla 3"},
        headers=admin,
    )
    assert r.status_code == 200
    assert [s["estado"] for s in r.json()["seguimiento"]] == ["pendiente", "en_proceso"]


# HU-05: cierre con foto
def test_no_se_cierra_sin_foto_de_cierre(client, admin, reporte):
    r = client.patch(f"/reportes/{reporte['id']}/estado", json={"estado": "limpio"}, headers=admin)
    assert r.status_code == 409


def test_cierre_con_foto_visible_para_el_ciudadano(client, admin, ciudadano, reporte):
    r = client.post(
        f"/reportes/{reporte['id']}/foto-cierre",
        files={"archivo": ("cierre.png", png_minimo(), "image/png")},
        headers=admin,
    )
    assert r.status_code == 200
    r = client.patch(f"/reportes/{reporte['id']}/estado", json={"estado": "limpio"}, headers=admin)
    assert r.status_code == 200

    detalle = client.get(f"/reportes/{reporte['id']}", headers=ciudadano).json()
    assert detalle["estado"] == "limpio"
    assert detalle["foto_cierre_url"]
    assert [s["estado"] for s in detalle["seguimiento"]] == ["pendiente", "limpio"]
