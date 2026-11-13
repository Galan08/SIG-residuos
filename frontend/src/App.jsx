import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Layout from "./components/Layout";
import RutaProtegida from "./components/RutaProtegida";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import MisReportes from "./pages/MisReportes";
import Perfil from "./pages/Perfil";
import Registro from "./pages/Registro";
import DetalleReporte from "./pages/DetalleReporte";
import Mapa from "./pages/Mapa";
import AdminReportes from "./pages/AdminReportes";
import GestionarReporte from "./pages/GestionarReporte";
import RutaAdmin from "./components/RutaAdmin";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route element={<RutaProtegida />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Inicio />} />
              <Route path="/mis-reportes" element={<MisReportes />} />
              <Route path="/mis-reportes/:id" element={<DetalleReporte />} />
              <Route path="/mapa" element={<Mapa />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route element={<RutaAdmin />}>
                <Route path="/admin" element={<AdminReportes />} />
                <Route path="/admin/reportes/:id" element={<GestionarReporte />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}