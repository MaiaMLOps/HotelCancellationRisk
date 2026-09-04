# Modelamiento — Hotel Cancellation Risk

Este módulo implementa un flujo reproducible para experimentar con modelos de clasificación de cancelación hotelera, manteniendo constantes los datos, las particiones, el preprocessing y las métricas de evaluación.

## Estructura

```text
model/
├── config.yml
├── pipeline.py
├── evaluate.py
├── experiment.py
├── tune.py
├── threshold.py
├── final_evaluate.py
├── log_final.py
│
├── experiments/
├── tuning/
├── thresholds/
├── results/
│
└── processing/
    ├── split.py
    └── preprocessing.py
```

### Archivos principales

- `config.yml`: define target, variables, split, preprocessing, métricas y parámetros por defecto.
- `processing/split.py`: crea la partición fija development/test y los 5 folds de validación cruzada.
- `processing/preprocessing.py`: implementa imputación, codificación categórica y escalamiento.
- `pipeline.py`: combina preprocessing + clasificador.
- `evaluate.py`: calcula métricas de validación cruzada.
- `experiment.py`: ejecuta una configuración específica y opcionalmente la registra en MLflow.
- `tune.py`: ejecuta `RandomizedSearchCV` reutilizando los mismos folds.
- `threshold.py`: selecciona el threshold mediante predicciones out-of-fold de development.
- `final_evaluate.py`: entrena con todo development y evalúa una única vez sobre test.
- `log_final.py`: registra en MLflow los resultados finales ya calculados.

---

## Flujo de procesamiento y modelamiento

### 1. Datos y variables

Target:

```text
is_canceled
```

Se excluyen:

```text
reservation_status
reservation_status_date
```

Se utilizan las 29 variables predictoras restantes.

### 2. Partición

El dataset se divide en:

```text
80 % development
20 % test
```

La partición utiliza `StratifiedGroupKFold` para evitar que patrones idénticos de predictores aparezcan en más de una partición.

Dentro de `development` se utilizan 5 folds fijos para validación cruzada.

### 3. Preprocessing

Variables categóricas:

```text
faltantes → "Missing" → string → OneHotEncoder
```

Variables numéricas:

```text
mediana → StandardScaler
```

El preprocessing se ajusta únicamente con los datos de entrenamiento de cada fold.

### 4. Modelos actualmente soportados

- `DummyClassifier`
- `LogisticRegression`
- `RandomForestClassifier`

Todos reutilizan el mismo split, preprocessing y evaluación.

---

## Ejecutar un experimento

Los experimentos específicos se definen en:

```text
model/experiments/
```

Ejemplo:

```yaml
name: random_forest_example
model: random_forest

params:
  n_estimators: 300
  max_depth: 16
```

Ejecutar:

```bash
python -m model.experiment --experiment model/experiments/random_forest_example.yml
```

Los parámetros no especificados se toman de `config.yml`.

---

## Búsqueda de hiperparámetros

Los espacios de búsqueda se definen en:

```text
model/tuning/
```

Ejecutar:

```bash
python -m model.tune \
  --tuning model/tuning/random_forest.yml \
  --save-best model/experiments/random_forest_tuned.yml
```

`RandomizedSearchCV` reutiliza exactamente los mismos 5 folds definidos en `split.py`.

La búsqueda utiliza `Average Precision` como métrica para seleccionar hiperparámetros.

---

## Ajuste del threshold

Después de seleccionar los hiperparámetros:

```bash
python -m model.threshold \
  --experiment model/experiments/random_forest_tuned.yml \
  --save model/thresholds/random_forest_tuned.yml
```

El threshold se selecciona maximizando F2 sobre predicciones out-of-fold de `development`.

El conjunto `test` no participa en esta etapa.

---

## Evaluación final

```bash
python -m model.final_evaluate \
  --experiment model/experiments/random_forest_tuned.yml \
  --threshold model/thresholds/random_forest_tuned.yml \
  --save model/results/random_forest_tuned_test.yml
```

El modelo se entrena con todo `development` y se evalúa una única vez sobre `test`.

---

## MLflow

El equipo utiliza un servidor central de MLflow para comparar experimentos.

Ejecutar una corrida y registrarla:

```bash
python -m model.experiment \
  --experiment model/experiments/random_forest_tuned.yml \
  --tracking-uri http://<MLFLOW_HOST>:8050
```

Todos los integrantes deben usar el experimento:

```text
hotel-cancellation-modeling
```

Cada corrida registra:

- modelo e hiperparámetros;
- métricas CV;
- métricas ponderadas por patrón;
- commit y rama Git;
- MD5 del dataset DVC;
- configuración y resultados por fold.

La evaluación final se registra con:

```bash
python -m model.log_final \
  --experiment model/experiments/random_forest_tuned.yml \
  --threshold model/thresholds/random_forest_tuned.yml \
  --results model/results/random_forest_tuned_test.yml \
  --tracking-uri http://<MLFLOW_HOST>:8050
```

---

## Agregar un nuevo modelo

Para modelos compatibles con la interfaz de scikit-learn y con el preprocessing actual:

1. Agregar parámetros por defecto en `config.yml`.
2. Registrar el nombre en `SUPPORTED_MODELS` dentro de `pipeline.py`.
3. Implementar su construcción en `build_estimator()`.
4. Crear un YAML en `experiments/` o `tuning/`.
5. Ejecutar el experimento normalmente.

Ejemplo conceptual:

```python
if model_name == "xgboost":
    return XGBClassifier(**params)
```

El nuevo modelo reutilizará:

- mismo dataset;
- mismo split;
- mismos folds;
- mismo preprocessing;
- mismas métricas;
- mismo MLflow.

Si una familia requiere preprocessing específico, debe conservar al menos el mismo split, folds y esquema de evaluación para mantener comparabilidad.

---

## Dependencias

Modelamiento:

```bash
pip install -r requirements/modeling.txt
```

DVC:

```bash
pip install -r requirements/dvc.txt
```

Datos:

```bash
dvc pull
```