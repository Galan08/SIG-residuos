import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { mensajeError } from "../api";
import EstadoBadge from "../components/EstadoBadge";
import { ESTADOS, ICONOS, fechaCorta } from "../estados";

const FILTROS = [{ clave: "", texto: "Todos" }, ...Object.entries(ESTADOS).map(([clave, e]) => ({ clave, texto: e.texto }))];

export default function AdminReportes() {
  const [filtro, setFiltro] = useState("pendiente");
  const [barrio, setBarrio] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [resultado, setResultado] = useState({ clave: null, reportes: [] });
  const [error, setError] = useState("");
  const clave = `${filtro}|${busqueda}`;

  useEffect(() => {
    let vigente = true;
    const params = {};
    if (filtro) params.estado = filtro;
    if (busqueda) params.barrio = busqueda;
    api
      .get("/admin/reportes", { params })
      .then(({ data }) => vigente && setResultado({ clave, reportes: data }))
      .catch((err) => vigente && setError(mensajeError(err)));
    return () => {
      vigente = false;
    };
  }, [filtro, busqueda, clave]);

  const cargando = resultado.clave !== clave && !error;
  const reportes = resultado.reportes;

  return (
    <div className="contenido">
      <h2>Gestión de reportes</h2>
      <p className="sub">Asigna la cuadrilla, actualiza el estado y cierra con la foto de la limpieza.</p>

      <form
        className="buscar"
        onSubmit={(e) => {
          e.preventDefault();
          setBusqueda(barrio.trim());
        }}
      >
        <input value={barrio} onChange={(e) => setBarrio(e.target.value)} placeholder="Filtrar por barrio" />
        <button className="chip activo">Buscar</button>
      </form>

      <div className="chips">
        {FILTROS.map((f) => (
          <button key={f.texto} className={`chip ${filtro === f.clave ? "activo" : ""}`} onClick={() => setFiltro(f.clave)}>
            {f.texto}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}
      {cargando ? (
        <p className="contador">Cargando...</p>
      ) : (
        <p className="contador">{reportes.length} reportes</p>
      )}
      {!cargando && !error && reportes.length === 0 && <div className="aviso vacio">No hay reportes con este filtro.</div>}

      {reportes.map((r) => (
        <Link key={r.id} to={`/admin/reportes/${r.id}`} className="reporte">
          <div className="icono">{ICONOS[r.tipo_residuo] ?? "🗑️"}</div>
          <div className="datos">
            <strong>{r.tipo_residuo}</strong>
            <span>{r.direccion ? `${r.direccion} · ` : ""}{r.barrio}</span>
            <span>Reportó: {r.ciudadano}{r.cuadrilla ? ` · ${r.cuadrilla}` : ""}</span>
            <div className="meta">
              <span>
                {fechaCorta(r.creado_en)} · #{r.codigo}
                {r.tiene_foto_cierre ? " · 📷 cierre" : ""}
              </span>
              <EstadoBadge estado={r.estado} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
