export const MAX_MB = 10;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];

// Revisión rápida en el navegador; el backend vuelve a validar el contenido real del archivo
export function errorFoto(archivo) {
  if (!archivo) return "Agrega una foto del residuo";
  if (!TIPOS.includes(archivo.type)) return "Solo se aceptan imágenes JPG, PNG o WEBP";
  if (archivo.size > MAX_MB * 1024 * 1024) return `La imagen supera los ${MAX_MB} MB`;
  return "";
}

// Vercel (plan gratuito) no acepta peticiones de más de 4,5 MB, y las fotos del celular
// suelen pesar más. Antes de subirla se reduce a 1920 px de lado como máximo, en JPG.
const LIMITE_SIN_REDUCIR = 1.5 * 1024 * 1024;
const LADO_MAXIMO = 1920;

export async function reducirFoto(archivo) {
  if (archivo.size <= LIMITE_SIN_REDUCIR) return archivo;
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close();
    const blob = await new Promise((resolver) => lienzo.toBlob(resolver, "image/jpeg", 0.82));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], archivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}
