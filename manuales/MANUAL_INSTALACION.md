# Manual de Instalación — Tablero de Riesgo de Cancelación Hotelera

Este manual describe cómo desplegar localmente, con **Docker**, los dos
componentes que conforman la solución:

- **`api/`** — servicio FastAPI que carga el modelo campeón (alias
  `champion`) registrado en el MLflow del equipo y expone `POST /predict`.
- **`frontend/`** — tablero en React (Vite), servido como sitio estático con
  nginx, que consume esa API.

## 1. Prerrequisitos

- Docker y Docker Compose v2 instalados (`docker --version`,
  `docker compose version`).
- Acceso de red al **servidor MLflow central del equipo**
  (`MLFLOW_TRACKING_URI`), con el modelo `hotel-cancellation-random-forest`
  registrado y con el alias `champion` apuntando a una versión (esto se hace
  una sola vez, ejecutando `python -m model.register_final_model` — ver
  `model/README.md`).
- Git.

## 2. Obtener el proyecto

```bash
git clone https://github.com/MaiaMLOps/HotelCancellationRisk.git
cd HotelCancellationRisk
```

## 3. Estructura relevante para el despliegue

```text
HotelCancellationRisk/
├── api/                  # servicio FastAPI (Dockerfile, requirements, main.py)
├── frontend/              # tablero React/Vite (Dockerfile, nginx.conf)
├── model/                 # pipeline de entrenamiento y registro en MLflow
├── docker-compose.yml      # orquesta api + frontend
└── .env.example            # variables de entorno de ejemplo
```

## 4. Configurar variables de entorno

Copie el archivo de ejemplo y ajuste los valores:

```bash
cp .env.example .env
```

| Variable              | Descripción                                                                 |
|------------------------|------------------------------------------------------------------------------|
| `MLFLOW_TRACKING_URI`  | URL del servidor MLflow del equipo, ej. `http://<MLFLOW_HOST>:8050`.         |
| `MODEL_NAME`           | Nombre del modelo registrado (`hotel-cancellation-random-forest`).           |
| `MODEL_ALIAS`          | Alias a cargar (`champion`).                                                  |
| `DECISION_THRESHOLD`   | Umbral de respaldo si no se puede leer desde MLflow (`0.205`).               |
| `VITE_API_URL`         | URL pública/local en la que el **navegador** alcanzará la API (`http://localhost:8000`). |

> **Importante:** `VITE_API_URL` se usa en tiempo de *build* del frontend
> (Vite la incrusta en los archivos estáticos), no en tiempo de ejecución del
> contenedor. Si cambia esta variable, debe reconstruir la imagen del
> frontend (`docker compose build frontend`).

## 5. Levantar los servicios

```bash
docker compose up --build
```

Esto construye y levanta:

- `hotel-risk-api` en `http://localhost:8000`
- `hotel-risk-frontend` en `http://localhost:5173`

Verifique que la API cargó el modelo correctamente:

```bash
curl http://localhost:8000/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "model_name": "hotel-cancellation-random-forest",
  "model_alias": "champion",
  "model_version": "3",
  "threshold": 0.205,
  "detail": null
}
```

Si `status` es `model_not_loaded`, revise `detail` (usualmente indica que
`MLFLOW_TRACKING_URI` no es alcanzable desde el contenedor, o que el modelo
aún no tiene el alias `champion`).

Abra el tablero en `http://localhost:5173`.

## 6. Detener y limpiar

```bash
docker compose down        # detiene los contenedores
docker compose down -v     # además elimina volúmenes (si se agregan más adelante)
```

## 7. Ejecución local sin Docker (desarrollo)

**API:**

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export MLFLOW_TRACKING_URI=http://<MLFLOW_HOST>:8050
uvicorn main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```
