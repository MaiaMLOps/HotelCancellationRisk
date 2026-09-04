from __future__ import annotations

import argparse
from time import perf_counter
from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    auc,
    average_precision_score,
    f1_score,
    fbeta_score,
    precision_recall_curve,
    precision_score,
    recall_score,
)

from model.pipeline import (
    SUPPORTED_MODELS,
    build_model_pipeline,
    get_model_params,
)
from model.processing.split import (
    create_partitions,
    load_config,
    load_dataset,
)


METRIC_COLUMNS = [
    "average_precision",
    "pr_auc",
    "f2",
    "precision",
    "recall",
    "f1",
    "pattern_average_precision",
    "pattern_pr_auc",
    "pattern_f2",
    "pattern_precision",
    "pattern_recall",
    "pattern_f1",
]


def calculate_metrics(
    y_true: pd.Series,
    y_probability: np.ndarray,
    threshold: float,
    sample_weight: np.ndarray | pd.Series | None = None,
) -> dict[str, float]:
    """
    Calculate classification metrics from predicted probabilities.

    Parameters
    ----------
    y_true:
        True binary labels.

    y_probability:
        Estimated probability of class 1 (cancellation).

    threshold:
        Decision threshold used to convert probabilities into class labels.

    sample_weight:
        Optional observation weights.

        If None, every reservation receives equal weight.

        When pattern weights are supplied, repeated predictor patterns have
        approximately equal total influence in the resulting metrics.

    Returns
    -------
    dict[str, float]
        Average Precision, F2, precision, recall and F1.
    """
    y_pred = (
        y_probability >= threshold
    ).astype(int)

    precision_curve, recall_curve, _ = precision_recall_curve(
        y_true,
        y_probability,
        sample_weight=sample_weight,
    )

    pr_auc = auc(
        recall_curve,
        precision_curve,
    )

    return {
        "average_precision": average_precision_score(
            y_true,
            y_probability,
            sample_weight=sample_weight,
        ),
        "pr_auc": pr_auc,
        "f2": fbeta_score(
            y_true,
            y_pred,
            beta=2,
            sample_weight=sample_weight,
            zero_division=0,
        ),
        "precision": precision_score(
            y_true,
            y_pred,
            sample_weight=sample_weight,
            zero_division=0,
        ),
        "recall": recall_score(
            y_true,
            y_pred,
            sample_weight=sample_weight,
            zero_division=0,
        ),
        "f1": f1_score(
            y_true,
            y_pred,
            sample_weight=sample_weight,
            zero_division=0,
        ),
    }


def evaluate_cv(
    model_name: str,
    config: dict,
    params_override: dict[str, Any] | None = None,
) -> tuple[pd.DataFrame, dict[str, float]]:
    """
    Evaluate one model configuration using the shared grouped 5-fold CV.

    Only the development partition is used.

    The fixed test partition remains untouched throughout model comparison
    and hyperparameter tuning.

    Parameters
    ----------
    model_name:
        Name of a model registered in SUPPORTED_MODELS.

    config:
        Shared experiment configuration.

    params_override:
        Optional estimator parameters that override model defaults from
        config.yml for this particular experiment.

    Returns
    -------
    results_df:
        Metrics obtained independently in each CV fold.

    summary:
        Mean and standard deviation of each metric across folds.
    """
    df = load_dataset(config)

    X, y, metadata = create_partitions(
        df,
        config,
    )

    threshold = config[
        "evaluation"
    ]["threshold"]

    n_folds = config[
        "split"
    ]["cv_n_folds"]

    fold_results: list[
        dict[str, float | int]
    ] = []

    for fold in range(n_folds):

        train_mask = (
            metadata["partition"].eq(
                "development"
            )
            & ~metadata["cv_fold"].eq(fold)
        )

        validation_mask = (
            metadata["partition"].eq(
                "development"
            )
            & metadata["cv_fold"].eq(fold)
        )

        pipeline = build_model_pipeline(
            model_name=model_name,
            config=config,
            params_override=params_override,
        )

        start = perf_counter()

        pipeline.fit(
            X.loc[train_mask],
            y.loc[train_mask],
        )

        fit_seconds = (
            perf_counter() - start
        )

        probabilities = (
            pipeline.predict_proba(
                X.loc[validation_mask]
            )[:, 1]
        )

        # --------------------------------------------------------------
        # Conventional evaluation:
        # every reservation contributes equally.
        # --------------------------------------------------------------
        reservation_metrics = calculate_metrics(
            y_true=y.loc[validation_mask],
            y_probability=probabilities,
            threshold=threshold,
        )

        # --------------------------------------------------------------
        # Pattern-weighted sensitivity analysis:
        # repeated predictor patterns receive lower individual weight.
        # --------------------------------------------------------------
        pattern_metrics = calculate_metrics(
            y_true=y.loc[validation_mask],
            y_probability=probabilities,
            threshold=threshold,
            sample_weight=metadata.loc[
                validation_mask,
                "pattern_weight",
            ],
        )

        result = {
            "fold": fold,
            "train_rows": int(
                train_mask.sum()
            ),
            "validation_rows": int(
                validation_mask.sum()
            ),
            "fit_seconds": fit_seconds,
            **reservation_metrics,
            **{
                f"pattern_{metric}": value
                for metric, value
                in pattern_metrics.items()
            },
        }

        fold_results.append(result)

        print(
            f"{model_name:20s} | "
            f"fold={fold} | "
            f"AP={result['average_precision']:.4f} | "
            f"PR-AUC={result['pr_auc']:.4f} | "
            f"F2={result['f2']:.4f} | "
            f"Recall={result['recall']:.4f} | "
            f"time={fit_seconds:.1f}s"
        )

    results_df = pd.DataFrame(
        fold_results
    )

    summary: dict[str, float] = {}

    for metric in METRIC_COLUMNS:

        summary[
            f"cv_{metric}_mean"
        ] = float(
            results_df[metric].mean()
        )

        summary[
            f"cv_{metric}_std"
        ] = float(
            results_df[metric].std(
                ddof=1
            )
        )

    summary[
        "cv_fit_seconds_mean"
    ] = float(
        results_df[
            "fit_seconds"
        ].mean()
    )

    return results_df, summary


