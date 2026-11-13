# SIG-residuos

Aplicación web para reportar acumulación de residuos en Ocaña, Norte de Santander, ubicarlos en un mapa y hacer seguimiento hasta que el punto quede limpio.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Frontend | React (Vite) |
| Backend | Python + FastAPI |
| Base de datos | PostgreSQL + PostGIS |
| Mapas | Leaflet + OpenStreetMap |
| Autenticación | JWT |
| IA (en desarrollo) | Python, clasificación de residuos por imagen |

## Requisitos previos

Instala esto antes de empezar:

| Programa | Versión | Descarga |
|---|---|---|
| Git | cualquiera reciente | git-scm.com |
| Python | 3.11 o superior | python.org (marca "Add Python to PATH") |
| Node.js | 20.19+ o 22.12+ | nodejs.org |
| PostgreSQL | 14 o superior, con pgAdmin 4 | postgresql.org/download |
| PostGIS | la que corresponda a tu PostgreSQL | se instala con **Application Stack Builder** (Spatial Extensions) |

Comprueba las versiones:

```bash
git --version
python --version
node -v
psql --version
```

## Estructura del proyecto

```
SIG-residuos/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── security.py
│   ├── auth.py
│   ├── reportes.py
│   ├── perfil.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api.js
│   │   └── AuthContext.jsx
│   └── package.json
├── database/
│   └── schema.sql
└── README.md
```

## Instalación paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/darwingg777/SIG-residuos.git
cd SIG-residuos
```

### 2. Base de datos

1. Abre **pgAdmin 4** y conéctate a tu servidor.
2. Clic derecho en **Databases → Create → Database**. Nombre: `sig-residuos`.
3. Clic derecho en `sig-residuos` → **Query Tool**.
4. Abre el archivo `database/schema.sql` (icono de carpeta), pulsa **F5** y comprueba que no haya errores.

Si falla en `CREATE EXTENSION postgis`, falta instalar PostGIS con Application Stack Builder.

**Datos de prueba (opcional):** abre y ejecuta también `database/datos_prueba.sql`. Crea un administrador (`admin@prueba.sigresiduos`), dos ciudadanos (`laura@prueba.sigresiduos` y `andres@prueba.sigresiduos`) y seis reportes en Ocaña. La contraseña de todos es `Clave1234`. Se puede ejecutar varias veces: borra y vuelve a crear esos usuarios.

### 3. Backend (puerto 8000)

Desde la carpeta `backend`:

**Windows (CMD):**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

**Mac / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Abre `backend/.env` y completa tus datos:

```
DB_USER=postgres
DB_PASSWORD=la_contraseña_de_tu_postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sig-residuos
SECRET_KEY=pega_aqui_una_clave_larga
ACCESS_TOKEN_MINUTES=60
```

Genera la `SECRET_KEY` con:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Arranca el servidor (siempre con `(venv)` activo):

```bash
uvicorn main:app --reload
```

La documentación interactiva de la API queda en **http://localhost:8000/docs**.

### 4. Frontend (puerto 5173)

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173**.

> Usa `localhost`, no `127.0.0.1`: el backend solo permite ese origen (CORS).

## Cada vez que trabajes

Necesitas **dos terminales abiertas**:

| Terminal | Carpeta | Comando |
|---|---|---|
| 1 (backend) | `backend` | `venv\Scripts\activate` y luego `uvicorn main:app --reload` |
| 2 (frontend) | `frontend` | `npm run dev` |

## Crear un usuario administrador

El administrador cambia el estado de los reportes. Primero regístrate desde la aplicación y luego ejecuta en pgAdmin:

```sql
UPDATE usuarios SET rol = 'administrador' WHERE correo = 'tu_correo@ejemplo.com';
```

## Endpoints principales

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/registro` | Crear cuenta | Público |
| POST | `/auth/login` | Iniciar sesión (devuelve JWT) | Público |
| GET | `/auth/me` | Usuario de la sesión | Con sesión |
| POST | `/reportes` | Crear reporte con coordenadas | Con sesión |
| GET | `/reportes?estado=` | Listar mis reportes (filtro opcional) | Con sesión |
| GET | `/reportes/mapa?estado=` | Reportes en GeoJSON para el mapa (propios; el admin ve todos) | Con sesión |
| GET | `/reportes/{id}` | Detalle con seguimiento | Dueño o admin |
| POST | `/reportes/{id}/foto` | Subir foto del reporte | Dueño |
| POST | `/reportes/{id}/foto-cierre` | Subir foto de cierre | Admin |
| PATCH | `/reportes/{id}/estado` | Cambiar estado y cuadrilla (para marcar `limpio` hace falta la foto de cierre) | Admin |
| GET | `/admin/reportes?estado=&barrio=` | Listar todos los reportes | Admin |
| GET / PUT | `/perfil` | Ver o editar perfil con aporte | Con sesión |
| PATCH | `/perfil/notificaciones` | Activar o desactivar avisos | Con sesión |

Estados válidos de un reporte: `pendiente`, `en_proceso`, `limpio`.

## Pruebas del backend

Las pruebas usan la base configurada en `backend/.env` (con `schema.sql` ya ejecutado). Crean usuarios temporales y los borran al terminar.

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

## Flujo de trabajo con Git

- `main` es la rama estable: no se trabaja directamente en ella.
- Cada tarea del backlog va en su propia rama: `git checkout -b feature/nombre-de-la-tarea`.
- Se hacen commits pequeños y se abre un **Pull Request** hacia `main`.
- Otro integrante revisa el Pull Request antes de unirlo.
- Antes de empezar a trabajar: `git pull origin main`.
- **Nunca** subas el archivo `.env` ni la carpeta `uploads/`.

## Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `uvicorn no se reconoce` | El entorno virtual no está activo. Ejecuta `venv\Scripts\activate`. |
| `UnicodeDecodeError` al conectar | Es un error de conexión oculto: revisa `DB_NAME`, `DB_USER` y `DB_PASSWORD` en el `.env`. |
| `relation "usuarios" does not exist` | No se ejecutó `database/schema.sql` en la base `sig-residuos`. |
| `type "geography" does not exist` | PostGIS no está instalado o activo. Ejecuta `CREATE EXTENSION postgis;` en la base. |
| `Falta SECRET_KEY` | El archivo `.env` no existe o no está dentro de `backend/`. |
| `Network Error` en el frontend | El backend no está corriendo, o abriste el frontend con `127.0.0.1` en vez de `localhost`. |
| 401 en `/docs` | El token venció (dura 60 minutos). Haz login de nuevo y pulsa **Authorize**. |
| `npm run dev` falla | Revisa que la versión de Node sea 20.19+ y ejecuta `npm install` otra vez. |

## Equipo

- Integrante 1: _nombre_
- Integrante 2: _nombre_
- Integrante 3: _nombre_
- Integrante 4: _nombre_

Proyecto académico — Ingeniería de Software, UFPSO (Ocaña).