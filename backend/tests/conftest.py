# Las pruebas usan la base configurada en backend/.env (con schema.sql ya ejecutado).
# Crean usuarios con correos únicos y los borran al terminar.
import struct
import sys
import zlib
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database import SessionLocal  # noqa: E402
from main import app  # noqa: E402
from models import Usuario  # noqa: E402

DOMINIO = f"{uuid4().hex[:8]}.pytest"
PASSWORD = "Clave1234"


def png_minimo() -> bytes:
    def bloque(tipo, datos):
        return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", zlib.crc32(tipo + datos))

    cabecera = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + bloque(b"IHDR", cabecera)
        + bloque(b"IDAT", zlib.compress(b"\x00\xff\x00\x00"))
        + bloque(b"IEND", b"")
    )


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
    with SessionLocal() as db:
        db.execute(delete(Usuario).where(Usuario.correo.like(f"%@{DOMINIO}")))
        db.commit()


def crear_usuario(client, nombre, rol="ciudadano"):
    correo = f"{nombre}@{DOMINIO}"
    r = client.post(
        "/auth/registro",
        json={"nombre_completo": f"Prueba {nombre}", "correo": correo, "password": PASSWORD},
    )
    assert r.status_code == 201, r.text
    if rol != "ciudadano":
        with SessionLocal() as db:
            db.query(Usuario).filter(Usuario.correo == correo).update({"rol": rol})
            db.commit()
    token = client.post("/auth/login", json={"correo": correo, "password": PASSWORD}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def ciudadano(client):
    return crear_usuario(client, "ciudadano")


@pytest.fixture(scope="session")
def otro_ciudadano(client):
    return crear_usuario(client, "otro")


@pytest.fixture(scope="session")
def admin(client):
    return crear_usuario(client, "admin", rol="administrador")


@pytest.fixture
def reporte(client, ciudadano):
    datos = {
        "tipo_residuo": "Escombros",
        "descripcion": "Escombros en el andén",
        "barrio": "Centro",
        "direccion": "Calle 11",
        "latitud": 8.2376,
        "longitud": -73.3561,
    }
    r = client.post("/reportes", json=datos, headers=ciudadano)
    assert r.status_code == 201, r.text
    return r.json()
