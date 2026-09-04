import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const nodes = [
  {
    id: 'dataset',
    title: 'dataset\n+DVC',
    icon: 'dataset',
    color: '#3359B4',
    cards: [
      { title: 'Control de Versiones', icon: 'account_tree', content: 'DVC gestiona versiones de data cruda en S3. Permite reproducibilidad total del pipeline.' },
      { title: 'Almacenamiento S3', icon: 'cloud', content: 'Bucket configurado con acceso seguro mediante credenciales de AWS gestionadas localmente.' },
      { title: 'Riesgos de Ingesta', icon: 'warning', isRisk: true, content: 'Desactualización del caché DVC o pérdida de credenciales que bloquean el pipeline completo.' }
    ]
  },
  {
    id: 'eda',
    title: 'EDA\nreservas',
    icon: 'explore',
    color: '#279b9d',
    cards: [
      { title: 'Distribución y Tendencias', icon: 'bar_chart', content: 'Análisis de estacionalidad, lead time y comportamiento base de segmentos.' },
      { title: 'Matriz de Correlación', icon: 'scatter_plot', content: 'Identificación de variables predictoras clave como deposit_type y cancelaciones previas.' },
      { title: 'Riesgos de Análisis', icon: 'warning', isRisk: true, content: 'Ignorar cambios macroeconómicos (Data Drift) que cambian el comportamiento del usuario.' }
    ]
  },
  {
    id: 'features',
    title: 'atributos\npre-llegada',
    icon: 'manufacturing',
    color: '#5ba359',
    cards: [
      { title: 'Feature Engineering', icon: 'psychology', content: 'Imputación de nulos, One-Hot Encoding de categóricas y estandarización de numéricas.' },
      { title: 'Restricción Temporal', icon: 'schedule', content: 'Fijar estrictamente el momento de scoring (t=0) para que la predicción sea útil.' },
      { title: 'Data Leakage', icon: 'warning', isRisk: true, content: 'Riesgo Crítico: Usar variables como reservation_status o fechas post-evento en entrenamiento.' }
    ]
  },
  {
    id: 'mlflow',
    title: 'MLflow\nmodelos',
    icon: 'model_training',
    color: '#e8923a',
    cards: [
      { title: 'Tracking de Experimentos', icon: 'science', content: 'Registro automático de hiperparámetros, métricas y artefactos serializados (modelos pkl).' },
      { title: 'Métricas de Negocio', icon: 'check_circle', content: 'Optimización de PR-AUC, Recall y Calibración de Probabilidades sobre accuracy.' },
      { title: 'Partición Temporal', icon: 'warning', isRisk: true, content: 'Obligatoria partición out-of-time para simular predicciones sobre reservas futuras.' }
    ]
  },
  {
    id: 'api',
    title: 'API riesgo\n+ tablero',
    icon: 'api',
    color: '#1a2a4e',
    cards: [
      { title: 'Servicio FastAPI', icon: 'bolt', content: 'Endpoint /predict que recibe atributos de la reserva y devuelve probabilidad de cancelación.' },
      { title: 'Tablero Operativo', icon: 'dashboard_customize', content: 'Visualización de impacto en ocupación e interfaz para intervención temprana de operaciones.' },
      { title: 'Riesgos en Producción', icon: 'warning', isRisk: true, content: 'Diferencias entre el esquema JSON de entrenamiento y el esquema en tiempo real (Schema Drift).' }
    ]
  }
];

const defaultCards = [
  {
    title: 'Modelado y validación',
    icon: 'check_circle',
    color: '#5ba359',
    content: (
      <ul className="space-y-4 text-sm text-foreground/90 list-disc pl-5">
        <li>Definir el momento exacto de scoring: creación de reserva o días antes de llegada.</li>
        <li>Eliminar <code className="font-mono bg-background/50 px-1 py-0.5 rounded text-foreground font-bold">reservation_status</code>, <code className="font-mono bg-background/50 px-1 py-0.5 rounded text-foreground font-bold">reservation_status_date</code> y variables no disponibles al momento elegido.</li>
        <li>Métricas principales: PR-AUC / ROC-AUC, calibración de probabilidades, recall@k y curva de utilidad por intervención comercial.</li>
      </ul>
    )
  },
  {
    title: 'API y tablero',
    icon: 'dashboard_customize',
    color: '#3359B4',
    content: (
      <ul className="space-y-4 text-sm text-foreground/90 list-disc pl-5">
        <li><strong>API:</strong> entrada con atributos de una reserva en tiempo real; salida con probabilidad de cancelación, banda de riesgo y acción sugerida.</li>
        <li><strong>Tablero:</strong> visualización de ocupación bruta vs. ajustada por riesgo.</li>
        <li>Análisis de cancelaciones por canal/mes, lead time, segmentos y lista priorizada de reservas en riesgo.</li>
      </ul>
    )
  },
  {
    title: 'Riesgos técnicos',
    icon: 'warning',
    color: '#e8923a',
    isRisk: true,
    content: (
      <ul className="space-y-4 text-sm text-foreground/90">
        <li className="flex gap-2 items-start">
          <span className="material-symbols-outlined text-destructive text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          <div>
            <strong className="text-foreground block mb-1">Data Leakage</strong>
            Riesgo alto por variables post-evento o actualizadas después de la confirmación de la reserva.
          </div>
        </li>
        <li className="flex gap-2 items-start">
          <span className="material-symbols-outlined text-[#e8923a] text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
          <div>
            <strong className="text-foreground block mb-1">Partición Temporal</strong>
            Obligatoria partición temporal recomendada para simular predicción real sobre reservas futuras.
          </div>
        </li>
        <li className="flex gap-2 items-start">
          <span className="material-symbols-outlined text-primary text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          <div>
            Mayor esfuerzo de diseño en el tablero por la riqueza del caso; controlar alcance desde el mockup inicial.
          </div>
        </li>
      </ul>
    )
  }
];

