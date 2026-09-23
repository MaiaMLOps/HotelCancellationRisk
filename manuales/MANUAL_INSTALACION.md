# Manual de Instalación — Tablero de Riesgo de Cancelación Hotelera
## 1. Arquitectura del proyecto

El proyecto se compone de dos servicios independientes (no usan `docker-compose`, se construyen y ejecutan por separado):

```
HotelCancellationRisk/
├── Dockerfile              # Imagen única para la API (FastAPI)
├── src/
│   └── api.py               # Servicio FastAPI: expone /predict y /health
├── models/
│   └── model.joblib          # Modelo campeón (Random Forest) YA ENTRENADO y versionado en git
├── model/                    # Pipeline de entrenamiento/tuning/registro en MLflow (no se necesita para levantar el tablero)
├── requirements/
│   ├── serve.txt              # Dependencias para servir la API
│   ├── modeling.txt / xgboost.txt / dvc.txt   # Dependencias solo para (re)entrenar
├── data/
│   └── dataset.csv.dvc         # Apuntador DVC al dataset (no se necesita para levantar el tablero)
├── frontend/                  # Tablero en React 19 + Vite + Tailwind + shadcn/ui
│   ├── src/pages/               # Dashboard, MLOps, Riesgo, Validación, Predicción
│   ├── package.json
│   └── vite.config.js
└── .github/workflows/         # CI/CD (build de API con Docker, build/deploy de frontend a Cloudflare Pages)
```

**Importante:** el `models/model.joblib` ya viene incluido en el repositorio, por lo que **no es necesario entrenar el modelo, ni usar DVC, ni tener un servidor MLflow** para levantar el tablero localmente. La API lo carga en modo local por defecto (`MODEL_SOURCE=local`).

## 2. Prerrequisitos

- **Git**
- **Docker** (para levantar la API en contenedor) — opcional si se prefiere correr todo sin Docker
- **Python 3.11** (si se ejecuta la API sin Docker)
- **Node.js 20+** (el pipeline de CI usa Node 24) y **npm** (para el frontend)

## 3. Obtener el proyecto

```bash
git clone https://github.com/MaiaMLOps/HotelCancellationRisk.git
cd HotelCancellationRisk
```

## 4. Levantar la API (backend)

### Opción A — Con Docker (recomendado)

Desde la raíz del repositorio:

```bash
docker build -t api-hotel .
docker run -d --name api-hotel -p 8000:8000 \
  -e MODEL_SOURCE=local \
  -e MODEL_THRESHOLD=0.205 \
  api-hotel
```

Variables de entorno soportadas por la imagen (definidas en el `Dockerfile`):

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `MODEL_SOURCE` | `local` (usa `models/model.joblib`) o `mlflow` (carga desde un servidor MLflow) | `local` |
| `MODEL_THRESHOLD` | Umbral de decisión para clasificar una reserva como cancelada | `0.205` |
| `MLFLOW_TRACKING_URI` | Solo si `MODEL_SOURCE=mlflow` | `http://host.docker.internal:5000` |
| `MODEL_NAME` | Solo si `MODEL_SOURCE=mlflow` | `hotel-cancellation-model` |
| `MODEL_VERSION` | Solo si `MODEL_SOURCE=mlflow` | `latest` |

Verifique que el contenedor levantó correctamente:

```bash
curl http://localhost:8000/health
```

Respuesta esperada:

```json
{ "status": "ok", "model_loaded": true }
```

Para detener y eliminar el contenedor:

```bash
docker stop api-hotel && docker rm api-hotel
```

### Opción B — Sin Docker (entorno virtual de Python)

```bash
python3.11 -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate
pip install -r requirements/serve.txt

export MODEL_SOURCE=local
export MODEL_THRESHOLD=0.205

uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
```

La API queda disponible en `http://localhost:8000` (documentación interactiva en `http://localhost:8000/docs`).

## 5. Levantar el tablero (frontend)

El frontend **no tiene Dockerfile propio**; se ejecuta con Node/npm o se despliega como sitio estático (así lo hace el pipeline de CI/CD del proyecto, publicándolo en Cloudflare Pages).

```bash
cd frontend
npm install
npm run dev
```

Por defecto Vite sirve el tablero en `http://localhost:5173`.

Para generar el build de producción (archivos estáticos listos para servir con cualquier servidor web):

```bash
npm run build      # genera frontend/dist/
npm run preview    # sirve ese build localmente para probarlo
```

### Configurar la URL de la API que consume el tablero

- La página **Predicción** (`src/pages/Prediccion.jsx`) sí respeta la variable `VITE_API_URL`. Para apuntarla a su API local, cree un archivo `frontend/.env`:

  ```
  VITE_API_URL=http://localhost:8000
  ```

  Como Vite incrusta esta variable en tiempo de *build*, si la cambia debe reiniciar `npm run dev` (o reconstruir con `npm run build`).

- **Atención:** la página **Validación** (`src/pages/Validacion.jsx`) tiene la URL de la API **codificada de forma fija** (`https://54-160-137-22.nip.io`, la API de producción del equipo) y **no lee `VITE_API_URL`**. Si necesita que esa página consuma su API local, debe editar manualmente esa línea en el código fuente antes de compilar.

- Las secciones **Dashboard**, **MLOps** y **Riesgo** no llaman a la API; funcionan de forma independiente.

## 6. Verificación end-to-end

1. Confirme que la API responde: `curl http://localhost:8000/health` → `"model_loaded": true`.
2. Abra el tablero en `http://localhost:5173`.
3. Vaya a la sección **Predicción**, complete el formulario de una reserva y envíe: debe recibir `prediction`, `is_canceled` y `probability` desde la API.

## 7. Preguntas frecuentes

**¿Necesito DVC o MLflow para levantar el tablero?**
No. Ambos solo se usan en el pipeline de entrenamiento/re-registro del modelo (`model/`), no para servir el modelo ya entrenado que está en `models/model.joblib`.

**¿Puedo usar `MODEL_SOURCE=mlflow`?**
Sí, pero requiere acceso de red a un servidor MLflow con el modelo `hotel-cancellation-model` registrado; en ese caso configure `MLFLOW_TRACKING_URI`, `MODEL_NAME` y `MODEL_VERSION` al levantar el contenedor.

**El tablero no muestra resultados de predicción.**
Revise en la consola del navegador si la petición a `/predict` falla por CORS o por una URL incorrecta; confirme `VITE_API_URL` (o, en el caso de Validación, la URL fija en el código) y que la API esté corriendo y accesible.
