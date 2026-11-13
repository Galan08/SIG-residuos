from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from reportes import router as reportes_router
from auth import router as auth_router
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from perfil import router as perfil_router
from admin import router as admin_router

app = FastAPI(title="SIG-Residuos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # puerto por defecto de Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(reportes_router)
app.include_router(perfil_router)
app.include_router(admin_router)
app.mount("/uploads", StaticFiles(directory=Path(__file__).resolve().parent / "uploads"), name="uploads")

@app.get("/")
def raiz():
    return {"mensaje": "SIG-Residuos API funcionando"}