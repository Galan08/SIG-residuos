from datetime import datetime

from geoalchemy2 import Geography
from geoalchemy2.elements import WKBElement
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre_completo: Mapped[str] = mapped_column(String(120))
    correo: Mapped[str] = mapped_column(String(120), unique=True)
    celular: Mapped[str | None] = mapped_column(String(20))
    barrio: Mapped[str | None] = mapped_column(String(80))
    password_hash: Mapped[str] = mapped_column(String(255))
    rol: Mapped[str] = mapped_column(String(20), default="ciudadano")
    notificaciones: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Reporte(Base):
    __tablename__ = "reportes"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    tipo_residuo: Mapped[str] = mapped_column(String(50))
    descripcion: Mapped[str] = mapped_column(Text)
    barrio: Mapped[str] = mapped_column(String(80))
    direccion: Mapped[str | None] = mapped_column(String(150))
    ubicacion: Mapped[WKBElement] = mapped_column(Geography(geometry_type="POINT", srid=4326))
    foto_url: Mapped[str | None] = mapped_column(String(255))
    foto_cierre_url: Mapped[str | None] = mapped_column(String(255))
    estado: Mapped[str] = mapped_column(String(20), default="pendiente")
    cuadrilla: Mapped[str | None] = mapped_column(String(80))
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resuelto_en: Mapped[datetime | None] = mapped_column(DateTime)

    seguimiento: Mapped[list["Seguimiento"]] = relationship(
        back_populates="reporte",
        order_by="Seguimiento.fecha, Seguimiento.id",
        cascade="all, delete-orphan",
    )


class Seguimiento(Base):
    __tablename__ = "seguimiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    reporte_id: Mapped[int] = mapped_column(ForeignKey("reportes.id", ondelete="CASCADE"))
    estado: Mapped[str] = mapped_column(String(20))
    nota: Mapped[str | None] = mapped_column(String(200))
    fecha: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    reporte: Mapped["Reporte"] = relationship(back_populates="seguimiento")