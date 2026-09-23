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
  const [mockAction, setMockAction] = useState(null);

  const [modalContent, setModalContent] = useState(null);

  const openModal = (type) => {
    if (type === 'descuento') {
      setModalContent({
        title: "Plantilla: Oferta de Descuento",
        icon: "mail",
        text: `Asunto: ¡Mejora tu estadía con nosotros!\n\nEstimado/a huésped,\n\nNotamos que tiene una reserva con nosotros (ID: ${bookingId}) para las próximas fechas.\n\nNos encantaría ofrecerle un 15% de descuento en el total de su estadía o una mejora de habitación sin costo adicional. Para hacer válida esta promoción, por favor responda a este correo o haga clic en el siguiente enlace seguro:\n\n[Enlace para reclamar descuento]\n\n¡Esperamos recibirle pronto y brindarle la mejor experiencia!\n\nSaludos cordiales,\nEquipo de Reservas`
      });
    } else if (type === 'deposito') {
      setModalContent({
        title: "Plantilla: Solicitud de Depósito",
        icon: "payments",
        text: `Asunto: Actualización importante sobre su reserva\n\nEstimado/a huésped,\n\nPara garantizar su reserva (ID: ${bookingId}) en nuestras instalaciones durante estas fechas de alta demanda, le solicitamos amablemente confirmar su estadía realizando un depósito equivalente a la primera noche.\n\nTiene un plazo de 48 horas para realizar el pago a través del siguiente enlace seguro y asegurar su espacio con nosotros:\n\n[Enlace de pago seguro]\n\nQuedamos a su entera disposición en caso de cualquier duda.\n\nAtentamente,\nEquipo de Reservas`
      });
    }
  };

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const response = await fetch(`${API_URL}/predict`, {
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

  const handleMockAction = (actionName) => {
    setMockAction(`✅ Acción simulada con éxito: ${actionName}`);
    setTimeout(() => setMockAction(null), 3000);
  };

  const hardcodedProb = location.state?.hardcodedProb;

  let probability = "--%";
  let isHighRisk = false;
  let riskLabel = "Calculando Riesgo...";
  let recommendedAction = null;

  if (error) {
    riskLabel = "Error al obtener predicción";
  } else if (!loading && prediction) {
    if (hardcodedProb) {
      probability = hardcodedProb;
      isHighRisk = parseInt(hardcodedProb) >= 50;
    } else {
      probability = prediction.probability != null ? (prediction.probability * 100).toFixed(1) + "%" : "--%";
      isHighRisk = prediction.is_canceled;
    }
    riskLabel = isHighRisk ? "Alto Riesgo de Cancelación" : "Bajo Riesgo de Cancelación";
    
    const numProb = parseFloat(probability);
    if (numProb > 70) {
      recommendedAction = 'deposito';
    } else if (currentData.lead_time < 15) {
      recommendedAction = 'descuento';
    }
  }

  return (
    <>
    <div className="max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-300">
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
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col relative min-h-[300px]">
            <div className={`h-1 w-full absolute top-0 left-0 ${isHighRisk ? 'bg-destructive' : 'bg-secondary'}`}></div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
              <span className={`font-mono uppercase tracking-wider mb-2 text-sm font-bold ${error ? 'text-muted-foreground' : (isHighRisk ? 'text-destructive' : 'text-secondary-foreground')}`}>
                {riskLabel}
              </span>
              <div className={`text-5xl font-bold mb-1 ${isHighRisk ? 'text-destructive' : 'text-secondary-foreground'}`}>
                {probability}
              </div>
              <p className="text-muted-foreground text-sm">Probabilidad de Cancelación</p>

              <div className="mt-6 w-full bg-muted rounded-full h-2 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${isHighRisk ? 'bg-destructive' : 'bg-secondary'}`}
                  style={{ width: probability !== "--%" ? probability : "0%" }}
                ></div>
              </div>
            </div>
          </div>

          {/* Validation Action Card */}
          {isHighRisk && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 relative animate-in slide-in-from-top-4 fade-in duration-300">
            <h3 className="text-xl font-semibold mb-4 border-b border-border pb-2">Predicción de IA y Mitigación</h3>
            <p className="text-sm text-muted-foreground mb-6">¿Esta predicción se alinea con la intuición operativa basada en los atributos proporcionados?</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => openModal('descuento')}
                className={`w-full py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg transition-colors border font-medium flex items-center justify-center gap-2 ${recommendedAction === 'descuento' ? 'border-primary/50 shadow-sm' : 'border-border'}`}
              >
                <span className="material-symbols-outlined text-sm">mail</span> Enviar Oferta de Descuento
                {recommendedAction === 'descuento' && (
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 font-bold ml-1">
                    <span className="material-symbols-outlined text-[12px]">star</span> Recomendado
                  </span>
                )}
              </button>
              <button 
                onClick={() => openModal('deposito')}
                className={`w-full py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg transition-colors border font-medium flex items-center justify-center gap-2 ${recommendedAction === 'deposito' ? 'border-primary/50 shadow-sm' : 'border-border'}`}
              >
                <span className="material-symbols-outlined text-sm">payments</span> Solicitar Depósito
                {recommendedAction === 'deposito' && (
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5 font-bold ml-1">
                    <span className="material-symbols-outlined text-[12px]">star</span> Recomendado
                  </span>
                )}
              </button>
            </div>
            {/* La notificación ahora vive en el modal */}
          </div>
          )}
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
      {/* Modal para plantillas de correo */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-card border border-border shadow-xl rounded-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{modalContent.icon}</span>
                {modalContent.title}
              </h3>
              <button onClick={() => setModalContent(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-muted p-5 rounded-lg font-mono text-sm whitespace-pre-wrap text-foreground border border-border mb-4 h-72 overflow-y-auto leading-relaxed">
                {modalContent.text}
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setModalContent(null)}
                  className="px-4 py-2 rounded-md font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cerrar
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(modalContent.text);
                    setMockAction("¡Plantilla copiada al portapapeles!");
                    setTimeout(() => setMockAction(null), 3000);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copiar al Portapapeles
                </button>
              </div>
            </div>
            
            {/* Notificación de Copiado dentro del modal */}
            {mockAction && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-medium py-2 px-4 rounded-lg shadow-lg animate-in slide-in-from-top-2 fade-in duration-300">
                {mockAction}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}