import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool

load_dotenv()


def _url_conexion():
    # En la nube (Supabase) se usa DATABASE_URL; en local, las variables DB_* de siempre
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        url = make_url(database_url).set(drivername="postgresql+psycopg2")
        if "sslmode" not in url.query:
            url = url.update_query_dict({"sslmode": "require"})
        return url
    return URL.create(
        "postgresql+psycopg2",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME"),
    )


# En Vercel cada petición puede correr en una instancia nueva, así que no se guarda
# un pool de conexiones: de eso se encarga el pooler de Supabase.
if os.getenv("VERCEL") or os.getenv("DATABASE_URL"):
    engine = create_engine(_url_conexion(), poolclass=NullPool)
else:
    engine = create_engine(_url_conexion())

SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
