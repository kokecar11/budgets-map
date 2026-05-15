# Deployment en Railway

## Arquitectura de servicios

```
Railway Project: budgets-map
├── Redis          (addon)
├── api            (FastAPI)
├── web            (Next.js)
├── celery-worker  (misma imagen que api)
└── celery-beat    (misma imagen que api)
```

Base de datos: **Supabase** (ya hospedado, no se crea en Railway).

---

## Prerequisitos

- Cuenta en [railway.app](https://railway.app)
- Repositorio en GitHub con el proyecto
- Railway CLI instalado:
  ```bash
  npm install -g @railway/cli
  railway login
  ```
- Variables de entorno del API a mano (Supabase URL, keys, secrets)

---

## Paso 1 — Crear el proyecto en Railway

1. Abre [railway.app/new](https://railway.app/new)
2. Selecciona **"Deploy from GitHub repo"**
3. Conecta tu cuenta de GitHub si no lo has hecho
4. Selecciona el repositorio `budgets-map`
5. Railway detectará el repo — **cancela el deploy automático** por ahora (clic en X), vamos a configurar cada servicio manualmente

---

## Paso 2 — Agregar Redis

1. En el dashboard del proyecto, clic en **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway crea el addon y expone automáticamente `REDIS_URL` (y `REDIS_PRIVATE_URL` para red interna)
3. Toma nota del nombre del servicio (por defecto: `Redis`) — lo usarás en las variables de referencia

---

## Paso 3 — Servicio API (FastAPI)

### 3.1 Crear el servicio

1. Clic en **"+ New"** → **"GitHub Repo"** → selecciona el mismo repositorio
2. Renombra el servicio a `api` (clic en el nombre → editar)

### 3.2 Configurar el build

Ve a **Settings** del servicio `api`:

| Campo | Valor |
|---|---|
| **Root Directory** | `apps/api` |
| **Build Command** | *(vacío — usa el Dockerfile)* |
| **Start Command** | `uvicorn src.main:app --host 0.0.0.0 --port $PORT --workers 2` |
| **Dockerfile Path** | `Dockerfile` |
| **Watch Paths** | `apps/api/**` |

### 3.3 Variables de entorno del API

Ve a **Variables** del servicio `api` y agrega:

```
HOST=0.0.0.0
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres
ALLOWED_HOSTS=["https://${{web.RAILWAY_PUBLIC_DOMAIN}}","http://localhost:3000"]
SECRET_KEY=[genera uno con: openssl rand -hex 32]
ALGORITHM=HS256
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_KEY=[tu-anon-key o service-role-key]
OPENAI_API_KEY=[tu-key]
APP_URL=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
REDIS_URL=${{Redis.REDIS_URL}}
```

> **Nota**: Las variables con `${{ServiceName.VAR}}` son referencias Railway — se resuelven automáticamente cuando los servicios están en el mismo proyecto. El servicio `web` puede no existir aún; puedes volver a completarlas después del paso 4.

LemonSqueezy (si usas billing):
```
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_PRO_VARIANT_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
```

### 3.4 Dominio del API

Ve a **Settings** → **Networking** → **Generate Domain**.  
Guarda la URL generada (ej: `api-production-xxxx.railway.app`). La necesitarás para el servicio web.

---

## Paso 4 — Servicio Web (Next.js)

### 4.1 Crear el servicio

1. Clic en **"+ New"** → **"GitHub Repo"** → mismo repositorio
2. Renombra el servicio a `web`

### 4.2 Configurar el build

Ve a **Settings** del servicio `web`:

| Campo | Valor |
|---|---|
| **Root Directory** | `/` *(raíz del monorepo)* |
| **Dockerfile Path** | `apps/web/Dockerfile` |
| **Watch Paths** | `apps/web/**,packages/**` |

### 4.3 Variables de entorno del Web

```
API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
BETTER_AUTH_SECRET=[mismo valor que tienes en .env.local]
```

LemonSqueezy (opcional):
```
LEMONSQUEEZY_CHECKOUT_URL=https://...
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=...
```

> **Importante**: `NEXT_PUBLIC_API_URL` es una variable de build-time en Next.js. Railway la pasa como `--build-arg` durante el Docker build gracias al `ARG` declarado en el Dockerfile. Asegúrate de que esté configurada **antes** del primer deploy.

### 4.4 Dominio del Web

Ve a **Settings** → **Networking** → **Generate Domain**.  
Guarda la URL (ej: `web-production-xxxx.railway.app`).

---

## Paso 5 — Servicio Celery Worker

### 5.1 Crear el servicio

1. Clic en **"+ New"** → **"GitHub Repo"** → mismo repositorio
2. Renombra el servicio a `celery-worker`

### 5.2 Configurar

Ve a **Settings**:

| Campo | Valor |
|---|---|
| **Root Directory** | `apps/api` |
| **Dockerfile Path** | `Dockerfile` |
| **Start Command** | `celery -A src.celery_app worker --loglevel=info --concurrency=2` |

### 5.3 Variables de entorno

Clic en **Variables** → **"Share Variables From"** → selecciona el servicio `api`.  
Esto hereda todas las variables del API sin duplicarlas.

---

## Paso 6 — Servicio Celery Beat

### 6.1 Crear el servicio

1. Clic en **"+ New"** → **"GitHub Repo"** → mismo repositorio
2. Renombra a `celery-beat`

### 6.2 Configurar

| Campo | Valor |
|---|---|
| **Root Directory** | `apps/api` |
| **Dockerfile Path** | `Dockerfile` |
| **Start Command** | `celery -A src.celery_app beat --loglevel=info` |

### 6.3 Variables de entorno

Igual que el worker: **"Share Variables From"** → `api`.

> **Importante**: Solo debe correr **una instancia** de celery-beat. En Railway asegúrate de que el número de replicas sea 1 (Settings → Deploy → Replicas → 1).

---

## Paso 7 — Primer deploy

### 7.1 Orden recomendado

Despliega en este orden para evitar errores de dependencias:

1. **Redis** (ya está listo desde el paso 2)
2. **api** → clic en **Deploy**
3. **celery-worker** → clic en **Deploy**
4. **celery-beat** → clic en **Deploy**
5. **web** → clic en **Deploy**

### 7.2 Verificar el API

Una vez que `api` esté verde, abre en el navegador:
```
https://[tu-api-domain].railway.app/health
```
Debe responder `{"status": "ok"}` o similar.

También puedes ver la documentación automática:
```
https://[tu-api-domain].railway.app/docs
```

### 7.3 Verificar el Web

Abre `https://[tu-web-domain].railway.app` — deberías ver la pantalla de login.

---

## Paso 8 — Actualizar ALLOWED_HOSTS en el API

Una vez que tienes los dominios definitivos, actualiza la variable en el servicio `api`:

```
ALLOWED_HOSTS=["https://[tu-web-domain].railway.app","http://localhost:3000"]
```

Railway hará un redeploy automático al guardar.

---

## Comandos útiles con Railway CLI

```bash
# Ver logs en tiempo real de un servicio
railway logs --service api

# Conectarte a la shell del servicio
railway shell --service api

# Ver todas las variables de un servicio
railway variables --service api

# Ejecutar migraciones de Alembic (si las tienes)
railway run --service api alembic upgrade head

# Deploy manual desde terminal
railway up --service api
```

---

## Troubleshooting frecuente

### Build del Web falla con error de módulos no encontrados
- Verifica que **Root Directory** esté en `/` (raíz del monorepo), no en `apps/web`
- El Dockerfile necesita acceso a `packages/` para el build

### API responde 422 o 500 en `/health`
- Revisa que `DATABASE_URL` use el driver `postgresql+asyncpg://` (no `postgresql://`)
- Verifica que `ALLOWED_HOSTS` sea un JSON array válido: `["https://..."]`

### Celery no procesa tareas
- Confirma que `REDIS_URL` apunta al addon de Railway (usa la variable de referencia `${{Redis.REDIS_URL}}`)
- Revisa los logs del worker con `railway logs --service celery-worker`

### Error de CORS en el navegador
- El dominio del frontend debe estar en `ALLOWED_HOSTS` del API
- Después de cambiar `ALLOWED_HOSTS` espera el redeploy automático

### `NEXT_PUBLIC_API_URL` queda vacía en producción
- Esta variable es de build-time — debe estar configurada **antes** del deploy
- Si la cambias después, debes hacer un nuevo deploy (no solo restart)
