import os
import joblib
import mlflow
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Hotel Cancellation Risk API", description="API para la predicción de cancelación de hoteles")

# Variable global para almacenar el modelo en memoria
model = None

def load_model():
    """
    Carga el modelo desde la ruta local o desde MLflow, 
    dependiendo de la variable de entorno MODEL_SOURCE.
    """
    global model
    model_source = os.getenv("MODEL_SOURCE", "local").lower()
    
    if model_source == "mlflow":
        try:
            model_name = os.getenv("MODEL_NAME", "hotel-cancellation-model")
            model_version = os.getenv("MODEL_VERSION", "latest")
            model_uri = f"models:/{model_name}/{model_version}"
            
            print(f"Cargando modelo desde MLflow: {model_uri}")
            model = mlflow.pyfunc.load_model(model_uri)
            print("Modelo cargado exitosamente desde MLflow.")
        except Exception as e:
            print(f"Error al cargar el modelo desde MLflow: {e}")
            raise RuntimeError(f"No se pudo cargar el modelo desde MLflow: {e}")
    else:
        try:
            local_model_path = os.getenv("LOCAL_MODEL_PATH", "models/model.joblib")
            print(f"Cargando modelo local desde: {local_model_path}")
            model = joblib.load(local_model_path)
            print("Modelo local cargado exitosamente.")
        except Exception as e:
            print(f"Error al cargar el modelo local: {e}")
            raise RuntimeError(f"No se pudo cargar el modelo local: {e}")

@app.on_event("startup")
def startup_event():
    load_model()

class BookingData(BaseModel):
    hotel: str = "Resort Hotel"
    lead_time: float = 342.0
    arrival_date_year: int = 2015
    arrival_date_month: str = "July"
    arrival_date_week_number: int = 27
    arrival_date_day_of_month: int = 1
    stays_in_weekend_nights: int = 0
    stays_in_week_nights: int = 0
    adults: int = 2
    children: float = 0.0
    babies: int = 0
    meal: str = "BB"
    country: str = "PRT"
    market_segment: str = "Direct"
    distribution_channel: str = "Direct"
    is_repeated_guest: int = 0
    previous_cancellations: int = 0
    previous_bookings_not_canceled: int = 0
    reserved_room_type: str = "C"
    assigned_room_type: str = "C"
    booking_changes: int = 3
    deposit_type: str = "No Deposit"
    agent: Optional[float] = None
    company: Optional[float] = None
    days_in_waiting_list: int = 0
    customer_type: str = "Transient"
    adr: float = 0.0
    required_car_parking_spaces: int = 0
    total_of_special_requests: int = 0

@app.post("/predict")
def predict(booking: BookingData):
    if model is None:
        raise HTTPException(status_code=500, detail="El modelo no está cargado.")
    
    # Convertir a DataFrame, que es el formato que suele esperar scikit-learn/mlflow
    df = pd.DataFrame([booking.dict()])
    
    try:
        prediction = model.predict(df)
        
        # Procesar el resultado según el formato devuelto (puede variar por el wrapper)
        pred_val = int(prediction[0]) if hasattr(prediction, '__iter__') else int(prediction)
        
        return {
            "prediction": pred_val,
            "is_canceled": bool(pred_val == 1)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error durante la predicción: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
