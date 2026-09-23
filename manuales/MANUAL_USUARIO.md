# Manual de Usuario — Tablero de Riesgo de Cancelación Hotelera

## 1. Proposito Del Tablero

Es una aplicación web que ayuda al equipo de revenue/operaciones a identificar,
antes de la llegada del huésped, qué reservas tienen mayor probabilidad de ser
canceladas, para poder actuar sobre ellas (ofertas, solicitud de depósito, etc.).
El tablero consume las predicciones de un modelo de machine learning (Random
Forest) entrenado sobre el histórico de reservas del hotel.

## 2. Acceso

Abra la URL del tablero en su navegador: https://hotelcancellationrisk.pages.dev.

## 3. Navegación

El tablero tiene una barra superior (o inferior, en móvil) con 4 secciones:

| Sección     | Ruta         | Qué muestra |
|-------------|--------------|-------------|
| **Tablero**     | `/`          | Resumen general: reservas en riesgo, tasa de cancelación global y PR-AUC del modelo. |
| **Reservas**    | `/riesgo`    | Listado de reservas priorizadas por probabilidad de cancelación, con búsqueda por ID. |
| **MLOps**       | `/mlops`     | Vista explicativa del pipeline de datos y modelamiento (dataset, EDA, features, MLflow, API), pensada para el equipo técnico. |
| **Alertas**     | `/validacion`| Detalle de una reserva puntual: predicción del modelo y acciones sugeridas. |

<img width="1251" height="589" alt="first" src="https://github.com/user-attachments/assets/b0c5f157-eae5-4337-8ded-1822ce2ee990" /> 

### 3.1 Tablero (resumen)

Muestra tres indicadores clave (KPI): reservas en riesgo, tasa de cancelación
y desempeño del modelo (PR-AUC), junto con gráficos de monitoreo.

<img width="831" height="169" alt="second" src="https://github.com/user-attachments/assets/60946c87-cc36-4493-84a1-42094cd58933" /> 

### 3.2 Reservas de riesgo priorizadas

Lista reservas ordenadas por prioridad (Alta / Media / Baja), con su
probabilidad estimada de cancelación y días de anticipación (lead time).
Puede buscar una reserva por su ID. Al hacer clic sobre una reserva se abre
su detalle en la sección **Alertas**.

<img width="825" height="195" alt="third" src="https://github.com/user-attachments/assets/a9c2e797-8576-45ed-8676-77ea82476a9b" />

### 3.3 Alertas / Detalle de reserva (predicción en vivo)

Aquí el tablero envía los atributos de la reserva a la API del modelo y
muestra:

- **Probabilidad de cancelación** (0–100 %).
- **Etiqueta de riesgo**: "Alto Riesgo" o "Bajo Riesgo", según el umbral de
  decisión del modelo (por defecto ≈ 0.205, calibrado para priorizar recall).
- Las **variables de entrada** usadas por el modelo (anticipación, segmento,
  noches, huéspedes, tipo de depósito, cancelaciones previas).
- Botones de **acción sugerida** (enviar oferta de descuento, solicitar
  depósito no reembolsable) — actualmente son botones informativos, no
  disparan un envío real de correo.

Si la API no está disponible, la sección mostrará "Error al obtener
predicción"; ver la sección 5 del Manual de Instalación para diagnosticar.

<img width="833" height="360" alt="four" src="https://github.com/user-attachments/assets/2c50ce14-4539-4ef4-891a-881d8dd10381" />

### 3.4 MLOps (vista de pipeline)

Sección educativa/de transparencia para el evaluador: resume cómo se
construyó el modelo (control de versiones de datos con DVC, EDA, feature
engineering, tracking de experimentos en MLflow) y los riesgos que el equipo
vigila en cada etapa (data drift, data leakage, etc.).

<img width="825" height="482" alt="five" src="https://github.com/user-attachments/assets/b41d4584-7450-485e-8d46-b2f2ea6369e2" />

## 4. Cómo interpretar una predicción

- **Probabilidad de cancelación**: qué tan probable es, según el modelo, que
  esta reserva específica se cancele antes de la llegada.
- **Umbral de decisión**: la etiqueta "Alto riesgo" se activa si la
  probabilidad supera el umbral configurado (no necesariamente 50 %); este
  umbral se eligió para priorizar detectar cancelaciones reales (recall)
  sobre minimizar falsas alarmas.
- El modelo apoya la decisión operativa; no reemplaza el criterio del
  analista, especialmente en reservas atípicas (grupos grandes, tarifas
  corporativas, etc.).
