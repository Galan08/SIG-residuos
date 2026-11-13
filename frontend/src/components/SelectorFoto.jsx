import { useEffect, useMemo } from "react";

// Elegir una foto de la galería o tomarla con la cámara del celular, con vista previa
export default function SelectorFoto({ archivo, onCambio, texto = "Toma o sube una foto", compacto = false }) {
  const vista = useMemo(() => (archivo ? URL.createObjectURL(archivo) : ""), [archivo]);
  useEffect(() => () => vista && URL.revokeObjectURL(vista), [vista]);

  return (
    <label className={`selector-foto ${compacto && !archivo ? "compacto" : ""}`}>
      {vista ? <img src={vista} alt="Vista previa de la foto" /> : <span>📷<br />{texto}</span>}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(e) => onCambio(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}
