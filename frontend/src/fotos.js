export const MAX_MB = 10;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

// Revisión rápida en el navegador; el backend vuelve a validar el contenido real del archivo
export function errorFoto(archivo) {
  if (!archivo) return "Agrega una foto del residuo";
  if (!TIPOS.includes(archivo.type)) return "Solo se aceptan imágenes JPG, PNG o WEBP";
  if (archivo.size > MAX_MB * 1024 * 1024) return `La imagen supera los ${MAX_MB} MB`;
  return "";
}
