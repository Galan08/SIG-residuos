import { useAuth } from "../AuthContext";

export default function Inicio() {
  const { usuario } = useAuth();
  return (
    <div className="contenido">
      <h2>Hola, {usuario?.nombre_completo?.split(" ")[0]}</h2>
      <p className="sub">Aquí irá el formulario para reportar residuos.</p>
    </div>
  );
}
