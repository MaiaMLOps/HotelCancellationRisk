from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

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
        raise FileNotFoundError(
            f"Experiment file not found: {path}"
        )

    with path.open("r", encoding="utf-8") as file:
        experiment = yaml.safe_load(file)

    required_fields = {
        "name",
        "model",
        "params",
    }

    missing_fields = (
        required_fields
        - set(experiment)
    )

    if missing_fields:
        raise ValueError(
            "Experiment configuration is missing fields: "
            f"{sorted(missing_fields)}"
        )

    model_name = experiment["model"]

    if model_name not in SUPPORTED_MODELS:
        raise ValueError(
            f"Unsupported model '{model_name}'. "
            f"Available models: {sorted(SUPPORTED_MODELS)}"
        )

    if not isinstance(
        experiment["params"],
        dict,
    ):
        raise TypeError(
            "'params' must be a YAML dictionary."
        )

    return experiment


def run_experiment(
    experiment_path: str | Path,
):
    """
    Run one reproducible model experiment using the shared
    dataset, folds, preprocessing and evaluation logic.
    """
    config = load_config()
    experiment = load_experiment(
        experiment_path
    )

    model_name = experiment["model"]
    params_override = experiment["params"]

    resolved_params = get_model_params(
        model_name=model_name,
        config=config,
        params_override=params_override,
    )

    print("\n" + "=" * 70)
    print(
        f"EXPERIMENT: {experiment['name']}"
    )
    print(f"MODEL: {model_name}")

    if experiment.get("description"):
        print(
            f"DESCRIPTION: "
            f"{experiment['description']}"
        )

    print(
        f"RESOLVED PARAMETERS: "
        f"{resolved_params}"
    )
    print("=" * 70)

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
        description=(
            "Run one hotel-cancellation "
            "model experiment."
        )
    )

    parser.add_argument(
        "--experiment",
        required=True,
        help=(
            "Path to an experiment YAML file, "
            "for example "
            "model/experiments/"
            "random_forest_default.yml"
        ),
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    run_experiment(
        args.experiment
    )