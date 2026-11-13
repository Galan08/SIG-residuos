from fastapi import APIRouter, Depends, HTTPException, Query, status
from geoalchemy2 import WKTElement
from geoalchemy2.shape import to_shape
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from pathlib import Path
from uuid import uuid4
import json

from fastapi import File, UploadFile
from auth import solo_admin, usuario_actual
from database import get_db
from models import Reporte, Seguimiento, Usuario
from schemas import CambioEstadoIn, Estado, ReporteDetalle, ReporteIn, ReporteResumen, SeguimientoOut

router = APIRouter(prefix="/reportes", tags=["Reportes"])

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads" / "reportes"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


def detectar_extension(contenido: bytes) -> str | None:
    # Se mira el contenido real del archivo, no el nombre ni el tipo que declara el cliente
    if contenido.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if contenido.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if contenido[:4] == b"RIFF" and contenido[8:12] == b"WEBP":
        return ".webp"
    return None


def guardar_imagen(archivo: UploadFile, reporte_id: int) -> str:
    contenido = archivo.file.read(MAX_BYTES + 1)
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "La imagen supera los 10 MB")

    extension = detectar_extension(contenido)
    if extension is None:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Solo se aceptan imágenes JPG, PNG o WEBP"
        )

    nombre = f"{reporte_id}-{uuid4().hex}{extension}"
    (UPLOAD_DIR / nombre).write_bytes(contenido)
    return f"/uploads/reportes/{nombre}"


def a_resumen(r: Reporte) -> ReporteResumen:
    return ReporteResumen(
        id=r.id,
        codigo=f"SR-{r.id:04d}",
        tipo_residuo=r.tipo_residuo,
        direccion=r.direccion,
        barrio=r.barrio,
        estado=r.estado,
        creado_en=r.creado_en,
    )


def a_detalle(r: Reporte) -> ReporteDetalle:
    punto = to_shape(r.ubicacion)  # x = longitud, y = latitud
    return ReporteDetalle(
        **a_resumen(r).model_dump(),
        descripcion=r.descripcion,
        latitud=punto.y,
        longitud=punto.x,
        foto_url=r.foto_url,
        foto_cierre_url=r.foto_cierre_url,
        cuadrilla=r.cuadrilla,
        resuelto_en=r.resuelto_en,
        seguimiento=[SeguimientoOut.model_validate(s) for s in r.seguimiento],
    )


@router.post("", response_model=ReporteDetalle, status_code=status.HTTP_201_CREATED)
def crear_reporte(
    datos: ReporteIn,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    reporte = Reporte(
        usuario_id=usuario.id,
        tipo_residuo=datos.tipo_residuo,
        descripcion=datos.descripcion.strip(),
        barrio=datos.barrio.strip(),
        direccion=datos.direccion,
        ubicacion=WKTElement(f"POINT({datos.longitud} {datos.latitud})", srid=4326),
        estado="pendiente",
    )
    reporte.seguimiento.append(Seguimiento(estado="pendiente", nota="Reporte recibido"))
    db.add(reporte)
    db.commit()
    db.refresh(reporte)
    return a_detalle(reporte)


@router.get("", response_model=list[ReporteResumen])
def listar_reportes(
    estado: Estado | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    consulta = (
        select(Reporte)
        .where(Reporte.usuario_id == usuario.id)
        .order_by(Reporte.creado_en.desc(), Reporte.id.desc())
    )
    if estado:
        consulta = consulta.where(Reporte.estado == estado)
    return [a_resumen(r) for r in db.scalars(consulta)]


@router.get("/mapa")
def mapa_reportes(
    estado: Estado | None = Query(default=None),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    """Reportes como GeoJSON para el mapa: el ciudadano ve los suyos y el administrador todos."""
    consulta = select(Reporte, func.ST_AsGeoJSON(Reporte.ubicacion)).order_by(Reporte.id)
    if usuario.rol != "administrador":
        consulta = consulta.where(Reporte.usuario_id == usuario.id)
    if estado:
        consulta = consulta.where(Reporte.estado == estado)

    features = []
    for r, geometria in db.execute(consulta):
        features.append(
            {
                "type": "Feature",
                "geometry": json.loads(geometria),
                "properties": {
                    "id": r.id,
                    "codigo": f"SR-{r.id:04d}",
                    "tipo_residuo": r.tipo_residuo,
                    "barrio": r.barrio,
                    "direccion": r.direccion,
                    "estado": r.estado,
                    "creado_en": r.creado_en.isoformat(),
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}


@router.get("/{reporte_id}", response_model=ReporteDetalle)
def detalle_reporte(
    reporte_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    reporte = db.get(Reporte, reporte_id)
    es_dueno = reporte is not None and reporte.usuario_id == usuario.id
    if reporte is None or not (es_dueno or usuario.rol == "administrador"):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reporte no encontrado")
    return a_detalle(reporte)


@router.patch("/{reporte_id}/estado", response_model=ReporteDetalle)
def cambiar_estado(
    reporte_id: int,
    datos: CambioEstadoIn,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(solo_admin),
):
    reporte = db.get(Reporte, reporte_id)
    if reporte is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reporte no encontrado")

    misma_cuadrilla = not datos.cuadrilla or datos.cuadrilla == reporte.cuadrilla
    if reporte.estado == datos.estado and misma_cuadrilla:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"El reporte ya está en estado {datos.estado}",
        )
     
    if datos.estado == "limpio" and not reporte.foto_cierre_url:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Sube la foto de cierre antes de marcar el reporte como limpio",
        )

    if datos.cuadrilla:
        reporte.cuadrilla = datos.cuadrilla

    reporte.estado = datos.estado
    reporte.resuelto_en = func.now() if datos.estado == "limpio" else None

    nota = datos.nota
    if not nota:
        if datos.estado == "en_proceso":
            nota = f"En proceso: {reporte.cuadrilla}" if reporte.cuadrilla else "En proceso"
        elif datos.estado == "limpio":
            nota = "Limpio"
        else:
            nota = "Reporte recibido"

    reporte.seguimiento.append(Seguimiento(estado=datos.estado, nota=nota))
    db.commit()
    db.refresh(reporte)
    return a_detalle(reporte)

@router.post("/{reporte_id}/foto", response_model=ReporteDetalle)
def subir_foto(
    reporte_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(usuario_actual),
):
    reporte = db.get(Reporte, reporte_id)
    if reporte is None or reporte.usuario_id != usuario.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reporte no encontrado")

    reporte.foto_url = guardar_imagen(archivo, reporte.id)
    db.commit()
    db.refresh(reporte)
    return a_detalle(reporte)


@router.post("/{reporte_id}/foto-cierre", response_model=ReporteDetalle)
def subir_foto_cierre(
    reporte_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: Usuario = Depends(solo_admin),
):
    reporte = db.get(Reporte, reporte_id)
    if reporte is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reporte no encontrado")

    reporte.foto_cierre_url = guardar_imagen(archivo, reporte.id)
    db.commit()
    db.refresh(reporte)
    return a_detalle(reporte)
