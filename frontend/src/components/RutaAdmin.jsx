import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function RutaAdmin() {
  const { usuario } = useAuth();
  return usuario?.rol === "administrador" ? <Outlet /> : <Navigate to="/" replace />;
}
