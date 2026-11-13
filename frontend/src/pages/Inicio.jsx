import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api, { mensajeError } from "../api";
import MapaUbicacion from "../components/MapaUbicacion";
import SelectorFoto from "../components/SelectorFoto";
import { ICONOS } from "../estados";
import { errorFoto } from "../fotos";
import { OCANA, coordenadas } from "../mapa";

const PASOS = ["Ubicación", "Foto", "Descripción"];
const TIPOS = Object.keys(ICONOS);

export default function Inicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [paso, setPaso] = useState(0);
  const [posicion, setPosicion] = useState(OCANA);
  const [ubicada, setUbicada] = useState(false);
  const [barrio, setBarrio] = useState(usuario?.barrio ?? "");
  const [direccion, setDireccion] = useState("");
  const [foto, setFoto] = useState(null);
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(false);

  function moverMarcador(p) {
    setPosicion(p);
    setUbicada(true);
  }

  function usarGps() {
    setError("");
    if (!navigator.geolocation) return setError("Tu navegador no permite obtener la ubicación");
    setBuscandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        moverMarcador([pos.coords.latitude, pos.coords.longitude]);
        setBuscandoGps(false);
      },
      () => {
        setError("No se pudo obtener tu ubicación. Mueve el marcador en el mapa.");
        setBuscandoGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function validar(n) {
    if (n === 0) {
      if (!ubicada) return "Marca el punto en el mapa o usa tu ubicación actual";
      if (barrio.trim().length < 2) return "Escribe el barrio";
    }
    if (n === 1) return errorFoto(foto);
    if (n === 2) {
      if (!tipo) return "Elige el tipo de residuo";
      if (descripcion.trim().length < 5) return "Describe el residuo (mínimo 5 caracteres)";
    }
    return "";
  }

  function siguiente() {
    const e = validar(paso);
    setError(e);
    if (!e) setPaso(paso + 1);
  }

  async function enviar() {
    const e = validar(2);
    setError(e);
    if (e) return;

    setEnviando(true);
    let id = null;
    try {
      const { data } = await api.post("/reportes", {
        tipo_residuo: tipo,
        descripcion: descripcion.trim(),
        barrio: barrio.trim(),
        direccion: direccion.trim() || null,
        latitud: posicion[0],
        longitud: posicion[1],
      });
      id = data.id;
      const datos = new FormData();
      datos.append("archivo", foto);
      await api.post(`/reportes/${id}/foto`, datos);
      navigate(`/mis-reportes/${id}`, { state: { creado: true } });
    } catch (err) {
      if (id) {
        setAviso(`El reporte SR-${String(id).padStart(4, "0")} se guardó, pero la foto no: ${mensajeError(err)}`);
      } else {
        setError(mensajeError(err));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenido">
      <h2>Reportar residuos</h2>
      <p className="sub">Hola, {usuario?.nombre_completo?.split(" ")[0]}. Cuéntanos dónde hay residuos acumulados.</p>

      <ol className="pasos">
        {PASOS.map((p, i) => (
          <li key={p} className={i === paso ? "actual" : i < paso ? "hecho" : ""}>
            <span>{i < paso ? "✓" : i + 1}</span>
            {p}
          </li>
        ))}
      </ol>

      {error && <div className="error">{error}</div>}
      {aviso && (
        <div className="error">
          {aviso} <Link to="/mis-reportes">Ver mis reportes</Link>
        </div>
      )}

      {paso === 0 && (
        <>
          <p className="ayuda">Arrastra el marcador o toca el mapa en el punto exacto.</p>
          <MapaUbicacion posicion={posicion} onCambio={moverMarcador} />
          <button type="button" className="btn contorno" onClick={usarGps} disabled={buscandoGps}>
            {buscandoGps ? "Buscando tu ubicación..." : "📍 Usar mi ubicación actual"}
          </button>
          <p className="coordenadas">
            {ubicada ? `Coordenadas: ${coordenadas(posicion[0], posicion[1])}` : "Aún no has marcado el punto"}
          </p>
          <label className="campo">
            Barrio
            <input value={barrio} onChange={(e) => setBarrio(e.target.value)} placeholder="Ej. Centro" />
          </label>
          <label className="campo">
            Dirección o referencia (opcional)
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Calle 11 con Carrera 12" />
          </label>
        </>
      )}

      {paso === 1 && (
        <>
          <p className="ayuda">Una foto clara ayuda a la cuadrilla a saber qué llevar. JPG, PNG o WEBP de hasta 10 MB.</p>
          <SelectorFoto archivo={foto} onCambio={(f) => { setFoto(f); setError(errorFoto(f)); }} />
        </>
      )}

      {paso === 2 && (
        <>
          <p className="campo">Tipo de residuo</p>
          <div className="tipos">
            {TIPOS.map((t) => (
              <button type="button" key={t} className={`tipo ${tipo === t ? "activo" : ""}`} onClick={() => setTipo(t)}>
                <span>{ICONOS[t]}</span>
                {t}
              </button>
            ))}
          </div>
          <label className="campo">
            Descripción
            <textarea
              rows="4"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿Qué hay y desde cuándo?"
              maxLength={1000}
            />
          </label>
          <div className="info">
            <div><small>Ubicación</small>{direccion ? `${direccion} · ` : ""}{barrio} · {coordenadas(posicion[0], posicion[1])}</div>
            <div><small>Foto</small>{foto?.name}</div>
          </div>
        </>
      )}

      <div className="acciones">
        {paso > 0 && (
          <button type="button" className="btn contorno" onClick={() => { setError(""); setPaso(paso - 1); }}>
            ← Atrás
          </button>
        )}
        {paso < 2 ? (
          <button type="button" className="btn" onClick={siguiente}>Continuar →</button>
        ) : (
          <button type="button" className="btn" onClick={enviar} disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar reporte"}
          </button>
        )}
      </div>
    </div>
  );
}
