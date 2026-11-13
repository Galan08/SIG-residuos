import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { API_URL, mensajeError } from "../api";
import EstadoBadge from "../components/EstadoBadge";
import MapaUbicacion from "../components/MapaUbicacion";
import { fechaCorta, fechaHora } from "../estados";
import { coordenadas } from "../mapa";

const PASOS = [
  { estado: "pendiente", titulo: "Reporte recibido", espera: "" },
  { estado: "en_proceso", titulo: "En proceso", espera: "Aún sin cuadrilla asignada" },
  { estado: "limpio", titulo: "Limpio", espera: "Se confirmará con foto de cierre" },
];

function ultimoPaso(seguimiento, estado) {
  return [...seguimiento].reverse().find((s) => s.estado === estado);
}

function Foto({ url, texto }) {
  return (
    <div className="foto">
      {url ? <img src={`${API_URL}${url}`} alt={texto} /> : <span>{texto}</span>}
    </div>
  );
}

export default function DetalleReporte() {
  const { id } = useParams();
  const navigate = useNavigate();
  const creado = useLocation().state?.creado;
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/reportes/${id}`)
      .then(({ data }) => setReporte(data))
      .catch((err) => setError(mensajeError(err)));
  }, [id]);

  return (
    <>
      <div className="barra-atras">
        <button onClick={() => navigate(-1)} aria-label="Volver">←</button>
        Detalle del reporte
      </div>

      {error && (
        <div className="contenido">
          <div className="error">{error}</div>
          <Link to="/mis-reportes">Volver a mis reportes</Link>
        </div>
      )}

      {!reporte && !error && <div className="contenido sub">Cargando...</div>}

      {reporte && (
        <div className="contenido detalle">
          {creado && <div className="aviso exito">¡Reporte enviado! Te avisaremos cuando cambie su estado.</div>}
          <span className="codigo">#{reporte.codigo}</span>
          <h2>{reporte.tipo_residuo}</h2>
          <div className="meta-linea">
            <EstadoBadge estado={reporte.estado} />
            <span className="codigo">Enviado el {fechaCorta(reporte.creado_en)}</span>
          </div>

          {reporte.estado === "limpio" ? (
            <>
              <h3>Antes y después</h3>
              <div className="fotos doble">
                <Foto url={reporte.foto_url} texto="Tu foto" />
                <Foto url={reporte.foto_cierre_url} texto="Foto de cierre" />
              </div>
            </>
          ) : (
            <>
              <h3>Tu evidencia</h3>
              <div className="fotos">
                <Foto url={reporte.foto_url} texto="Sin foto" />
              </div>
              <div className="aviso">
                La foto de cierre aparecerá aquí cuando la cuadrilla termine la limpieza.
              </div>
            </>
          )}

          <h3>Ubicación</h3>
          <MapaUbicacion posicion={[reporte.latitud, reporte.longitud]} alto={180} />
          <p className="coordenadas">Coordenadas: {coordenadas(reporte.latitud, reporte.longitud)}</p>

          <h3>Seguimiento</h3>
          {PASOS.map((p) => {
            const paso = ultimoPaso(reporte.seguimiento, p.estado);
            const titulo =
              p.estado === "en_proceso" && paso && reporte.cuadrilla
                ? `En proceso · ${reporte.cuadrilla}`
                : p.titulo;
            return (
              <div key={p.estado} className={`paso ${paso ? "hecho" : ""}`}>
                <div className="punto">{paso ? "✓" : ""}</div>
                <div>
                  <strong>{titulo}</strong>
                  <small>{paso ? fechaHora(paso.fecha) : p.espera}</small>
                </div>
              </div>
            );
          })}

          <div className="info">
            <div>
              <small>Tipo de residuo</small>
              {reporte.tipo_residuo}
            </div>
            <div>
              <small>Ubicación</small>
              {reporte.direccion ? `${reporte.direccion} · ` : ""}
              {reporte.barrio}
            </div>
            <div>
              <small>Tu descripción</small>
              {reporte.descripcion}
            </div>
            {reporte.cuadrilla && (
              <div>
                <small>Atendido por</small>
                {reporte.cuadrilla}
              </div>
            )}
            {reporte.resuelto_en && (
              <div>
                <small>Resuelto</small>
                {fechaHora(reporte.resuelto_en)}
              </div>
            )}
          </div>

          <Link to="/mis-reportes" className="btn contorno">
            Ver todos mis reportes
          </Link>
        </div>
      )}
    </>
  );
}