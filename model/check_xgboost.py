import numpy as np

from model.pipeline import build_model_pipeline
from model.processing.split import (
    create_partitions,
    load_config,
    load_dataset,
)


def main():
    config = load_config()
    X, y, metadata = create_partitions(load_dataset(config), config)
    dev = metadata["partition"].eq("development")
    train = dev & ~metadata["cv_fold"].eq(0)
    valid = dev & metadata["cv_fold"].eq(0)
    pipeline = build_model_pipeline(
        "xgboost",
        config,
        params_override={"n_estimators": 5, "max_depth": 2},
    )
    print("Prueba de interfaz: fold 0, cinco arboles.", flush=True)
    pipeline.fit(X.loc[train], y.loc[train])
    if not np.array_equal(pipeline.classes_, [0, 1]):
        raise ValueError("Se esperaban clases [0, 1].")
    proba = pipeline.predict_proba(X.loc[valid])[:, 1]
    if len(proba) != int(valid.sum()):
        raise ValueError("Numero de predicciones incorrecto.")
    if not np.isfinite(proba).all():
        raise ValueError("Hay probabilidades no finitas.")
    if not ((proba >= 0) & (proba <= 1)).all():
        raise ValueError("Probabilidades fuera de [0, 1].")
    print("PRUEBA OK. Predicciones:", len(proba))
    print("No se utilizo test ni se registro un experimento.")


if __name__ == "__main__":
    main()
