import { ESTADOS } from "../estados";

export default function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] ?? ESTADOS.pendiente;
  return <span className={`badge ${e.clase}`}>{e.texto}</span>;
}