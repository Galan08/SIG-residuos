import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Perfil() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function salir() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="contenido">
      <h2>Mi perfil</h2>
      <p className="sub">{usuario?.nombre_completo} · {usuario?.correo}</p>
      <button className="btn secundario" onClick={salir}>Cerrar sesión</button>
    </div>
  );
}