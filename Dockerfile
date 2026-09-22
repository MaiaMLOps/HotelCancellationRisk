FROM python:3.11-slim

WORKDIR /app

# Instalar solo lo necesario para inferencia
COPY requirements/serve.txt .
RUN pip install --no-cache-dir -r serve.txt

# Configurar ARG y ENV para elegir la fuente del modelo
ARG MODEL_SOURCE="local"
ENV MODEL_SOURCE=${MODEL_SOURCE}

# Variables de entorno adicionales para MLflow (útiles si MODEL_SOURCE=mlflow)
ENV MLFLOW_TRACKING_URI="http://host.docker.internal:5000"
ENV MODEL_NAME="hotel-cancellation-model"
ENV MODEL_VERSION="latest"

# Copiar el código fuente y artefactos locales
COPY src/ /app/src/
COPY model/ /app/model/
COPY models/ /app/models/

# Exponer el puerto
EXPOSE 8000

# Ejecutar FastAPI
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
