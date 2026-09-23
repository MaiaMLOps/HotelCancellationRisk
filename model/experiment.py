from __future__ import annotations

import argparse
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import mlflow
import yaml

from model.evaluate import (
    evaluate_cv,
    print_cv_summary,
)
from model.pipeline import (
    SUPPORTED_MODELS,
    get_model_params,
)
from model.processing.split import load_config

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_experiment(
    experiment_path: str | Path,
) -> dict[str, Any]:
    """Load and validate one experiment definition."""
    path = Path(experiment_path)

    if not path.is_absolute():
        path = PROJECT_ROOT / path

    if not path.exists():
        raise FileNotFoundError(f"Experiment file not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        experiment = yaml.safe_load(file)

    if experiment is None:
        raise ValueError(f"Experiment configuration is empty: {path}")

    required_fields = {
        "name",
        "model",
        "params",
    }

    missing_fields = required_fields - set(experiment)

    if missing_fields:
        raise ValueError(
            f"Experiment configuration is missing fields: {sorted(missing_fields)}"
        )

    model_name = experiment["model"]

    if model_name not in SUPPORTED_MODELS:
        raise ValueError(
            f"Unsupported model '{model_name}'. "
            f"Available models: {sorted(SUPPORTED_MODELS)}"
        )

    if not isinstance(experiment["params"], dict):
        raise TypeError("'params' must be a YAML dictionary.")

    return experiment


def get_git_commit() -> str:
    """Return the current Git commit when available."""
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=PROJECT_ROOT,
            text=True,
        ).strip()
    except Exception:  # noqa: BLE001
        return "unknown"


def get_git_branch() -> str:
    """Return the current Git branch when available."""
    try:
        return subprocess.check_output(
            ["git", "branch", "--show-current"],
            cwd=PROJECT_ROOT,
            text=True,
        ).strip()
    except Exception:  # noqa: BLE001
        return "unknown"


def get_data_dvc_md5() -> str:
    """Read the dataset MD5 tracked by DVC."""
    dvc_path = PROJECT_ROOT / "data" / "dataset.csv.dvc"

    try:
        with dvc_path.open(
            "r",
            encoding="utf-8",
        ) as file:
            dvc_config = yaml.safe_load(file)

        return str(dvc_config["outs"][0]["md5"])
    except Exception:  # noqa: BLE001
        return "unknown"


def log_run_to_mlflow(
    experiment_definition: dict[str, Any],
    experiment_path: str | Path,
    resolved_params: dict[str, Any],
    fold_results,
    summary: dict[str, float],
    config: dict,
) -> None:
    """Log one completed CV experiment to the active MLflow run."""

    common_params = {
        "model_name": experiment_definition["model"],
        "threshold": config["evaluation"]["threshold"],
        "cv_n_folds": config["split"]["cv_n_folds"],
        "random_state": config["split"]["random_state"],
        "n_predictors": (
            len(config["features"]["categorical"])
            + len(config["features"]["numerical"])
        ),
    }

    mlflow.log_params(common_params)

    mlflow.log_params(
        {
            f"model_{key}": ("None" if value is None else value)
            for key, value in resolved_params.items()
        }
    )

    mlflow.log_metrics({key: float(value) for key, value in summary.items()})

    mlflow.set_tags(
        {
            "git_commit": get_git_commit(),
            "git_branch": get_git_branch(),
            "data_dvc_md5": get_data_dvc_md5(),
            "experiment_yaml": str(experiment_path),
        }
    )

    resolved_experiment = {
        "name": experiment_definition["name"],
        "model": experiment_definition["model"],
        "description": experiment_definition.get(
            "description",
            "",
        ),
        "resolved_params": resolved_params,
    }

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        folds_path = temp_path / "cv_fold_results.csv"
        resolved_path = temp_path / "resolved_experiment.yml"

        fold_results.to_csv(
            folds_path,
            index=False,
        )

        with resolved_path.open(
            "w",
            encoding="utf-8",
        ) as file:
            yaml.safe_dump(
                resolved_experiment,
                file,
                sort_keys=False,
                allow_unicode=True,
            )

        mlflow.log_artifact(
            str(folds_path),
            artifact_path="evaluation",
        )

        mlflow.log_artifact(
            str(resolved_path),
            artifact_path="configuration",
        )

        mlflow.log_artifact(
            str(PROJECT_ROOT / "model" / "config.yml"),
            artifact_path="configuration",
        )


def run_experiment(
    experiment_path: str | Path,
    tracking_uri: str | None = None,
):
    """
    Run one reproducible model experiment.

    If tracking_uri is supplied, the run is also recorded in MLflow.
    """
    config = load_config()

    experiment = load_experiment(experiment_path)

    model_name = experiment["model"]
    params_override = experiment["params"]

    resolved_params = get_model_params(
        model_name=model_name,
        config=config,
        params_override=params_override,
    )

    print("\n" + "=" * 70)
    print(f"EXPERIMENT: {experiment['name']}")
    print(f"MODEL: {model_name}")

    if experiment.get("description"):
        print(f"DESCRIPTION: {experiment['description']}")

    print(f"RESOLVED PARAMETERS: {resolved_params}")
    print("=" * 70)

    if tracking_uri:
        mlflow.set_tracking_uri(tracking_uri)

        mlflow.set_experiment(config["mlflow"]["experiment_name"])

        with mlflow.start_run(run_name=experiment["name"]):
            fold_results, summary = evaluate_cv(
                model_name=model_name,
                config=config,
                params_override=params_override,
            )

            print_cv_summary(
                model_name=model_name,
                config=config,
                summary=summary,
                params_override=params_override,
            )

            log_run_to_mlflow(
                experiment_definition=experiment,
                experiment_path=experiment_path,
                resolved_params=resolved_params,
                fold_results=fold_results,
                summary=summary,
                config=config,
            )

            print("\nMLflow run registered successfully.")

    else:
        fold_results, summary = evaluate_cv(
            model_name=model_name,
            config=config,
            params_override=params_override,
        )

        print_cv_summary(
            model_name=model_name,
            config=config,
            summary=summary,
            params_override=params_override,
        )

    return (
        experiment,
        resolved_params,
        fold_results,
        summary,
    )


def parse_args():
    parser = argparse.ArgumentParser(
        description=("Run one hotel-cancellation model experiment.")
    )

    parser.add_argument(
        "--experiment",
        required=True,
        help=("Path to an experiment YAML file."),
    )

    parser.add_argument(
        "--tracking-uri",
        default=os.getenv("MLFLOW_TRACKING_URI"),
        help=(
            "Optional MLflow tracking URI. "
            "It can also be supplied through "
            "MLFLOW_TRACKING_URI."
        ),
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    run_experiment(
        experiment_path=args.experiment,
        tracking_uri=args.tracking_uri,
    )
