from typing import Any

from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from model.processing.preprocessing import build_preprocessor


SUPPORTED_MODELS = {
    "dummy",
    "logistic_regression",
    "random_forest",
    "xgboost",
    "catboost",
}

def get_model_params(
    model_name: str,
    config: dict,
    params_override: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Return model parameters for one experiment.

    Parameters defined in config.yml act as defaults.
    params_override can replace or add parameters for a particular run
    without modifying the shared project configuration.
    """
    if model_name not in SUPPORTED_MODELS:
        raise ValueError(
            f"Unsupported model '{model_name}'. "
            f"Available models: {sorted(SUPPORTED_MODELS)}"
        )

    default_params = config["models"][model_name].copy()

    if params_override:
        default_params.update(params_override)

    return default_params


def build_estimator(
    model_name: str,
    config: dict,
    params_override: dict[str, Any] | None = None,
):
    """
    Build a classifier using shared defaults plus optional experiment-specific
    parameter overrides.
    """
    params = get_model_params(
        model_name=model_name,
        config=config,
        params_override=params_override,
    )

    random_state = config["split"]["random_state"]

    if model_name == "dummy":
        return DummyClassifier(
            **params,
        )

    if model_name == "logistic_regression":
        params.setdefault(
            "random_state",
            random_state,
        )

        return LogisticRegression(
            **params,
        )

    if model_name == "random_forest":
        params.setdefault(
            "random_state",
            random_state,
        )

        return RandomForestClassifier(
            **params,
        )
        
    if model_name == "xgboost":
        try:
            from xgboost import XGBClassifier
        except ImportError as exc:
            raise ImportError(
                "Instala requirements/xgboost.txt en el entorno activo."
            ) from exc
        params.setdefault("random_state", random_state)
        return XGBClassifier(**params)
    
    if model_name == "catboost":
        try:
            from catboost import CatBoostClassifier
        except ImportError as exc:
            raise ImportError(
                "Instala catboost en el entorno activo (pip install catboost)."
            ) from exc
        
        params.setdefault("random_state", random_state)
        
        # Identificar índices de las columnas categóricas
        num_cat_features = len(config["features"]["categorical"])
        cat_indices = list(range(num_cat_features))
        
        params.setdefault("verbose", False)
        params.setdefault("cat_features", cat_indices)
        
        return CatBoostClassifier(**params)
    
    raise RuntimeError(
        f"Estimator construction failed for '{model_name}'."
    )


def build_model_pipeline(
    model_name: str,
    config: dict,
    params_override: dict[str, Any] | None = None,
) -> Pipeline:
    return Pipeline(
        steps=[
            (
                "preprocessor",
                build_preprocessor(config, model_name=model_name),
            ),
            (
                "classifier",
                build_estimator(
                    model_name=model_name,
                    config=config,
                    params_override=params_override,
                ),
            ),
        ]
    )