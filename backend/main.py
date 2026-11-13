import os
import sys
from pathlib import Path

# Permite importar los módulos de esta carpeta también cuando Vercel arranca la app
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

import almacenamiento  # noqa: E402
from admin import router as admin_router  # noqa: E402
from auth import router as auth_router  # noqa: E402
from perfil import router as perfil_router  # noqa: E402
from reportes import router as reportes_router  # noqa: E402

app = FastAPI(title="SIG-Residuos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    # En local, el puerto por defecto de Vite. En la nube, la URL del frontend en
    # CORS_ORIGINS (varias separadas por coma).
    allow_origins=[o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(reportes_router)
app.include_router(perfil_router)
app.include_router(admin_router)
if not almacenamiento.usa_supabase():
    # En local las fotos se sirven desde el disco; en la nube las sirve Supabase Storage
    almacenamiento.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=almacenamiento.UPLOAD_DIR), name="uploads")

@app.get("/")
def raiz():
    return {"mensaje": "SIG-Residuos API funcionando"}