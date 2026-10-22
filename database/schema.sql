-- Ejecutar sobre la base de datos "sig-residuos"
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    celular VARCHAR(20),
    barrio VARCHAR(80),
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'ciudadano',
    notificaciones BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reportes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_residuo VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    barrio VARCHAR(80) NOT NULL,
    direccion VARCHAR(150),
    ubicacion GEOGRAPHY(Point, 4326) NOT NULL,
    foto_url VARCHAR(255),
    foto_cierre_url VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'en_proceso', 'limpio')),
    cuadrilla VARCHAR(80),
    creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    resuelto_en TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seguimiento (
    id SERIAL PRIMARY KEY,
    reporte_id INTEGER NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL
        CHECK (estado IN ('pendiente', 'en_proceso', 'limpio')),
    nota VARCHAR(200),
    fecha TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reportes_ubicacion ON reportes USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_reportes_usuario ON reportes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes (estado);