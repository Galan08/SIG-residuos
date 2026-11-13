import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { mensajeError, urlFoto } from "../api";
import EstadoBadge from "../components/EstadoBadge";
import MapaUbicacion from "../components/MapaUbicacion";
import SelectorFoto from "../components/SelectorFoto";
import { ESTADOS, fechaCorta, fechaHora } from "../estados";
import { errorFoto, reducirFoto } from "../fotos";
import { coordenadas } from "../mapa";

export default function GestionarReporte() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reporte, setReporte] = useState(null);
  const [estado, setEstado] = useState("");
  const [cuadrilla, setCuadrilla] = useState("");
  const [nota, setNota] = useState("");
  const [fotoCierre, setFotoCierre] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cargar(data) {
    setReporte(data);
    setEstado(data.estado);
    setCuadrilla(data.cuadrilla ?? "");
    setNota("");
    setFotoCierre(null);
  }

  useEffect(() => {
    api
      .get(`/reportes/${id}`)
      .then(({ data }) => cargar(data))
      .catch((err) => setError(mensajeError(err)));
  }, [id]);

  async function guardar(e) {
    e.preventDefault();
    setError("");
    setExito("");

    const cambiaEstado = estado !== reporte.estado || (cuadrilla.trim() && cuadrilla.trim() !== (reporte.cuadrilla ?? ""));
    if (fotoCierre && errorFoto(fotoCierre)) return setError(errorFoto(fotoCierre));
    if (estado === "limpio" && !fotoCierre && !reporte.foto_cierre_url) {
      return setError("Sube la foto de cierre para marcar el reporte como limpio");
    }
    if (!cambiaEstado && !fotoCierre) return setError("No hay cambios para guardar");

    setGuardando(true);
    try {
      let data = reporte;
      if (fotoCierre) {
        const datos = new FormData();
        datos.append("archivo", await reducirFoto(fotoCierre));
        data = (await api.post(`/reportes/${id}/foto-cierre`, datos)).data;
      }
      if (cambiaEstado) {
        data = (
          await api.patch(`/reportes/${id}/estado`, {
            estado,
            cuadrilla: cuadrilla.trim() || null,
            nota: nota.trim() || null,
          })
        ).data;
      }
      cargar(data);
      setExito("Cambios guardados");
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="barra-atras">
        <button onClick={() => navigate(-1)} aria-label="Volver">←</button>
        Gestionar reporte
      </div>

      {!reporte && !error && <div className="contenido sub">Cargando...</div>}
      {!reporte && error && (
        <div className="contenido">
          <div className="error">{error}</div>
          <Link to="/admin">Volver a la gestión</Link>
        </div>
      )}

      {reporte && (
        <form className="contenido detalle" onSubmit={guardar}>
          <span className="codigo">#{reporte.codigo}</span>
          <h2>{reporte.tipo_residuo}</h2>
          <div className="meta-linea">
            <EstadoBadge estado={reporte.estado} />
            <span className="codigo">Enviado el {fechaCorta(reporte.creado_en)}</span>
          </div>

          <h3>Evidencia del ciudadano</h3>
          <div className="foto">
            {reporte.foto_url ? <img src={urlFoto(reporte.foto_url)} alt="Foto del reporte" /> : <span>Sin foto</span>}
          </div>
          <p className="ayuda">{reporte.descripcion}</p>

          <h3>Ubicación</h3>
          <MapaUbicacion posicion={[reporte.latitud, reporte.longitud]} alto={180} />
          <p className="coordenadas">
            {reporte.direccion ? `${reporte.direccion} · ` : ""}{reporte.barrio} · {coordenadas(reporte.latitud, reporte.longitud)}
          </p>

          <h3>Atención</h3>
          {error && <div className="error">{error}</div>}
          {exito && <div className="aviso">{exito}</div>}

          <label className="campo">
            Estado
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              {Object.entries(ESTADOS).map(([clave, e]) => (
                <option key={clave} value={clave}>{e.texto}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            Cuadrilla asignada
            <input value={cuadrilla} onChange={(e) => setCuadrilla(e.target.value)} placeholder="Ej. Cuadrilla 2" maxLength={80} />
          </label>
          <label className="campo">
            Nota para el seguimiento (opcional)
            <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} />
          </label>

          <p className="campo">Foto de cierre {estado === "limpio" && !reporte.foto_cierre_url ? "(obligatoria)" : ""}</p>
          {reporte.foto_cierre_url && !fotoCierre ? (
            <div className="foto">
              <img src={urlFoto(reporte.foto_cierre_url)} alt="Foto de cierre" />
            </div>
          ) : null}
          <SelectorFoto
            archivo={fotoCierre}
            onCambio={setFotoCierre}
            compacto={Boolean(reporte.foto_cierre_url)}
            texto={reporte.foto_cierre_url ? "Cambiar la foto de cierre" : "Sube la foto de la limpieza"}
          />

          <button className="btn" disabled={guardando}>{guardando ? "Guardando..." : "Guardar cambios"}</button>

          <h3>Seguimiento</h3>
          {reporte.seguimiento.map((s, i) => (
            <div key={i} className="paso hecho">
              <div className="punto">✓</div>
              <div>
                <strong>{s.nota || ESTADOS[s.estado].texto}</strong>
                <small>{fechaHora(s.fecha)}</small>
              </div>
            </div>
          ))}
        </form>
      )}
    </>
  );
}
