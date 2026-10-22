import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function RutaProtegida() {
  const { usuario } = useAuth();
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}