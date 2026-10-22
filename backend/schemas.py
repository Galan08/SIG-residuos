from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Literal

class RegistroIn(BaseModel):
    nombre_completo: str = Field(min_length=3, max_length=120)
    correo: EmailStr
    celular: str | None = Field(default=None, max_length=20)
    barrio: str | None = Field(default=None, max_length=80)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_valida(cls, v: str) -> str:
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe tener al menos una letra y un número")
        return v


class LoginIn(BaseModel):
    correo: EmailStr
    password: str


class UsuarioOut(BaseModel):
    id: int
    nombre_completo: str
    correo: str
    celular: str | None
    barrio: str | None
    rol: str

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut

TipoResiduo = Literal["Bolsas domésticas", "Escombros", "Voluminosos", "Vegetación / poda"]
Estado = Literal["pendiente", "en_proceso", "limpio"]


class ReporteIn(BaseModel):
    tipo_residuo: TipoResiduo
    descripcion: str = Field(min_length=5, max_length=1000)
    barrio: str = Field(min_length=2, max_length=80)
    direccion: str | None = Field(default=None, max_length=150)
    latitud: float = Field(ge=-90, le=90)
    longitud: float = Field(ge=-180, le=180)


class SeguimientoOut(BaseModel):
    estado: Estado
    nota: str | None
    fecha: datetime

    model_config = {"from_attributes": True}


class ReporteResumen(BaseModel):
    id: int
    codigo: str
    tipo_residuo: str
    direccion: str | None
    barrio: str
    estado: Estado
    creado_en: datetime


class ReporteDetalle(ReporteResumen):
    descripcion: str
    latitud: float
    longitud: float
    foto_url: str | None
    foto_cierre_url: str | None
    cuadrilla: str | None
    resuelto_en: datetime | None
    seguimiento: list[SeguimientoOut]

class CambioEstadoIn(BaseModel):
    estado: Estado
    cuadrilla: str | None = Field(default=None, max_length=80)
    nota: str | None = Field(default=None, max_length=200)


class AporteOut(BaseModel):
    total: int
    pendientes: int
    en_proceso: int
    limpios: int

class PerfilOut(BaseModel):
    id: int
    nombre_completo: str
    correo: str
    celular: str | None
    barrio: str | None
    rol: str
    notificaciones: bool
    miembro_desde: datetime
    aporte: AporteOut


class PerfilIn(BaseModel):
    nombre_completo: str = Field(min_length=3, max_length=120)
    celular: str | None = Field(default=None, max_length=20)
    barrio: str | None = Field(default=None, max_length=80)


class NotificacionesIn(BaseModel):
    notificaciones: bool