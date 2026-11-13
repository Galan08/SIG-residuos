-- Datos de prueba para la demo (ejecutar después de schema.sql, sobre la base "sig-residuos").
-- Borra los usuarios de prueba anteriores y vuelve a crearlos, así que se puede ejecutar varias veces.
-- Contraseña de todos los usuarios: Clave1234

DELETE FROM usuarios WHERE correo LIKE '%@prueba.sigresiduos';

INSERT INTO usuarios (nombre_completo, correo, celular, barrio, password_hash, rol) VALUES
  ('Administrador Demo', 'admin@prueba.sigresiduos', '3000000000', 'Centro', '$2b$12$yh/jZZFPeGPeUV4uTOabVe3RUQW8z6b5zAAkjYM5hT3AEU.qhyZrq', 'administrador'),
  ('Laura Pérez',        'laura@prueba.sigresiduos', '3001112233', 'Centro', '$2b$12$yh/jZZFPeGPeUV4uTOabVe3RUQW8z6b5zAAkjYM5hT3AEU.qhyZrq', 'ciudadano'),
  ('Andrés Quintero',    'andres@prueba.sigresiduos', '3004445566', 'Santa Clara', '$2b$12$yh/jZZFPeGPeUV4uTOabVe3RUQW8z6b5zAAkjYM5hT3AEU.qhyZrq', 'ciudadano');

WITH datos (correo, tipo, descripcion, barrio, direccion, lon, lat, estado, cuadrilla, dias) AS (
  VALUES
  ('laura@prueba.sigresiduos',  'Bolsas domésticas', 'Bolsas acumuladas en la esquina desde el fin de semana', 'Centro', 'Calle 11 con Carrera 12', -73.3561, 8.2376, 'pendiente', NULL, 2),
  ('laura@prueba.sigresiduos',  'Escombros', 'Escombros de una obra dejados sobre el andén', 'Centro', 'Carrera 13 # 10-20', -73.3549, 8.2389, 'en_proceso', 'Cuadrilla 2', 5),
  ('laura@prueba.sigresiduos',  'Voluminosos', 'Colchón y muebles viejos junto al parque', 'Centro', 'Parque principal', -73.3570, 8.2366, 'pendiente', NULL, 1),
  ('andres@prueba.sigresiduos', 'Vegetación / poda', 'Ramas cortadas que bloquean la cuneta', 'Santa Clara', 'Calle 7 # 20-15', -73.3528, 8.2342, 'pendiente', NULL, 3),
  ('andres@prueba.sigresiduos', 'Bolsas domésticas', 'Basura regada por perros en la vía', 'Santa Clara', 'Carrera 21 con Calle 8', -73.3517, 8.2351, 'en_proceso', 'Cuadrilla 1', 4),
  ('andres@prueba.sigresiduos', 'Escombros', 'Escombros en el lote vacío al lado de la quebrada', 'Santa Clara', NULL, -73.3539, 8.2331, 'pendiente', NULL, 6)
), nuevos AS (
  INSERT INTO reportes (usuario_id, tipo_residuo, descripcion, barrio, direccion, ubicacion, estado, cuadrilla, creado_en)
  SELECT u.id, d.tipo, d.descripcion, d.barrio, d.direccion,
         ST_SetSRID(ST_MakePoint(d.lon, d.lat), 4326)::geography,
         d.estado, d.cuadrilla, NOW() - make_interval(days => d.dias)
  FROM datos d JOIN usuarios u ON u.correo = d.correo
  RETURNING id, estado, cuadrilla, creado_en
)
INSERT INTO seguimiento (reporte_id, estado, nota, fecha)
SELECT id, 'pendiente', 'Reporte recibido', creado_en FROM nuevos
UNION ALL
SELECT id, 'en_proceso', 'En proceso: ' || cuadrilla, creado_en + INTERVAL '1 day' FROM nuevos WHERE estado = 'en_proceso';
