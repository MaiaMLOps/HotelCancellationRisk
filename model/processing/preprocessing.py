from typing import Any

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    FunctionTransformer,
    OneHotEncoder,
    StandardScaler,
)


def _categorical_to_string(
    X: Any,
    missing_value: str = "Missing",
) -> pd.DataFrame:
    """
    Convert categorical variables to strings and represent missing
    values explicitly.

    This is especially important for agent and company, which are
    categorical IDs although pandas reads them as float because they
    contain missing values.
    """
    if isinstance(X, pd.DataFrame):
        frame = X.copy()
    else:
        frame = pd.DataFrame(X)

    return (
        frame.astype("string")
        .fillna(missing_value)
        .astype(str)
    )


def build_preprocessor(config: dict, model_name: str = "") -> ColumnTransformer:
    categorical_columns = config["features"]["categorical"]
    numerical_columns = config["features"]["numerical"]
    preprocessing_config = config["preprocessing"]

    # 1. Paso base para categorías (texto)
    cat_steps = [
        (
            "to_string",
            FunctionTransformer(
                _categorical_to_string,
                validate=False,
                feature_names_out="one-to-one",
                kw_args={
                    "missing_value": preprocessing_config["categorical_missing_value"]
                },
            ),
        )
    ]

    # 2. Condicionar el OHE (CatBoost no lo necesita)
    if model_name != "catboost":
        cat_steps.append(
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=True,
                ),
            )
        )

    categorical_pipeline = Pipeline(steps=cat_steps)

    numerical_steps = [
        (
            "imputer",
            SimpleImputer(strategy=preprocessing_config["numerical_imputer"]),
        )
    ]

    if preprocessing_config["scale_numerical"]:
        numerical_steps.append(("scaler", StandardScaler()))

    numerical_pipeline = Pipeline(steps=numerical_steps)

    return ColumnTransformer(
        transformers=[
            ("categorical", categorical_pipeline, categorical_columns),
            ("numerical", numerical_pipeline, numerical_columns),
        ],
        remainder="drop",
    )