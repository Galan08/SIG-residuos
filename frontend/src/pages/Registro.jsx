import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import api, { mensajeError } from "../api";

export default function Registro() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    celular: "",
    barrio: "",
    password: "",
    confirmar: "",
    terminos: false,
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function cambiar(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  }

  async function enviar(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      return setError("La contraseña debe tener mínimo 8 caracteres, una letra y un número");
    }
    if (form.password !== form.confirmar) {
      return setError("Las contraseñas no coinciden");
    }
    if (!form.terminos) {
      return setError("Debes aceptar los términos y condiciones");
    }

    setCargando(true);
    try {
      await api.post("/auth/registro", {
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim(),
        celular: form.celular.trim() || null,
        barrio: form.barrio.trim() || null,
        password: form.password,
      });
      await login(form.correo.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app">
      <div className="hero pequeno">
        <div className="marca">📍 SIG-residuos</div>
      </div>

      <form className="contenido" onSubmit={enviar}>
        <h2>¡Hagamos parte del cambio!</h2>
        <p className="sub">Crea tu cuenta y ayúdanos a cuidar una Ocaña más limpia y verde.</p>

        {error && <div className="error">{error}</div>}

        <label className="campo">
          Nombre completo
          <input name="nombre_completo" placeholder="Nombres y apellidos"
            value={form.nombre_completo} onChange={cambiar} required />
        </label>

        <label className="campo">
          Correo electrónico
          <input name="correo" type="email" placeholder="tu@correo.com"
            value={form.correo} onChange={cambiar} required />
        </label>

        <label className="campo">
          Celular (opcional)
          <input name="celular" placeholder="Tu número de celular"
            value={form.celular} onChange={cambiar} />
        </label>

        <label className="campo">
          Barrio (opcional)
          <input name="barrio" placeholder="Barrio donde vives"
            value={form.barrio} onChange={cambiar} />
        </label>

        <label className="campo">
          Contraseña
          <input name="password" type="password" placeholder="Crea una contraseña"
            value={form.password} onChange={cambiar} required />
        </label>

        <label className="campo">
          Confirmar contraseña
          <input name="confirmar" type="password" placeholder="Repite tu contraseña"
            value={form.confirmar} onChange={cambiar} required />
        </label>

        <label className="check">
          <input name="terminos" type="checkbox" checked={form.terminos} onChange={cambiar} />
          Acepto los términos y condiciones y la política de privacidad.
        </label>

        <button className="btn" disabled={cargando}>
          {cargando ? "Creando cuenta..." : "Registrarme →"}
        </button>

        <p className="pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}