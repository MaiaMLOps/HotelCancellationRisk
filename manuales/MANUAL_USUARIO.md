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
| **Predecir**    | `/predict`   | Formulario que reúne información relevante de la reserva  para predecir el riesgo. |
| **MLOps**       | `/mlops`     | Vista explicativa del pipeline de datos y modelamiento (dataset, EDA, features, MLflow, API), pensada para el equipo técnico. |
| **Alertas**     | `/validacion`| Detalle de una reserva puntual: predicción del modelo y acciones sugeridas. |

<img width="1288" height="602" alt="first" src="https://github.com/user-attachments/assets/08b7b63c-4816-4594-9663-4206e7cf4204" /> 

### 3.1 Tablero (resumen)

La vista Tablero constituye el punto de entrada para el análisis general del comportamiento de las reservas y del riesgo de cancelación. Su objetivo es presentar, de manera resumida y visual, los principales indicadores obtenidos a partir de los datos históricos y permitir al usuario tener una visión general del estado de las reservas antes de profundizar en casos particulares. En esta vista se concentran los principales indicadores clave de desempeño (KPIs) relacionados con el volumen de reservas, las cancelaciones y el comportamiento general del modelo de riesgo. Estos indicadores permiten identificar rápidamente la magnitud del problema y establecer un contexto para la interpretación de las predicciones generadas por el modelo.

<img width="825" height="551" alt="second" src="https://github.com/user-attachments/assets/ea22d734-b593-4c04-9af1-508751bffcd7" />

### 3.2 Reservas de riesgo priorizadas

La vista Reservas permite pasar del análisis agregado del Tablero a una exploración más detallada de las reservas disponibles en el conjunto de datos. Su finalidad es facilitar la consulta y segmentación de los registros para identificar características particulares asociadas con las reservas y su comportamiento frente a la cancelación. Lista reservas ordenadas por prioridad (Alta / Media / Baja), con su probabilidad estimada de cancelación y días de anticipación (lead time). Puede buscar una reserva por su ID. Al hacer clic sobre una reserva se abre su detalle en la sección **Alertas**. 

<img width="825" height="379" alt="third" src="https://github.com/user-attachments/assets/4ff89700-83af-48d9-9f99-b79951798500" />

### 3.3 Predecir
La vista Predecir constituye el componente central de inteligencia artificial de la aplicación. Su objetivo es permitir que un usuario ingrese las características de una reserva y obtenga una estimación del riesgo de que esta sea cancelada. El proceso comienza mediante un formulario en el que se introducen las variables relevantes de la reserva. Estas características corresponden a las variables utilizadas durante el entrenamiento del modelo, de manera que la información suministrada por el usuario pueda atravesar el mismo flujo de transformación empleado durante el desarrollo del sistema. Una vez diligenciada la información, la aplicación ejecuta el proceso de inferencia. Internamente, los datos pasan por la etapa de preprocesamiento, que incluye el tratamiento de variables numéricas y categóricas, la gestión de valores faltantes y la transformación de las variables al formato esperado por el modelo.

<img width="827" height="346" alt="four" src="https://github.com/user-attachments/assets/bf8ad917-424b-4830-891d-8b29921b9937" />

### 3.4 Alertas / Detalle de reserva (predicción en vivo)

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

<img width="825" height="497" alt="six" src="https://github.com/user-attachments/assets/812faa2c-4330-46eb-93f6-730627113393" />

### 3.5 MLOps (vista de pipeline)

Sección educativa/de transparencia para el evaluador: resume cómo se
construyó el modelo (control de versiones de datos con DVC, EDA, feature
engineering, tracking de experimentos en MLflow) y los riesgos que el equipo
vigila en cada etapa (data drift, data leakage, etc.).

<img width="825" height="485" alt="five" src="https://github.com/user-attachments/assets/e2145fea-c112-48a1-9e17-5b34baca8892" />

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
