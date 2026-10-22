import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { mensajeError } from "../api";
import EstadoBadge from "../components/EstadoBadge";
import { ICONOS, fechaCorta } from "../estados";

const FILTROS = [
  { clave: "todos", texto: "Todos" },
  { clave: "pendiente", texto: "Pendiente" },
  { clave: "en_proceso", texto: "En proceso" },
  { clave: "limpio", texto: "Limpio" },
];

export default function MisReportes() {
  const [reportes, setReportes] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reportes")
      .then(({ data }) => setReportes(data))
      .catch((err) => setError(mensajeError(err)))
      .finally(() => setCargando(false));
  }, []);

  const cuenta = (clave) =>
    clave === "todos" ? reportes.length : reportes.filter((r) => r.estado === clave).length;

  const visibles = filtro === "todos" ? reportes : reportes.filter((r) => r.estado === filtro);
  const limpios = cuenta("limpio");
  const porcentaje = reportes.length ? Math.round((limpios / reportes.length) * 100) : 0;

  if (cargando) return <div className="contenido sub">Cargando tus reportes...</div>;
  if (error) return <div className="contenido"><div className="error">{error}</div></div>;

  return (
    <div className="contenido">
      <h2>Mis reportes</h2>
      <p className="sub">Sigue el estado de cada reporte que has enviado.</p>

      <div className="aporte">
        <small>TU APORTE EN OCAÑA</small>
        <strong>
          {limpios} de {reportes.length} reportes ya están limpios
        </strong>
        <div className="progreso">
          <div style={{ width: `${porcentaje}%` }} />
        </div>
      </div>

      <div className="chips">
        {FILTROS.map((f) => (
          <button
            key={f.clave}
            className={`chip ${filtro === f.clave ? "activo" : ""}`}
            onClick={() => setFiltro(f.clave)}
          >
            {f.texto} {cuenta(f.clave)}
          </button>
        ))}
      </div>

      <p className="contador">
        Mostrando {visibles.length} de {reportes.length} reportes
      </p>

      {reportes.length === 0 && (
        <p className="sub">
          Aún no has enviado reportes. <Link to="/">Reporta tu primer punto</Link>
        </p>
      )}

      {visibles.map((r) => (
        <Link key={r.id} to={`/mis-reportes/${r.id}`} className="reporte">
          <div className="icono">{ICONOS[r.tipo_residuo] ?? "🗑️"}</div>
          <div className="datos">
            <strong>{r.tipo_residuo}</strong>
            <span>{r.direccion || r.barrio} · {r.barrio}</span>
            <div className="meta">
              <span>
                {fechaCorta(r.creado_en)} · #{r.codigo}
              </span>
              <EstadoBadge estado={r.estado} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}