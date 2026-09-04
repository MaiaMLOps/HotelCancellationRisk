import { useState } from 'react';
import { Link } from 'react-router-dom';

const bookings = [
  { 
    id: 'RES-8924A', prob: '87%', leadTime: 45, priority: 'Alta Prioridad', riskClass: 'destructive', icon: 'trending_up', op: 1,
    data: { lead_time: 45, market_segment: "Online TA", stays_in_weekend_nights: 1, stays_in_week_nights: 2, adults: 2, children: 0, deposit_type: "No Deposit", previous_cancellations: 2 }
  },
  { 
    id: 'RES-9102B', prob: '75%', leadTime: 12, priority: 'Alta Prioridad', riskClass: 'destructive', icon: 'trending_up', op: 1,
    data: { lead_time: 12, market_segment: "Direct", stays_in_weekend_nights: 0, stays_in_week_nights: 1, adults: 1, children: 0, deposit_type: "Non Refund", previous_cancellations: 0 }
  },
  { 
    id: 'RES-7731C', prob: '52%', leadTime: 88, priority: 'Prioridad Media', riskClass: '[#e8923a]', icon: 'trending_flat', op: 1,
    data: { lead_time: 88, market_segment: "Corporate", stays_in_weekend_nights: 2, stays_in_week_nights: 4, adults: 2, children: 2, deposit_type: "No Deposit", previous_cancellations: 0 }
  },
  { 
    id: 'RES-4412D', prob: '15%', leadTime: 102, priority: 'Baja Prioridad', riskClass: 'secondary', icon: 'trending_down', op: 0.75,
    data: { lead_time: 102, market_segment: "Groups", stays_in_weekend_nights: 2, stays_in_week_nights: 5, adults: 2, children: 0, deposit_type: "Refundable", previous_cancellations: 0 }
  }
];

export default function Riesgo() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBookings = bookings.filter(booking => 
    booking.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Reservas de Riesgo Priorizadas</h1>
          <p className="text-sm text-muted-foreground mt-1">Revise las reservas identificadas con altas probabilidades de cancelación.</p>
        </div>
        <div className="w-full md:w-96 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">search</span>
          <input 
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm text-foreground placeholder-muted-foreground transition-all" 
            placeholder="Buscar por ID de Reserva..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Section (Spans 2 columns on large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Link 
                key={booking.id}
                to={`/validacion?id=${booking.id}`}
                state={{ bookingData: booking.data }}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/50 transition-colors shadow-sm cursor-pointer"
                style={{ opacity: booking.op }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${booking.riskClass === '[#e8923a]' ? 'bg-[#e8923a]/20 text-[#e8923a]' : `bg-${booking.riskClass}/20 text-${booking.riskClass === 'secondary' ? 'secondary-foreground' : booking.riskClass}`}`}>
                    <span className="material-symbols-outlined">{booking.icon}</span>
                  </div>
                  <div>
                    <div className="font-mono text-muted-foreground text-sm mb-1">ID: {booking.id}</div>
                    <div className="text-lg text-foreground font-bold">{booking.prob} Prob.</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none">
                    <div className="text-sm text-muted-foreground">Anticipación</div>
                    <div className="text-base text-foreground font-semibold">{booking.leadTime} Días</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-mono text-[11px] uppercase tracking-wider font-bold shrink-0 ${booking.riskClass === '[#e8923a]' ? 'bg-[#e8923a] text-white' : `bg-${booking.riskClass} text-${booking.riskClass === 'secondary' ? 'secondary-foreground' : 'destructive-foreground'}`}`}>
                    {booking.priority}
                  </span>
                  <button className="text-primary hover:bg-primary/20 p-2 rounded-full transition-colors self-end sm:self-auto flex items-center justify-center">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
              <p>No se encontraron reservaciones con ese ID.</p>
            </div>
          )}
          
        </div>

        {/* Contextual Sidebar / Summary Panel (Desktop Only in this layout position) */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="bg-card border-t-4 border-t-destructive border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg text-foreground font-bold mb-2">Resumen de Alto Riesgo</h3>
            <p className="text-sm text-muted-foreground mb-4">Ingresos totales en riesgo inmediato basado en los modelos de puntuación actuales.</p>
            <div className="text-4xl font-bold text-destructive mb-1">$42,500</div>
            <div className="font-mono text-sm text-muted-foreground">En 14 Reservas</div>
          </div>
          
          <div className="bg-card border-t-4 border-t-primary border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg text-foreground font-bold mb-4">Sugerencias de Acción</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
                <span className="text-sm text-foreground">Revisar depósitos para prob. &gt;70%.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
                <span className="text-sm text-foreground">Enviar correo pre-llegada para anticipación &lt;15 días.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
