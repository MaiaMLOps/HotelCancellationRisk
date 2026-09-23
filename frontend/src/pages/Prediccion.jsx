import { useState } from 'react';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const defaultState = {
  hotel: "Resort Hotel",
  lead_time: 342,
  arrival_date_year: 2015,
  arrival_date_month: "July",
  arrival_date_week_number: 27,
  arrival_date_day_of_month: 1,
  stays_in_weekend_nights: 0,
  stays_in_week_nights: 0,
  adults: 2,
  children: 0,
  babies: 0,
  meal: "BB",
  country: "PRT",
  market_segment: "Direct",
  distribution_channel: "Direct",
  is_repeated_guest: 0,
  previous_cancellations: 0,
  previous_bookings_not_canceled: 0,
  reserved_room_type: "C",
  assigned_room_type: "C",
  booking_changes: 3,
  deposit_type: "No Deposit",
  agent: 0,
  company: 0,
  days_in_waiting_list: 0,
  customer_type: "Transient",
  adr: 0,
  required_car_parking_spaces: 0,
  total_of_special_requests: 0
};

export default function Prediccion() {
  const [mode, setMode] = useState('basic'); // 'basic' | 'advanced'
  const [formData, setFormData] = useState(defaultState);

  // Virtual field for native date picker
  const [dateStr, setDateStr] = useState(`${defaultState.arrival_date_year}-07-01`);

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [mockAction, setMockAction] = useState(null);
  const [modalContent, setModalContent] = useState(null);

  const openModal = (type) => {
    if (type === 'descuento') {
      setModalContent({
        title: "Plantilla: Oferta de Descuento",
        icon: "mail",
        text: `Asunto: ¡Mejora tu estadía con nosotros!\n\nEstimado/a huésped,\n\nNotamos que tiene una reserva con nosotros para las próximas fechas.\n\nNos encantaría ofrecerle un 15% de descuento en el total de su estadía o una mejora de habitación sin costo adicional. Para hacer válida esta promoción, por favor responda a este correo o haga clic en el siguiente enlace seguro:\n\n[Enlace para reclamar descuento]\n\n¡Esperamos recibirle pronto y brindarle la mejor experiencia!\n\nSaludos cordiales,\nEquipo de Reservas`
      });
    } else if (type === 'deposito') {
      setModalContent({
        title: "Plantilla: Solicitud de Depósito",
        icon: "payments",
        text: `Asunto: Actualización importante sobre su reserva\n\nEstimado/a huésped,\n\nPara garantizar su reserva en nuestras instalaciones durante estas fechas de alta demanda, le solicitamos amablemente confirmar su estadía realizando un depósito equivalente a la primera noche.\n\nTiene un plazo de 48 horas para realizar el pago a través del siguiente enlace seguro y asegurar su espacio con nosotros:\n\n[Enlace de pago seguro]\n\nQuedamos a su entera disposición en caso de cualquier duda.\n\nAtentamente,\nEquipo de Reservas`
      });
    }
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    setDateStr(val);
    if (val) {
      const d = new Date(val);
      const year = d.getUTCFullYear();
      const month = MONTHS[d.getUTCMonth()];
      const day = d.getUTCDate();
      setFormData(prev => ({
        ...prev,
        arrival_date_year: year,
        arrival_date_month: month,
        arrival_date_day_of_month: day,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let finalValue = value;
    if (type === 'number') {
      finalValue = value === '' ? 0 : Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://54-160-137-22.nip.io";
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 w-full animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Nueva Predicción</h1>
            <p className="text-sm text-muted-foreground mt-1">Ingrese los datos de la reserva para calcular su riesgo de cancelación.</p>
          </div>

          {/* Toggle Mode */}
          <div className="flex bg-surface-variant p-1 rounded-lg border border-border">
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'basic' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setMode('basic')}
            >
              Modo Básico
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'advanced' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setMode('advanced')}
            >
              Modo Avanzado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-8 bg-card border border-border rounded-xl shadow-sm overflow-hidden relative">
            <div className="h-1 bg-primary w-full absolute top-0 left-0"></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 mt-2">

              {/* Basic Fields - Always Visible */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2">
                  <span className="material-symbols-outlined text-primary">key</span>
                  Campos Clave
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Hotel</label>
                    <select name="hotel" value={formData.hotel} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                      <option value="Resort Hotel">Resort Hotel</option>
                      <option value="City Hotel">City Hotel</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Fecha de Llegada</label>
                    <input type="date" value={dateStr} onChange={handleDateChange} className="w-full p-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Anticipación (Días)</label>
                    <input type="number" name="lead_time" value={formData.lead_time} onChange={handleChange} min="0" className="w-full p-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tipo de Habitación</label>
                    <select name="reserved_room_type" value={formData.reserved_room_type} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none">
                      {["A", "B", "C", "D", "E", "F", "G", "H", "L"].map(t => <option key={t} value={t}>Tipo {t}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Adultos</label>
                    <input type="number" name="adults" value={formData.adults} onChange={handleChange} min="0" className="w-full p-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Niños</label>
                    <input type="number" name="children" value={formData.children} onChange={handleChange} min="0" className="w-full p-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none" required />
                  </div>
                </div>
              </div>

              {/* Advanced Fields */}
              {mode === 'advanced' && (
                <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300 pt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border pb-2 mt-4">
                    <span className="material-symbols-outlined text-primary">settings</span>
                    Parámetros Adicionales
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Bebés</label>
                      <input type="number" name="babies" value={formData.babies} onChange={handleChange} min="0" className="w-full p-2 bg-background border border-border rounded-md text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Tipo Depósito</label>
                      <select name="deposit_type" value={formData.deposit_type} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md text-sm">
                        <option value="No Deposit">Sin Depósito</option>
                        <option value="Non Refund">No Reembolsable</option>
                        <option value="Refundable">Reembolsable</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Cancelaciones Previas</label>
                      <input type="number" name="previous_cancellations" value={formData.previous_cancellations} onChange={handleChange} min="0" className="w-full p-2 bg-background border border-border rounded-md text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Segmento Mercado</label>
                      <input type="text" name="market_segment" value={formData.market_segment} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">País (3 letras)</label>
                      <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Canal Distribución</label>
                      <input type="text" name="distribution_channel" value={formData.distribution_channel} onChange={handleChange} className="w-full p-2 bg-background border border-border rounded-md text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-6 rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">online_prediction</span>}
                  {loading ? 'Calculando...' : 'Predecir Riesgo'}
                </button>
              </div>
            </form>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden">
              {!prediction && !error && !loading && (
                <div className="text-center text-muted-foreground flex flex-col items-center opacity-70">
                  <span className="material-symbols-outlined text-5xl mb-3">query_stats</span>
                  <p className="text-sm">Ingrese los datos y haga clic en "Predecir Riesgo" para ver el resultado.</p>
                </div>
              )}

              {loading && (
                <div className="text-center text-primary flex flex-col items-center">
                  <span className="material-symbols-outlined text-5xl mb-3 animate-spin">progress_activity</span>
                  <p className="animate-pulse font-medium">Analizando modelo predictivo...</p>
                </div>
              )}

              {error && (
                <div className="text-center text-destructive flex flex-col items-center">
                  <span className="material-symbols-outlined text-5xl mb-3">error</span>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {prediction && !loading && (
                <div className="flex-1 flex flex-col justify-center items-center text-center w-full animate-in zoom-in duration-500">
                  <div className={`absolute top-0 left-0 w-full h-2 ${prediction.is_canceled ? 'bg-destructive' : 'bg-secondary'}`}></div>

                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${prediction.is_canceled ? 'bg-destructive/20 text-destructive' : 'bg-secondary/20 text-secondary-foreground'}`}>
                    <span className="material-symbols-outlined text-4xl">
                      {prediction.is_canceled ? 'warning' : 'check_circle'}
                    </span>
                  </div>

                  <span className={`font-mono uppercase tracking-wider mb-2 text-sm font-bold ${prediction.is_canceled ? 'text-destructive' : 'text-secondary-foreground'}`}>
                    {prediction.is_canceled ? 'Riesgo Alto' : 'Riesgo Bajo'}
                  </span>

                  <div className={`text-6xl font-bold mb-4 ${prediction.is_canceled ? 'text-destructive' : 'text-secondary-foreground'}`}>
                    {prediction.probability != null ? `${(prediction.probability * 100).toFixed(1)}%` : (prediction.is_canceled ? '75+%' : '<25%')}
                  </div>

                  <p className="text-muted-foreground text-sm max-w-[200px] mb-6 mt-2">
                    {prediction.is_canceled
                      ? 'El modelo indica una alta probabilidad de que esta reserva sea cancelada. Considere aplicar mitigaciones.'
                      : 'Es altamente probable que el huésped concrete su estancia. Todo parece estar en orden.'}
                  </p>

                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${prediction.is_canceled ? 'bg-destructive' : 'bg-secondary'}`}
                      style={{ width: prediction.probability != null ? `${prediction.probability * 100}%` : (prediction.is_canceled ? '85%' : '15%') }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Mitigation Card */}
            {prediction && !loading && prediction.is_canceled && (() => {
              let recommendedAction = null;
              const numProb = prediction.probability != null ? prediction.probability * 100 : (prediction.is_canceled ? 85 : 15);
              if (numProb > 70) {
                recommendedAction = 'deposito';
              } else if (formData.lead_time < 15) {
                recommendedAction = 'descuento';
              }

              return (
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 relative animate-in slide-in-from-top-4 fade-in duration-300 mt-6">
                  <h3 className="text-xl font-semibold mb-4 border-b border-border pb-2">Predicción de IA y Mitigación</h3>
                  <p className="text-sm text-muted-foreground mb-6">¿Desea enviar alguna oferta o requerimiento de pago a este huésped de forma preventiva basándose en la predicción?</p>
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
                </div>
              );
            })()}

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
