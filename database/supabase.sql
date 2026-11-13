-- Ejecutar en el SQL Editor de Supabase DESPUÉS de schema.sql (y de datos_prueba.sql si se usa).
-- No hace falta en una instalación local.

-- 1. Seguridad: Supabase publica las tablas del esquema public por su API REST.
--    La app solo entra por el backend (que se conecta como "postgres" y no se ve afectado),
--    así que se activa RLS sin políticas para que nadie las lea ni modifique desde esa API.
ALTER TABLE usuarios    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguimiento ENABLE ROW LEVEL SECURITY;

-- 2. Bucket público "fotos" para las imágenes de los reportes (máximo 10 MB, solo JPG, PNG y WEBP).
--    Cualquiera con el enlace puede ver una foto, pero solo el backend (con la clave secreta) puede subirlas.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos', 'fotos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
