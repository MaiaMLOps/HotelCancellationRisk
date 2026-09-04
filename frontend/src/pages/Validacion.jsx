import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';

const defaultSampleData = {
  hotel: "Resort Hotel",
  lead_time: 142,
  arrival_date_year: 2023,
  arrival_date_month: "July",
  arrival_date_week_number: 27,
  arrival_date_day_of_month: 1,
  stays_in_weekend_nights: 2,
  stays_in_week_nights: 3,
  adults: 2,
  children: 1,
  babies: 0,
  meal: "BB",
  country: "PRT",
  market_segment: "Online TA",
  distribution_channel: "TA/TO",
  is_repeated_guest: 0,
  previous_cancellations: 1,
  previous_bookings_not_canceled: 0,
  reserved_room_type: "A",
  booking_changes: 0,
  deposit_type: "No Deposit",
  agent: 9.0,
  company: 0.0,
  days_in_waiting_list: 0,
  customer_type: "Transient",
  adr: 150.0,
  required_car_parking_spaces: 0,
  total_of_special_requests: 1
};

export default function Validacion() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const bookingId = searchParams.get("id") || "RES-78291";

  // Get data passed from Riesgo.jsx or fallback to default
  const currentData = useMemo(() => {
    const bookingData = location.state?.bookingData || {};
    return { ...defaultSampleData, ...bookingData };
  }, [location.state?.bookingData]);

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const response = await fetch("http://localhost:8000/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(currentData)
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setPrediction(data);
      } catch (err) {
        console.error("Error fetching prediction:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, [bookingId, currentData]);

  let probability = "--%";
  let isHighRisk = false;
  let riskLabel = "Calculando Riesgo...";

  if (error) {
    riskLabel = "Error al obtener predicción";
  } else if (!loading && prediction) {
    probability = (prediction.cancel_risk_probability * 100).toFixed(1) + "%";
    isHighRisk = prediction.will_cancel;
    riskLabel = isHighRisk ? "Alto Riesgo de Cancelación" : "Bajo Riesgo de Cancelación";
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/riesgo" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium cursor-pointer group">
              <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors">arrow_back</span>
              <span>Volver a la Lista de Reservas</span>
            </Link>
          </div>
          <h1 className="text-3xl font-semibold text-foreground">Detalles de Reserva: {bookingId}</h1>
          <p className="text-muted-foreground mt-1">Revise los parámetros del modelo y la predicción para una posible mitigación.</p>
        </div>
        <div className="bg-secondary/20 px-4 py-2 rounded-lg border border-border flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary-foreground">schedule</span>
          <span className="font-mono font-bold text-foreground text-sm">Moment of Scoring: Pre-arrival (7 days)</span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prediction & Actions (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Prediction Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full relative min-h-[300px]">
            <div className={`h-1 w-full absolute top-0 left-0 ${isHighRisk ? 'bg-destructive' : 'bg-secondary'}`}></div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
              <span className={`font-mono uppercase tracking-wider mb-2 text-sm ${error ? 'text-muted-foreground' : (isHighRisk ? 'text-destructive' : 'text-secondary-foreground')}`}>
                {riskLabel}
              </span>
              <div className={`text-5xl font-bold mb-1 ${isHighRisk ? 'text-destructive' : 'text-secondary-foreground'}`}>
                {probability}
              </div>
              <p className="text-muted-foreground text-sm">Probabilidad de Cancelación</p>

              <div className="mt-6 w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${isHighRisk ? 'bg-destructive' : 'bg-secondary'}`}
                  style={{ width: probability !== "--%" ? probability : "0%" }}
                ></div>
              </div>
            </div>
          </div>

          {/* Validation Action Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4 border-b border-border pb-2">Predicción de IA y Mitigación</h3>
            <p className="text-sm text-muted-foreground mb-6">¿Esta predicción se alinea con la intuición operativa basada en los atributos proporcionados?</p>
            <div className="flex flex-col gap-3">
              <button className="w-full py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg transition-colors border border-border font-medium flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">mail</span> Enviar Oferta de Descuento
              </button>
              <button className="w-full py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg transition-colors border border-border font-medium flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">payments</span> Solicitar Depósito No Reembolsable
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Features (Span 8) */}
          <div className="lg:col-span-8">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full relative">
              <div className="h-1 bg-primary w-full absolute top-0 left-0"></div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">dataset</span>
                    Input Features
                  </h2>
                  <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full font-mono text-xs border border-border">Model Version: v2.1.4</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Feature Item */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm text-muted-foreground">Anticipación</span>
                      <span className="material-symbols-outlined text-[16px] text-muted-foreground cursor-help" title="Días entre la reserva y la llegada">info</span>
                    </div>
                    <div className="text-lg font-semibold border-b border-border pb-2">{currentData.lead_time} Días</div>
                  </div>
                  {/* Feature Item */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm text-muted-foreground">Segmento</span>
                    </div>
                    <div className="text-lg font-semibold border-b border-border pb-2">{currentData.market_segment}</div>
                  </div>
                  {/* Feature Item */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm text-muted-foreground">Noches</span>
                    </div>
                    <div className="text-lg font-semibold border-b border-border pb-2">{currentData.stays_in_weekend_nights + currentData.stays_in_week_nights}</div>
                  </div>
                  {/* Feature Item */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm text-muted-foreground">Huéspedes</span>
                    </div>
                    <div className="text-lg font-semibold border-b border-border pb-2">
                      {currentData.adults} Adultos, {currentData.children} Niños
                    </div>
                  </div>
                  {/* Feature Item */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm text-muted-foreground">Tipo de Depósito</span>
                    </div>
                    <div className={`text-lg font-semibold border-b border-border pb-2 flex items-center gap-2 ${currentData.deposit_type === 'No Deposit' ? 'text-destructive' : 'text-foreground'}`}>
                      {currentData.deposit_type === 'No Deposit' ? 'Sin Depósito' : currentData.deposit_type}
                      {currentData.deposit_type === 'No Deposit' && <span className="material-symbols-outlined text-[16px]">warning</span>}
                    </div>
                  </div>
                  {/* Feature Item */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm text-muted-foreground">Historial (Cancelaciones Previas)</span>
                    </div>
                    <div className="text-lg font-semibold border-b border-border pb-2">{currentData.previous_cancellations}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
}