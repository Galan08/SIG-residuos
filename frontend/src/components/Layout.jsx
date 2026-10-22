import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
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
          <span>🏠</span>Inicio
        </NavLink>
        <NavLink to="/mis-reportes">
          <span>📋</span>Mis reportes
        </NavLink>
        <NavLink to="/perfil">
          <span>👤</span>Mi perfil
        </NavLink>
      </nav>
    </div>
  );
}