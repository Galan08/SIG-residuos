import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { mensajeError } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(correo.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app">
      <div className="hero">
        <div className="marca">📍 SIG-residuos</div>
        <h1>Cuidemos juntos nuestra Ocaña.</h1>
        <p>Reporta, haz seguimiento y ayuda a mantener limpio tu barrio.</p>
      </div>

      <form className="contenido" onSubmit={enviar}>
        <h2>¡Qué bueno verte!</h2>
        <p className="sub">Inicia sesión y sigue el estado de tus reportes.</p>

        {error && <div className="error">{error}</div>}

        <label className="campo">
          Correo electrónico
          <input
            type="email"
            placeholder="tu@correo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </label>

        <label className="campo">
          Contraseña
          <div className="con-boton">
            <input
              type={ver ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="ojo" onClick={() => setVer(!ver)}>
              {ver ? "Ocultar" : "Ver"}
            </button>
          </div>
        </label>

        <button className="btn" disabled={cargando}>
          {cargando ? "Ingresando..." : "Iniciar sesión →"}
        </button>

        <p className="pie">
          ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
        <p className="lema">Tu comunidad. Tu entorno. Tu huella positiva.</p>
      </form>
    </div>
  );
}