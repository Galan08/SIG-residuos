export const ESTADOS = {
  pendiente: { texto: "Pendiente", clase: "pendiente" },
  en_proceso: { texto: "En proceso", clase: "proceso" },
  limpio: { texto: "Limpio", clase: "limpio" },
};

export const ICONOS = {
  "Bolsas domésticas": "🛍️",
  Escombros: "🧱",
  Voluminosos: "🛋️",
  "Vegetación / poda": "🌿",
};

export function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fechaHora(iso) {
  const f = new Date(iso);
  const hora = f.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
  return `${fechaCorta(iso)} · ${hora}`;
}