def print_cv_summary(
    model_name: str,
    config: dict,
    summary: dict[str, float],
    params_override: dict[str, Any] | None = None,
) -> None:
    """
    Print a compact summary of one cross-validation experiment.
    """
    params = get_model_params(
        model_name=model_name,
        config=config,
        params_override=params_override,
    )

    print(
        "\n" + "=" * 60
    )
    print(
        f"MODEL: {model_name}"
    )
    print(
        f"PARAMETERS: {params}"
    )
    print(
        "=" * 60
    )

    print(
        "Average Precision : "
        f"{summary['cv_average_precision_mean']:.4f} "
        "+/- "
        f"{summary['cv_average_precision_std']:.4f}"
    )

    print(
        "PR-AUC            : "
        f"{summary['cv_pr_auc_mean']:.4f} "
        "+/- "
        f"{summary['cv_pr_auc_std']:.4f}"
    )

    print(
        "F2                : "
        f"{summary['cv_f2_mean']:.4f} "
        "+/- "
        f"{summary['cv_f2_std']:.4f}"
    )

    print(
        "Recall            : "
        f"{summary['cv_recall_mean']:.4f} "
        "+/- "
        f"{summary['cv_recall_std']:.4f}"
    )

    print(
        "Precision         : "
        f"{summary['cv_precision_mean']:.4f} "
        "+/- "
        f"{summary['cv_precision_std']:.4f}"
    )

    print(
        "F1                : "
        f"{summary['cv_f1_mean']:.4f} "
        "+/- "
        f"{summary['cv_f1_std']:.4f}"
    )

    print(
        "\nPattern-weighted sensitivity:"
    )

    print(
        "Average Precision : "
        f"{summary['cv_pattern_average_precision_mean']:.4f} "
        "+/- "
        f"{summary['cv_pattern_average_precision_std']:.4f}"
    )

    print(
        "PR-AUC            : "
        f"{summary['cv_pattern_pr_auc_mean']:.4f} "
        "+/- "
        f"{summary['cv_pattern_pr_auc_std']:.4f}"
    )

    print(
        "F2                : "
        f"{summary['cv_pattern_f2_mean']:.4f} "
        "+/- "
        f"{summary['cv_pattern_f2_std']:.4f}"
    )

    print(
        "Recall            : "
        f"{summary['cv_pattern_recall_mean']:.4f} "
        "+/- "
        f"{summary['cv_pattern_recall_std']:.4f}"
    )

    print(
        "Precision         : "
        f"{summary['cv_pattern_precision_mean']:.4f} "
        "+/- "
        f"{summary['cv_pattern_precision_std']:.4f}"
    )

    print(
        "F1                : "
        f"{summary['cv_pattern_f1_mean']:.4f} "
        "+/- "
        f"{summary['cv_pattern_f1_std']:.4f}"
    )


def parse_args():
    """
    Parse command-line arguments.
    """
    parser = argparse.ArgumentParser(
        description=(
            "Evaluate hotel cancellation "
            "models with grouped CV."
        )
    )

    parser.add_argument(
        "--model",
        choices=(
            sorted(SUPPORTED_MODELS)
            + ["all"]
        ),
        default="all",
        help=(
            "Model to evaluate. "
            "Use 'all' to evaluate all "
            "currently supported models."
        ),
    )

    return parser.parse_args()


if __name__ == "__main__":

    args = parse_args()

    config = load_config()

    if args.model == "all":
        models_to_run = sorted(
            SUPPORTED_MODELS
        )
    else:
        models_to_run = [
            args.model
        ]

    for model_name in models_to_run:

        _, summary = evaluate_cv(
            model_name=model_name,
            config=config,
        )

        print_cv_summary(
            model_name=model_name,
            config=config,
            summary=summary,
        )