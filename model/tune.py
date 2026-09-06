from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import yaml
from sklearn.model_selection import RandomizedSearchCV

from model.pipeline import (
    SUPPORTED_MODELS,
    build_model_pipeline,
)
from model.processing.split import (
    create_partitions,
    load_config,
    load_dataset,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_tuning_config(
    tuning_path: str | Path,
) -> dict[str, Any]:
    """Load and validate one tuning definition."""
    path = Path(tuning_path)

    if not path.is_absolute():
        path = PROJECT_ROOT / path

    if not path.exists():
        raise FileNotFoundError(f"Tuning configuration not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        tuning = yaml.safe_load(file)

    if tuning is None:
        raise ValueError(f"Tuning configuration is empty: {path}")

    required = {
        "name",
        "model",
        "search",
        "params",
    }

    missing = required - set(tuning)

    if missing:
        raise ValueError(f"Missing tuning fields: {sorted(missing)}")

    if tuning["model"] not in SUPPORTED_MODELS:
        raise ValueError(
            f"Unsupported model '{tuning['model']}'. "
            f"Available models: {sorted(SUPPORTED_MODELS)}"
        )

    return tuning


def build_fixed_cv_splits(
    metadata_dev: pd.DataFrame,
) -> list[tuple[np.ndarray, np.ndarray]]:
    """
    Convert the previously assigned cv_fold values into explicit
    positional train/validation indices.

    RandomizedSearchCV therefore reuses exactly the same folds.
    """
    fold_values = metadata_dev["cv_fold"].to_numpy()

    cv_splits = []

    for fold in sorted(metadata_dev["cv_fold"].unique()):
        train_idx = np.flatnonzero(fold_values != fold)
        validation_idx = np.flatnonzero(fold_values == fold)

        cv_splits.append((train_idx, validation_idx))

    return cv_splits


def strip_classifier_prefix(
    params: dict[str, Any],
) -> dict[str, Any]:
    """
    Convert pipeline search parameters into estimator parameters.

    classifier__max_depth -> max_depth
    """
    prefix = "classifier__"

    return {(key.removeprefix(prefix)): value for key, value in params.items()}


def save_best_experiment(
    output_path: str | Path,
    tuning: dict[str, Any],
    best_params: dict[str, Any],
) -> None:
    """Save the selected configuration as a reusable experiment YAML."""
    path = Path(output_path)

    if not path.is_absolute():
        path = PROJECT_ROOT / path

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    experiment = {
        "name": f"{tuning['name']}_best",
        "model": tuning["model"],
        "description": (
            "Best configuration selected by "
            "RandomizedSearchCV on the fixed "
            "development folds."
        ),
        "params": strip_classifier_prefix(best_params),
    }

    with path.open(
        "w",
        encoding="utf-8",
    ) as file:
        yaml.safe_dump(
            experiment,
            file,
            sort_keys=False,
            allow_unicode=True,
        )

    print(f"\nBest experiment saved to: {path}")


def run_tuning(
    tuning_path: str | Path,
):
    """Run RandomizedSearchCV over the fixed development folds."""
    config = load_config()
    tuning = load_tuning_config(tuning_path)

    df = load_dataset(config)

    X, y, metadata = create_partitions(
        df,
        config,
    )

    development_mask = metadata["partition"].eq("development")

    X_dev = X.loc[development_mask].reset_index(drop=True)

    y_dev = y.loc[development_mask].reset_index(drop=True)

    metadata_dev = metadata.loc[development_mask].reset_index(drop=True)

    cv_splits = build_fixed_cv_splits(metadata_dev)

    pipeline = build_model_pipeline(
        model_name=tuning["model"],
        config=config,
    )

    search_config = tuning["search"]

    search = RandomizedSearchCV(
        estimator=pipeline,
        param_distributions=tuning["params"],
        n_iter=search_config["n_iter"],
        scoring=search_config["scoring"],
        cv=cv_splits,
        random_state=config["split"]["random_state"],
        n_jobs=search_config.get(
            "n_jobs",
            1,
        ),
        refit=True,
        return_train_score=False,
        verbose=1,
    )

    print("\n" + "=" * 70)
    print(f"TUNING: {tuning['name']}")
    print(f"MODEL: {tuning['model']}")
    print(f"DEVELOPMENT ROWS: {len(X_dev)}")
    print(f"FIXED CV FOLDS: {len(cv_splits)}")
    print(f"RANDOM CONFIGURATIONS: {search_config['n_iter']}")
    print("=" * 70)

    search.fit(
        X_dev,
        y_dev,
    )

    results = (
        pd.DataFrame(search.cv_results_)
        .sort_values("rank_test_score")
        .reset_index(drop=True)
    )

    print("\nBEST RESULT")
    print(f"Score: {search.best_score_:.4f}")
    print(f"Parameters: {search.best_params_}")

    print("\nTOP 5 CONFIGURATIONS")

    for _, row in results.head(5).iterrows():
        print(
            f"rank={int(row['rank_test_score'])} | "
            f"score={row['mean_test_score']:.4f} "
            f"+/- {row['std_test_score']:.4f} | "
            f"params={row['params']}"
        )

    return tuning, search, results


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Tune one model using RandomizedSearchCV and the fixed grouped CV folds."
        )
    )

    parser.add_argument(
        "--tuning",
        required=True,
        help=("Path to tuning YAML, for example model/tuning/random_forest.yml"),
    )

    parser.add_argument(
        "--save-best",
        required=False,
        help=(
            "Optional path where the best configuration "
            "will be saved as an experiment YAML."
        ),
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    tuning, search, _ = run_tuning(args.tuning)

    if args.save_best:
        save_best_experiment(
            output_path=args.save_best,
            tuning=tuning,
            best_params=search.best_params_,
        )
