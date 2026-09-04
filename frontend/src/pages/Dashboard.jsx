export default function Dashboard() {
  return (
    <>
      <section className="mb-4">
        <h2 className="text-3xl font-semibold text-foreground mb-2">Resumen del Tablero</h2>
        <p className="text-muted-foreground">Monitoreo del rendimiento del modelo y riesgos de reservas en tiempo real.</p>
      </section>

      {/* Tier 1: Global KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="h-1 bg-destructive w-full"></div>
          <div className="p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-muted-foreground uppercase text-sm">Reservas en Riesgo</span>
              <span className="material-symbols-outlined text-muted-foreground cursor-pointer hover:text-primary transition-colors text-sm" title="Alta probabilidad de cancelación">help</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-5xl font-bold text-foreground">1,248</span>
              <span className="text-sm text-destructive flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_up</span> 12%</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="h-1 bg-secondary w-full"></div>
          <div className="p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-muted-foreground uppercase text-sm">Tasa de Cancelación</span>
              <span className="material-symbols-outlined text-muted-foreground cursor-pointer hover:text-primary transition-colors text-sm" title="Tasa de cancelación general actual">help</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-5xl font-bold text-foreground">34.2%</span>
              <span className="text-sm text-secondary-foreground flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_flat</span> 0%</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="h-1 bg-primary w-full"></div>
          <div className="p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-muted-foreground uppercase text-sm">PR-AUC del Modelo</span>
              <span className="material-symbols-outlined text-muted-foreground cursor-pointer hover:text-primary transition-colors text-sm" title="Precisión-Exhaustividad Área Bajo la Curva">help</span>
            </div>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="text-5xl font-bold text-foreground">0.82</span>
              <span className="text-sm text-primary flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_up</span> +0.03</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tier 2: Visual Monitoring */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="h-1 bg-primary/20 w-full"></div>
          <div className="p-4 flex-grow flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-foreground">Ocupación Bruta vs. Ajustada por Riesgo</h3>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 font-mono text-muted-foreground text-sm"><span className="w-3 h-3 rounded-full bg-border inline-block"></span> Bruta</span>
                <span className="inline-flex items-center gap-1 font-mono text-muted-foreground text-sm"><span className="w-3 h-3 rounded-full bg-primary inline-block"></span> Ajustada</span>
              </div>
            </div>
            
            <div className="w-full h-64 bg-secondary/20 rounded-lg border border-border border-dashed flex items-center justify-center relative overflow-hidden">
              <div className="flex items-end justify-between w-full h-full p-4 gap-2 z-10">
                <div className="w-full flex justify-around items-end h-full">
                  <div className="w-12 h-[80%] bg-border/50 rounded-t relative">
                    <div className="absolute bottom-0 w-full bg-primary h-[60%] rounded-t opacity-90"></div>
                  </div>
                  <div className="w-12 h-[90%] bg-border/50 rounded-t relative">
                    <div className="absolute bottom-0 w-full bg-primary h-[65%] rounded-t opacity-90"></div>
                  </div>
                  <div className="w-12 h-[70%] bg-border/50 rounded-t relative">
                    <div className="absolute bottom-0 w-full bg-primary h-[40%] rounded-t opacity-90"></div>
                  </div>
                  <div className="w-12 h-[85%] bg-border/50 rounded-t relative">
                    <div className="absolute bottom-0 w-full bg-primary h-[55%] rounded-t opacity-90"></div>
                  </div>
                  <div className="w-12 h-[75%] bg-border/50 rounded-t relative">
                    <div className="absolute bottom-0 w-full bg-primary h-[45%] rounded-t opacity-90"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Card: MLOps Pipeline Status */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
          <div className="h-1 bg-secondary w-full"></div>
          <div className="p-4 flex-grow flex flex-col">
            <h3 className="text-xl font-semibold text-foreground mb-4">Estado de MLOps</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
                <div className="flex-grow">
                  <p className="font-mono text-foreground text-sm">Ingesta de Datos (DVC)</p>
                  <p className="text-muted-foreground text-xs">Actualizado hace 2h</p>
                </div>
              </div>
              <div className="w-px h-4 bg-border ml-4 my-1"></div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                </div>
                <div className="flex-grow">
                  <p className="font-mono text-primary font-bold text-sm">Puntuación del Modelo (MLflow)</p>
                  <p className="text-muted-foreground text-xs">Ejecutando inferencia por lotes...</p>
                </div>
              </div>
            </div>
            <button className="mt-auto w-full py-2 bg-secondary hover:bg-secondary/80 text-foreground font-mono rounded-lg transition-colors border border-border mt-6">
              Ver Registros
            </button>
          </div>
        </div>
      </section>

      {/* Tier 3: High Risk Bookings Log */}
      <section className="mt-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="h-1 bg-destructive/50 w-full"></div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-foreground">Registro de Riesgos Prioritarios</h3>
            <button className="px-4 py-2 bg-primary text-primary-foreground font-mono text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">download</span> Exportar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 font-mono text-muted-foreground font-medium text-sm">ID Res</th>
                  <th className="p-3 font-mono text-muted-foreground font-medium text-sm">Anticipación</th>
                  <th className="p-3 font-mono text-muted-foreground font-medium text-sm">Segmento</th>
                  <th className="p-3 font-mono text-muted-foreground font-medium text-sm">Puntaje Riesgo</th>
                  <th className="p-3 font-mono text-muted-foreground font-medium text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-foreground font-medium text-sm">RES-0984</td>
                  <td className="p-3 text-foreground text-sm">142 días</td>
                  <td className="p-3 text-foreground text-sm">Online TA</td>
                  <td className="p-3 text-foreground text-sm">0.94</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-1 rounded bg-destructive text-destructive-foreground font-mono text-[11px] uppercase tracking-wider">Alto Riesgo</span>
                  </td>
                </tr>
                <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-foreground font-medium text-sm">RES-1042</td>
                  <td className="p-3 text-foreground text-sm">85 días</td>
                  <td className="p-3 text-foreground text-sm">Direct</td>
                  <td className="p-3 text-foreground text-sm">0.88</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-1 rounded bg-destructive text-destructive-foreground font-mono text-[11px] uppercase tracking-wider">Alto Riesgo</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
