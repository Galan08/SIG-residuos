"""Dónde se guardan las fotos de los reportes.

- En local se guardan en backend/uploads/reportes y el backend las sirve en /uploads.
- En la nube (Vercel) el disco es de solo lectura, así que se suben a Supabase Storage
  cuando están definidas SUPABASE_URL y SUPABASE_SECRET_KEY.
"""
import os
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, status

load_dotenv()

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "fotos")

TIPOS = {".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def usa_supabase() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SECRET_KEY)


def guardar(ruta: str, contenido: bytes, extension: str) -> str:
    """Guarda el archivo y devuelve la URL con la que se muestra en el frontend."""
    if usa_supabase():
        return _subir_a_supabase(ruta, contenido, TIPOS[extension])
    destino = UPLOAD_DIR / ruta
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(contenido)
    return f"/uploads/{ruta}"


def _subir_a_supabase(ruta: str, contenido: bytes, tipo: str) -> str:
    cabeceras = {"apikey": SUPABASE_SECRET_KEY, "Content-Type": tipo, "x-upsert": "true"}
    if SUPABASE_SECRET_KEY.startswith("eyJ"):
        # Clave antigua "service_role" (JWT): también va en Authorization
        cabeceras["Authorization"] = f"Bearer {SUPABASE_SECRET_KEY}"
    peticion = urllib.request.Request(
        f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{ruta}",
        data=contenido,
        headers=cabeceras,
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion, timeout=20):
            pass
    except (urllib.error.URLError, TimeoutError) as error:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "No se pudo guardar la foto, intenta de nuevo"
        ) from error
    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{ruta}"
