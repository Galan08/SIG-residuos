# Despliegue gratis en la nube (Supabase + Vercel)

Esta guía deja SIG-residuos funcionando en internet sin pagar nada:

| Parte | Dónde corre | Plan |
|---|---|---|
| Base de datos (PostgreSQL + PostGIS) | Supabase | Free |
| Fotos de los reportes | Supabase Storage | Free |
| Backend (FastAPI) | Vercel, como función de Python | Hobby (gratis) |
| Frontend (React + Vite) | Vercel | Hobby (gratis) |

Son **dos proyectos en Vercel** que salen del mismo repositorio: uno con la carpeta `backend` y otro con la carpeta `frontend`.

Tiempo estimado: 30 a 40 minutos la primera vez.

---

## 0. Antes de empezar

- Una cuenta de GitHub con acceso al repositorio `Galan08/SIG-residuos`.
- Crea una cuenta en **supabase.com** y otra en **vercel.com**. En las dos puedes entrar con "Continue with GitHub".
- La rama con los cambios para la nube es **`claude/project-thread-tdb4ro`**. Mientras no se una a `main`, hay que decirle a Vercel que use esa rama (paso 3.3).

Ve guardando en un bloc de notas estos datos a medida que aparezcan:

```
SUPABASE_URL=
SUPABASE_SECRET_KEY=
DATABASE_URL=
SECRET_KEY=
URL del backend en Vercel=
URL del frontend en Vercel=
```

---

## 1. Supabase: crear la base de datos

### 1.1 Crear el proyecto

1. En supabase.com pulsa **New project**.
2. **Name:** `sig-residuos`.
3. **Database Password:** pulsa **Generate a password** y **cópiala ya**, porque no se vuelve a mostrar.
4. **Region:** **East US (North Virginia)**. Es donde Vercel corre las funciones por defecto, así que cada consulta tarda menos.
5. Pulsa **Create new project** y espera uno o dos minutos.

### 1.2 Crear las tablas

1. En el menú de la izquierda abre **SQL Editor** y pulsa **New query**.
2. Copia todo el contenido de `database/schema.sql`, pégalo y pulsa **Run**. Debe decir *Success. No rows returned*.
   - Ese archivo activa PostGIS con `CREATE EXTENSION IF NOT EXISTS postgis;`, que Supabase ya trae disponible.
3. (Opcional, para la demo) En una consulta nueva, pega y ejecuta `database/datos_prueba.sql`. Crea el administrador `admin@prueba.sigresiduos`, dos ciudadanos y seis reportes en Ocaña. La contraseña de todos es `Clave1234`.
4. En una consulta nueva, pega y ejecuta **`database/supabase.sql`**. Hace dos cosas:
   - Activa la seguridad por filas (RLS) en las tablas, para que nadie pueda leerlas desde la API pública de Supabase. El backend no se ve afectado.
   - Crea el bucket público **`fotos`** donde se guardan las imágenes (máximo 10 MB; solo JPG, PNG y WEBP).

Compruébalo: en **Table Editor** deben aparecer `usuarios`, `reportes` y `seguimiento`, y en **Storage** el bucket `fotos`.

### 1.3 Copiar la cadena de conexión (`DATABASE_URL`)

1. Arriba, pulsa el botón **Connect**.
2. Busca **Transaction pooler** (puerto **6543**). **No uses** la "Direct connection": Vercel no puede llegar a ella.
3. Copia la URI. Se ve así:
   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
4. Reemplaza `[YOUR-PASSWORD]` (con los corchetes) por la contraseña del paso 1.1. Eso es tu `DATABASE_URL`.

> Si la contraseña tiene símbolos como `@`, `#`, `/` o `%`, la conexión falla. Lo más fácil es ir a **Project Settings → Database → Reset database password** y generar una con solo letras y números.

### 1.4 Copiar la URL del proyecto y la clave secreta

1. Ve a **Project Settings → Data API** y copia la **Project URL** (`https://abcdefghijklmnop.supabase.co`). Es tu `SUPABASE_URL`.
2. Ve a **Project Settings → API Keys**. En **Secret keys** copia la clave que empieza por `sb_secret_...`. Es tu `SUPABASE_SECRET_KEY`.
   - Si tu proyecto solo muestra las claves antiguas, usa la **service_role** (empieza por `eyJ...`); también funciona.
   - **Esta clave es secreta:** va solo en Vercel, nunca en el frontend ni en el repositorio.

