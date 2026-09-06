from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
import yaml
from sklearn.metrics import (
    fbeta_score,
    precision_score,
    recall_score,
)

from model.experiment import load_experiment
from model.pipeline import build_model_pipeline
from model.processing.split import (
    create_partitions,
    load_config,
    load_dataset,
)

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def generate_oof_predictions(
    experiment_path: str | Path,
) -> tuple[
    pd.Series,
    np.ndarray,
    pd.Series,
]:
    """
    Generate out-of-fold probabilities for every observation
    in the development partition.

    Each reservation is predicted by a model that was not trained
    on its own CV fold. The fixed test partition is never used.
    """
    config = load_config()
    experiment = load_experiment(experiment_path)

    df = load_dataset(config)
    X, y, metadata = create_partitions(
        df,
        config,
    )

    development_mask = metadata["partition"].eq("development")

    development_indices = np.flatnonzero(development_mask.to_numpy())

    oof_probability = np.full(
        len(df),
        np.nan,
        dtype=float,
    )

    n_folds = config["split"]["cv_n_folds"]

    for fold in range(n_folds):
        train_mask = metadata["partition"].eq("development") & ~metadata["cv_fold"].eq(
            fold
        )

        validation_mask = metadata["partition"].eq("development") & metadata[
            "cv_fold"
        ].eq(fold)

        pipeline = build_model_pipeline(
            model_name=experiment["model"],
            config=config,
            params_override=experiment["params"],
        )

        print(f"Training fold {fold + 1}/{n_folds}...")

        pipeline.fit(
            X.loc[train_mask],
            y.loc[train_mask],
        )

        oof_probability[np.flatnonzero(validation_mask.to_numpy())] = (
            pipeline.predict_proba(X.loc[validation_mask])[:, 1]
        )

    probabilities = oof_probability[development_indices]

    if np.isnan(probabilities).any():
        raise RuntimeError("Some development observations have no OOF prediction.")

    y_dev = y.loc[development_mask].reset_index(drop=True)

    weights_dev = metadata.loc[
        development_mask,
        "pattern_weight",
    ].reset_index(drop=True)

    return (
        y_dev,
        probabilities,
        weights_dev,
    )


def evaluate_thresholds(
    y_true: pd.Series,
    probabilities: np.ndarray,
    pattern_weights: pd.Series,
    thresholds: np.ndarray,
) -> pd.DataFrame:
    """
    Evaluate candidate decision thresholds.

    Conventional per-reservation F2 is the optimization criterion.
    Pattern-weighted F2 is retained as sensitivity information.
    """
    rows = []

    for threshold in thresholds:
        y_pred = (probabilities >= threshold).astype(int)

        rows.append(
            {
                "threshold": float(threshold),
                "f2": fbeta_score(
                    y_true,
                    y_pred,
                    beta=2,
                    zero_division=0,
                ),
                "precision": precision_score(
                    y_true,
                    y_pred,
                    zero_division=0,
                ),
                "recall": recall_score(
                    y_true,
                    y_pred,
                    zero_division=0,
                ),
                "pattern_f2": fbeta_score(
                    y_true,
                    y_pred,
                    beta=2,
                    sample_weight=pattern_weights,
                    zero_division=0,
                ),
            }
        )

    return pd.DataFrame(rows)


def save_threshold_result(
    output_path: str | Path,
    experiment_path: str | Path,
    best_row: pd.Series,
) -> None:
    """Persist the selected decision threshold."""
    path = Path(output_path)

    if not path.is_absolute():
        path = PROJECT_ROOT / path

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    result = {
        "experiment": str(experiment_path),
        "selection_metric": "f2",
        "threshold": float(best_row["threshold"]),
        "oof_f2": float(best_row["f2"]),
        "oof_precision": float(best_row["precision"]),
        "oof_recall": float(best_row["recall"]),
        "oof_pattern_f2": float(best_row["pattern_f2"]),
    }

    with path.open(
        "w",
        encoding="utf-8",
    ) as file:
        yaml.safe_dump(
            result,
            file,
            sort_keys=False,
            allow_unicode=True,
        )

    print(f"\nThreshold result saved to: {path}")


def run_threshold_search(
    experiment_path: str | Path,
):
    """
    Generate OOF predictions and select the threshold maximizing
    conventional F2 on development.
    """
    y_dev, probabilities, weights = generate_oof_predictions(experiment_path)

    # Dense enough for this prototype while remaining simple
    # and completely deterministic.
    thresholds = np.linspace(
        0.05,
        0.95,
        181,
    )

    results = evaluate_thresholds(
        y_true=y_dev,
        probabilities=probabilities,
        pattern_weights=weights,
        thresholds=thresholds,
    )

    best_idx = results["f2"].idxmax()
    best = results.loc[best_idx]

    print("\n" + "=" * 60)
    print("THRESHOLD SELECTION — DEVELOPMENT OOF")
    print("=" * 60)
    print(f"Best threshold : {best['threshold']:.3f}")
    print(f"OOF F2         : {best['f2']:.4f}")
    print(f"OOF Recall     : {best['recall']:.4f}")
    print(f"OOF Precision  : {best['precision']:.4f}")
    print(f"Pattern F2     : {best['pattern_f2']:.4f}")

    return results, best


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Select a decision threshold using out-of-fold development predictions."
        )
    )

    parser.add_argument(
        "--experiment",
        required=True,
        help=("Experiment YAML used to build the model."),
    )

    parser.add_argument(
        "--save",
        required=False,
        help=("Optional YAML path where the selected threshold will be persisted."),
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    _, best = run_threshold_search(args.experiment)

    if args.save:
        save_threshold_result(
            output_path=args.save,
            experiment_path=args.experiment,
            best_row=best,
        )
