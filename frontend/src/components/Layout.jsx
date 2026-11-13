import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Layout() {
  const { usuario } = useAuth();
  return (
    <div className="app">
      <header className="cabecera">
        <span className="logo">📍</span>
        <div>
          <strong>SIG-residuos</strong>
          <small>Georreferenciación para un entorno limpio</small>
        </div>
      </header>

      <main className="principal">
        <Outlet />
      </main>

      <nav className="barra">
        <NavLink to="/" end>
          <span>➕</span>Reportar
        </NavLink>
        <NavLink to="/mapa">
          <span>🗺️</span>Mapa
        </NavLink>
        <NavLink to="/mis-reportes">
          <span>📋</span>Mis reportes
        </NavLink>
        {usuario?.rol === "administrador" && (
          <NavLink to="/admin">
            <span>🛠️</span>Gestión
          </NavLink>
        )}
        <NavLink to="/perfil">
          <span>👤</span>Mi perfil
        </NavLink>
      </nav>
    </div>
  );
}