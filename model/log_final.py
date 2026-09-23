from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

import mlflow
import yaml

from model.experiment import (
    get_data_dvc_md5,
    get_git_branch,
    get_git_commit,
    load_experiment,
)
from model.pipeline import get_model_params
from model.processing.split import load_config

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_yaml(path: str | Path) -> dict[str, Any]:
    """Load a YAML file relative to the project root."""
    file_path = Path(path)

    if not file_path.is_absolute():
        file_path = PROJECT_ROOT / file_path

    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    with file_path.open(
        "r",
        encoding="utf-8",
    ) as file:
        content = yaml.safe_load(file)

    if content is None:
        raise ValueError(f"YAML file is empty: {file_path}")

    return content


def resolve_path(path: str | Path) -> Path:
    """Return an absolute project-relative path."""
    file_path = Path(path)

    if not file_path.is_absolute():
        file_path = PROJECT_ROOT / file_path

    return file_path


def log_final_test(
    experiment_path: str | Path,
    threshold_path: str | Path,
    results_path: str | Path,
    tracking_uri: str,
) -> None:
    """
    Register an already-computed final test evaluation in MLflow.

    This function does NOT retrain the model and does NOT evaluate
    the test set again.
    """
    config = load_config()
    experiment = load_experiment(experiment_path)
    threshold_result = load_yaml(threshold_path)
    test_results = load_yaml(results_path)

    resolved_params = get_model_params(
        model_name=experiment["model"],
        config=config,
        params_override=experiment["params"],
    )

    mlflow.set_tracking_uri(tracking_uri)

    mlflow.set_experiment(config["mlflow"]["experiment_name"])

    run_name = f"{experiment['name']}_final_test"

    with mlflow.start_run(run_name=run_name):
        # ----------------------------------------------------------
        # Parameters describing the selected model and experiment.
        # ----------------------------------------------------------
        mlflow.log_params(
            {
                "model_name": experiment["model"],
                "threshold": float(threshold_result["threshold"]),
                "threshold_selection_metric": (threshold_result["selection_metric"]),
                "cv_n_folds": config["split"]["cv_n_folds"],
                "test_n_folds": config["split"]["test_n_folds"],
                "test_fold": config["split"]["test_fold"],
                "random_state": config["split"]["random_state"],
                "n_predictors": (
                    len(config["features"]["categorical"])
                    + len(config["features"]["numerical"])
                ),
            }
        )

        mlflow.log_params(
            {
                f"model_{key}": ("None" if value is None else value)
                for key, value in resolved_params.items()
            }
        )

        # ----------------------------------------------------------
        # Threshold-selection metrics from development OOF only.
        # ----------------------------------------------------------
        oof_metrics = {
            key: float(value)
            for key, value in threshold_result.items()
            if key.startswith("oof_")
        }

        mlflow.log_metrics(oof_metrics)

        # ----------------------------------------------------------
        # Final test metrics already computed previously.
        # ----------------------------------------------------------
        test_metrics = {
            key: float(value)
            for key, value in test_results.items()
            if key != "threshold"
            and isinstance(
                value,
                (int, float),
            )
        }

        mlflow.log_metrics(test_metrics)

        # ----------------------------------------------------------
        # Traceability.
        # ----------------------------------------------------------
        mlflow.set_tags(
            {
                "evaluation_stage": "final_test",
                "test_usage": ("single fixed holdout evaluation"),
                "threshold_source": ("development out-of-fold predictions"),
                "git_commit": get_git_commit(),
                "git_branch": get_git_branch(),
                "data_dvc_md5": get_data_dvc_md5(),
            }
        )

        # ----------------------------------------------------------
        # Configuration and evaluation artifacts.
        # ----------------------------------------------------------
        mlflow.log_artifact(
            str(resolve_path(experiment_path)),
            artifact_path="configuration",
        )

        mlflow.log_artifact(
            str(resolve_path(threshold_path)),
            artifact_path="evaluation",
        )

        mlflow.log_artifact(
            str(resolve_path(results_path)),
            artifact_path="evaluation",
        )

        mlflow.log_artifact(
            str(PROJECT_ROOT / "model" / "config.yml"),
            artifact_path="configuration",
        )

        print("\nFinal test run registered successfully in MLflow.")


def parse_args():
    parser = argparse.ArgumentParser(
        description=("Register the already-computed final test evaluation in MLflow.")
    )

    parser.add_argument(
        "--experiment",
        required=True,
    )

    parser.add_argument(
        "--threshold",
        required=True,
    )

    parser.add_argument(
        "--results",
        required=True,
    )

    parser.add_argument(
        "--tracking-uri",
        default=os.getenv("MLFLOW_TRACKING_URI"),
        required=False,
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    if not args.tracking_uri:
        raise ValueError("An MLflow tracking URI is required.")

    log_final_test(
        experiment_path=args.experiment,
        threshold_path=args.threshold,
        results_path=args.results,
        tracking_uri=args.tracking_uri,
    )
