from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import solo_admin
from database import get_db
from models import Reporte, Usuario
from reportes import a_resumen
from schemas import Estado, ReporteAdmin

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/reportes", response_model=list[ReporteAdmin])
def listar_todos(
    estado: Estado | None = Query(default=None),
    barrio: str | None = Query(default=None, max_length=80),
    db: Session = Depends(get_db),
    admin: Usuario = Depends(solo_admin),
):
    consulta = (
        select(Reporte, Usuario.nombre_completo)
        .join(Usuario, Usuario.id == Reporte.usuario_id)
        .order_by(Reporte.creado_en.desc(), Reporte.id.desc())
    )
    if estado:
        consulta = consulta.where(Reporte.estado == estado)
    if barrio:
        consulta = consulta.where(Reporte.barrio.ilike(f"%{barrio.strip()}%"))

    return [
        ReporteAdmin(
            **a_resumen(r).model_dump(),
            ciudadano=nombre,
            cuadrilla=r.cuadrilla,
            tiene_foto=r.foto_url is not None,
            tiene_foto_cierre=r.foto_cierre_url is not None,
        )
        for r, nombre in db.execute(consulta)
    ]