### 1.5 Generar la `SECRET_KEY` del backend

Es la clave que firma los tokens de inicio de sesión. Genérala en tu computador:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 2. Vercel: desplegar el backend

### 2.1 Importar el repositorio

1. En vercel.com pulsa **Add New… → Project**.
2. En **Import Git Repository** elige `SIG-residuos`. Si no aparece, pulsa **Adjust GitHub App Permissions** y dale acceso a ese repositorio.
3. **Project Name:** `sig-residuos-api`.
4. **Root Directory:** pulsa **Edit** y elige la carpeta **`backend`**.
5. **Framework Preset:** **FastAPI** (si no aparece, deja **Other**). Vercel detecta solo el archivo `main.py` y su variable `app`.

### 2.2 Variables de entorno

Abre **Environment Variables** y agrega estas (nombre exacto, a la izquierda; valor, a la derecha):

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | la del paso 1.3 |
| `SECRET_KEY` | la del paso 1.5 |
| `ACCESS_TOKEN_MINUTES` | `60` |
| `SUPABASE_URL` | la del paso 1.4 |
| `SUPABASE_SECRET_KEY` | la del paso 1.4 |
| `SUPABASE_BUCKET` | `fotos` |
| `CORS_ORIGINS` | `http://localhost:5173` por ahora; se cambia en el paso 4 |

Pulsa **Deploy**.

### 2.3 Usar la rama correcta

El primer despliegue toma la rama `main`, que todavía no tiene los cambios para la nube, así que **puede fallar o no funcionar. Es normal.**

1. Entra al proyecto → **Settings → Environments → Production**.
2. En **Branch Tracking** cambia `main` por **`claude/project-thread-tdb4ro`** y guarda.
3. Ve a **Deployments**, abre el menú `⋯` del último despliegue y pulsa **Redeploy**. Si no aparece la rama nueva, haz cualquier commit pequeño en ella o pídele a Claude que lo haga.

> Cuando la rama se una a `main`, vuelve a poner `main` aquí.

### 2.4 Comprobar

Abre la URL que te da Vercel (algo como `https://sig-residuos-api.vercel.app`):

- `https://sig-residuos-api.vercel.app/` debe responder `{"mensaje":"SIG-Residuos API funcionando"}`.
- `https://sig-residuos-api.vercel.app/docs` muestra la documentación. Prueba `POST /auth/login` con `admin@prueba.sigresiduos` / `Clave1234`.

Guarda esta URL **sin la barra final**: es la URL del backend.

---

## 3. Vercel: desplegar el frontend

1. Otra vez **Add New… → Project** y el mismo repositorio `SIG-residuos`.
2. **Project Name:** `sig-residuos`.
3. **Root Directory:** **`frontend`**.
4. **Framework Preset:** **Vite** (lo detecta solo). Build Command `npm run build`, Output Directory `dist`.
5. **Environment Variables:**

   | Nombre | Valor |
   |---|---|
   | `VITE_API_URL` | la URL del backend, por ejemplo `https://sig-residuos-api.vercel.app` |

6. Pulsa **Deploy**.
7. Igual que en el paso 2.3: **Settings → Environments → Production → Branch Tracking** = `claude/project-thread-tdb4ro`, y luego **Redeploy**.

> `VITE_API_URL` se mete en el código al compilar. Si la cambias, hay que hacer **Redeploy** para que tome efecto.

Guarda la URL que te da Vercel (por ejemplo `https://sig-residuos.vercel.app`): es la URL del frontend.

---

## 4. Conectar los dos: CORS

El backend solo acepta peticiones del frontend que tenga autorizado.

1. Abre el proyecto **sig-residuos-api** → **Settings → Environment Variables**.
2. Edita `CORS_ORIGINS` y pon la URL del frontend **sin barra final**, por ejemplo:
   ```
   https://sig-residuos.vercel.app
   ```
   Si también quieres seguir probando en local, sepáralas con coma:
   ```
   https://sig-residuos.vercel.app,http://localhost:5173
   ```
3. Ve a **Deployments → ⋯ → Redeploy** para que tome el cambio.

---

## 5. Probar todo

Abre la URL del frontend y recorre:

1. Inicia sesión como `laura@prueba.sigresiduos` / `Clave1234` (o regístrate).
2. Crea un reporte con ubicación y foto. El detalle debe mostrar la foto (se sirve desde Supabase Storage).
3. Revisa el **Mapa**.
4. Cierra sesión y entra como `admin@prueba.sigresiduos`. En **Gestión** cambia un reporte a *en proceso* y luego a *limpio* con foto de cierre.

Para convertir en administrador a una cuenta tuya, en el **SQL Editor** de Supabase:

```sql
UPDATE usuarios SET rol = 'administrador' WHERE correo = 'tu_correo@ejemplo.com';
```

---

## Qué cambió en el código para la nube

Nada de esto afecta el trabajo en local: si no defines las variables nuevas, todo funciona como antes.

| Archivo | Cambio |
|---|---|
| `backend/database.py` | Si existe `DATABASE_URL`, se conecta con ella (con SSL y sin pool propio, porque el pooler de Supabase ya lo hace). Si no, usa `DB_*` como siempre. |
| `backend/almacenamiento.py` | Nuevo. Guarda las fotos en Supabase Storage cuando están `SUPABASE_URL` y `SUPABASE_SECRET_KEY`; si no, en `backend/uploads` como antes. En Vercel el disco es de solo lectura, por eso hace falta. |
| `backend/main.py` | Orígenes de CORS desde `CORS_ORIGINS`; la carpeta `/uploads` solo se sirve en modo local. |
| `backend/.python-version` | Fija Python 3.12 en Vercel. |
| `frontend/src/api.js` | La URL del backend sale de `VITE_API_URL`; nueva función `urlFoto` para mostrar fotos locales o de Supabase. |
| `frontend/src/fotos.js` | Las fotos de más de 1,5 MB se reducen en el navegador (máximo 1920 px, JPG) antes de subirlas, porque Vercel gratis no acepta peticiones de más de 4,5 MB. |
| `frontend/vercel.json` | Hace que rutas como `/mapa` o `/admin` funcionen al recargar la página. |
| `database/supabase.sql` | Nuevo. RLS en las tablas y bucket `fotos`. |

---

## Límites del plan gratuito

| Límite | Qué significa para el proyecto |
|---|---|
| Supabase **pausa el proyecto tras 7 días sin uso** | Si nadie usa la app en una semana, entra a supabase.com y pulsa **Restore project**. Hazlo el día antes de una presentación. |
| Supabase: 500 MB de base de datos y 1 GB de archivos | De sobra para la demo. |
| Vercel Hobby: solo uso no comercial | Un proyecto académico está bien. |
| Vercel: peticiones de máximo 4,5 MB | Por eso el frontend reduce las fotos antes de subirlas. |
| Vercel: la primera petición tras un rato sin uso tarda 1 a 3 segundos | Es el "arranque en frío" de la función. Las siguientes van rápido. |

---

## Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| El backend responde **500** y en **Logs** dice `Falta SECRET_KEY` | Falta la variable `SECRET_KEY` en el proyecto `sig-residuos-api`. Agrégala y haz Redeploy. |
| `could not translate host name` o `Network is unreachable` | Usaste la *Direct connection*. Usa la URI del **Transaction pooler** (puerto 6543). |
| `password authentication failed` | La contraseña de `DATABASE_URL` está mal o tiene símbolos especiales (ver paso 1.3). |
| `Tenant or user not found` | El usuario de la URI debe ser `postgres.<id-del-proyecto>`, tal como lo da Supabase. |
| `relation "usuarios" does not exist` | No se ejecutó `database/schema.sql` en el SQL Editor. |
| En el navegador: **CORS error** o *No se pudo conectar con el servidor* | `CORS_ORIGINS` no coincide exactamente con la URL del frontend (sin barra final), o `VITE_API_URL` está mal. Corrige y haz Redeploy de los dos. |
| La foto no se guarda: *No se pudo guardar la foto* | Revisa `SUPABASE_URL`, `SUPABASE_SECRET_KEY` y que exista el bucket `fotos` (ejecuta `database/supabase.sql`). |
| Al recargar `/mapa` sale **404** | Falta `frontend/vercel.json`: asegúrate de que Vercel usa la rama `claude/project-thread-tdb4ro`. |
| Todo dejó de funcionar después de unos días | Supabase pausó el proyecto. Entra y pulsa **Restore project**. |

Para ver errores del backend: proyecto `sig-residuos-api` → **Logs**.
