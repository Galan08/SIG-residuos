from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import usuario_actual
from database import get_db
from models import Reporte, Usuario
from schemas import AporteOut, NotificacionesIn, PerfilIn, PerfilOut

router = APIRouter(prefix="/perfil", tags=["Perfil"])


def construir_perfil(db: Session, usuario: Usuario) -> PerfilOut:
    filas = db.execute(
        select(Reporte.estado, func.count())
        .where(Reporte.usuario_id == usuario.id)
        .group_by(Reporte.estado)
    ).all()
    conteo = {estado: cantidad for estado, cantidad in filas}

    aporte = AporteOut(
        total=sum(conteo.values()),
        pendientes=conteo.get("pendiente", 0),
        en_proceso=conteo.get("en_proceso", 0),
        limpios=conteo.get("limpio", 0),
    )
    return PerfilOut(
        id=usuario.id,
        nombre_completo=usuario.nombre_completo,
        correo=usuario.correo,
        celular=usuario.celular,
        barrio=usuario.barrio,
        rol=usuario.rol,
        notificaciones=usuario.notificaciones,
        miembro_desde=usuario.creado_en,
        aporte=aporte,
    )


@router.get("", response_model=PerfilOut)
def ver_perfil(db: Session = Depends(get_db), usuario: Usuario = Depends(usuario_actual)):
    return construir_perfil(db, usuario)


@router.put("", response_model=PerfilOut)
def editar_perfil(
    datos: PerfilIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    usuario.nombre_completo = datos.nombre_completo.strip()
    usuario.celular = (datos.celular or "").strip() or None
    usuario.barrio = (datos.barrio or "").strip() or None
    db.commit()
    db.refresh(usuario)
    return construir_perfil(db, usuario)


@router.patch("/notificaciones", response_model=PerfilOut)
def cambiar_notificaciones(
    datos: NotificacionesIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    usuario.notificaciones = datos.notificaciones
    db.commit()
    db.refresh(usuario)
    return construir_perfil(db, usuario)