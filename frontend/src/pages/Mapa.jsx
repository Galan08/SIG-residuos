import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import api, { mensajeError } from "../api";
import { useAuth } from "../AuthContext";
import EstadoBadge from "../components/EstadoBadge";
import { ESTADOS, fechaCorta } from "../estados";
import { CAPA_OSM, COLOR_ESTADO, OCANA, ZOOM_INICIAL } from "../mapa";

const FILTROS = [{ clave: "", texto: "Todos" }, ...Object.entries(ESTADOS).map(([clave, e]) => ({ clave, texto: e.texto }))];

function Encuadrar({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (puntos.length > 1) map.fitBounds(puntos, { padding: [30, 30], maxZoom: 17 });
    else if (puntos.length === 1) map.setView(puntos[0], 16);
  }, [map, puntos]);
  return null;
}

export default function Mapa() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "administrador";
  const [filtro, setFiltro] = useState("");
  const [datos, setDatos] = useState({ filtro: null, features: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    api
      .get("/reportes/mapa", { params: filtro ? { estado: filtro } : {} })
      .then(({ data }) => vigente && setDatos({ filtro, features: data.features }))
      .catch((err) => vigente && setError(mensajeError(err)));
    return () => {
      vigente = false;
    };
  }, [filtro]);

  const cargando = datos.filtro !== filtro && !error;
  const features = datos.features;
  // GeoJSON guarda [longitud, latitud]; Leaflet usa [latitud, longitud]
  const puntos = useMemo(() => features.map((f) => [f.geometry.coordinates[1], f.geometry.coordinates[0]]), [features]);

  return (
    <div className="contenido">
      <h2>Mapa de reportes</h2>
      <p className="sub">{esAdmin ? "Todos los reportes de Ocaña." : "Dónde están los reportes que has enviado."}</p>

      <div className="chips">
        {FILTROS.map((f) => (
          <button key={f.texto} className={`chip ${filtro === f.clave ? "activo" : ""}`} onClick={() => setFiltro(f.clave)}>
            {f.texto}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}
      {!cargando && !error && features.length === 0 && (
        <div className="aviso vacio">No hay reportes {filtro ? `en estado "${ESTADOS[filtro].texto}"` : "para mostrar"} en el mapa.</div>
      )}
      {cargando && <p className="contador">Cargando reportes...</p>}
      {!cargando && features.length > 0 && <p className="contador">{features.length} reportes en el mapa</p>}

      <MapContainer center={OCANA} zoom={ZOOM_INICIAL} className="mapa" style={{ height: "58vh" }}>
        <TileLayer url={CAPA_OSM.url} attribution={CAPA_OSM.attribution} />
        {features.map((f, i) => {
          const p = f.properties;
          const color = COLOR_ESTADO[p.estado];
          return (
            <CircleMarker key={p.id} center={puntos[i]} radius={10} pathOptions={{ color, fillColor: color, fillOpacity: 0.7 }}>
              <Popup>
                <strong>{p.tipo_residuo}</strong>
                <br />
                <span className="codigo">#{p.codigo} · {fechaCorta(p.creado_en)}</span>
                <br />
                {p.direccion ? `${p.direccion} · ` : ""}{p.barrio}
                <br />
                <EstadoBadge estado={p.estado} />{" "}
                <Link to={esAdmin ? `/admin/reportes/${p.id}` : `/mis-reportes/${p.id}`}>Ver detalle</Link>
              </Popup>
            </CircleMarker>
          );
        })}
        <Encuadrar puntos={puntos} />
      </MapContainer>

      <div className="leyenda">
        {Object.entries(ESTADOS).map(([clave, e]) => (
          <span key={clave}><i style={{ background: COLOR_ESTADO[clave] }} />{e.texto}</span>
        ))}
      </div>
    </div>
  );
}