export default function MLOps() {
  const [activeNode, setActiveNode] = useState(null); // null means no specific node selected

  const currentData = activeNode ? nodes.find(n => n.id === activeNode) : null;

  return (
    <>
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2"
      >
        <h2 className="text-3xl font-semibold text-primary mb-2">Reservas de Hotel: Pipeline de Implementación MLOps</h2>
        <p className="text-muted-foreground">Monitoreo interactivo del ciclo de vida del modelo de predicción de cancelaciones.</p>
        <div className="w-full h-1 bg-secondary mt-4"></div>
      </motion.div>

      {/* Tier 1: Solution Flow */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xl text-center text-foreground font-bold mb-2">
          {activeNode ? 'Haz clic de nuevo para deseleccionar' : 'Selecciona una etapa del flujo para ver detalles'}
        </h3>
        
        <div className="w-full overflow-x-auto pb-6 pt-2 px-2">
          <div className="flex items-center min-w-[800px] justify-between gap-1 relative">
            {nodes.map((node, index) => {
              const isActive = activeNode === node.id;
              
              return (
                <motion.div
                  key={node.id}
                  onClick={() => setActiveNode(isActive ? null : node.id)}
                  whileHover={{ scale: isActive ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex flex-col items-center justify-center min-h-[100px] relative z-10 shadow-sm cursor-pointer transition-all duration-300
                    ${index === 0 ? 'rounded-l-xl rounded-r-sm' : ''}
                    ${index === nodes.length - 1 ? 'rounded-r-xl rounded-l-sm' : 'rounded-sm'}
                    ${isActive ? 'ring-4 ring-offset-2 ring-offset-background' : (activeNode ? 'opacity-40 hover:opacity-100' : 'opacity-90 hover:opacity-100')}
                  `}
                  style={{ 
                    backgroundColor: node.color,
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderRightWidth: index !== nodes.length - 1 ? '1px' : '0',
                    borderLeftWidth: index !== 0 ? '1px' : '0'
                  }}
                >
                  <span className="material-symbols-outlined mb-1" style={{ fontSize: isActive ? '24px' : '20px', transition: 'all 0.3s' }}>{node.icon}</span>
                  <span className="font-mono font-bold text-center whitespace-pre-line">{node.title}</span>
                  
                  {/* Chevron spacer logic */}
                  {index < nodes.length - 1 && (
                    <div 
                      className="absolute -right-[34px] w-8 h-12 bg-border/40 z-0 pointer-events-none" 
                      style={{ clipPath: 'polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)' }}
                    ></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tier 2: Dynamic Content Cards based on active node */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.section 
            key={activeNode || 'default'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2"
          >
            {activeNode && currentData ? (
              // Render node specific cards
              currentData.cards.map((card, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className={`bg-card rounded-xl border-2 shadow-sm overflow-hidden flex flex-col relative
                    ${card.isRisk ? 'border-destructive/30' : 'border-border'}
                  `}
                >
                  {card.isRisk && (
                     <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 rounded-bl-full z-0 pointer-events-none"></div>
                  )}
                  
                  <div 
                    className="px-4 py-3 flex items-center justify-between relative z-10 text-white"
                    style={{ backgroundColor: card.isRisk ? '#e8923a' : currentData.color }}
                  >
                    <h4 className="text-lg font-bold m-0">{card.title}</h4>
                    <span className={`material-symbols-outlined ${card.isRisk ? 'animate-pulse text-white' : 'text-white/80'}`}>
                      {card.icon}
                    </span>
                  </div>
                  
                  <div className="p-6 flex-grow bg-card relative z-10 flex flex-col justify-center">
                    <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                      {card.content}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              // Render original overview cards
              defaultCards.map((card, i) => (
                <motion.div 
                  key={`default-${i}`}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className={`bg-card rounded-xl border-2 shadow-sm overflow-hidden flex flex-col relative
                    ${card.isRisk ? 'border-[#e8923a]/50' : 'border-border'}
                  `}
                >
                  {card.isRisk && (
                     <div className="absolute top-0 right-0 w-16 h-16 bg-[#e8923a]/10 rounded-bl-full z-0 pointer-events-none"></div>
                  )}
                  
                  <div 
                    className="px-4 py-3 flex items-center justify-between relative z-10 text-white"
                    style={{ backgroundColor: card.color }}
                  >
                    <h4 className="text-xl font-bold m-0">{card.title}</h4>
                    <span className={`material-symbols-outlined ${card.isRisk ? 'animate-pulse text-white' : 'text-white/80'}`}>
                      {card.icon}
                    </span>
                  </div>
                  
                  <div className="p-6 flex-grow bg-card relative z-10 flex flex-col justify-start">
                    {card.content}
                  </div>
                </motion.div>
              ))
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </>
  );
}
