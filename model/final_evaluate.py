from __future__ import annotations

import argparse
from pathlib import Path

import yaml
from sklearn.metrics import confusion_matrix

from model.evaluate import calculate_metrics
from model.experiment import load_experiment
from model.pipeline import build_model_pipeline
from model.processing.split import (
    create_partitions,
    load_config,
    load_dataset,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_threshold(path: str | Path) -> dict:
    """Load a previously selected decision threshold."""
    threshold_path = Path(path)

    if not threshold_path.is_absolute():
        threshold_path = PROJECT_ROOT / threshold_path

    with threshold_path.open(
        "r",
        encoding="utf-8",
    ) as file:
        threshold_config = yaml.safe_load(file)

    if threshold_config is None:
        raise ValueError(
            f"Threshold file is empty: {threshold_path}"
        )

    return threshold_config


def evaluate_test(
    experiment_path: str | Path,
    threshold_path: str | Path,
) -> dict:
    """
    Fit the selected pipeline on all development data and evaluate
    exactly once on the fixed test partition.
    """
    config = load_config()
    experiment = load_experiment(experiment_path)
    threshold_config = load_threshold(threshold_path)

    df = load_dataset(config)

    X, y, metadata = create_partitions(
        df,
        config,
    )

    development_mask = metadata[
        "partition"
    ].eq("development")

    test_mask = metadata[
        "partition"
    ].eq("test")

    threshold = float(
        threshold_config["threshold"]
    )

    pipeline = build_model_pipeline(
        model_name=experiment["model"],
        config=config,
        params_override=experiment["params"],
    )

    print("\nTraining final model on all development data...")

    pipeline.fit(
        X.loc[development_mask],
        y.loc[development_mask],
    )

    probabilities = pipeline.predict_proba(
        X.loc[test_mask]
    )[:, 1]

    reservation_metrics = calculate_metrics(
        y_true=y.loc[test_mask],
        y_probability=probabilities,
        threshold=threshold,
    )

    pattern_metrics = calculate_metrics(
        y_true=y.loc[test_mask],
        y_probability=probabilities,
        threshold=threshold,
        sample_weight=metadata.loc[
            test_mask,
            "pattern_weight",
        ],
    )

    predictions = (
        probabilities >= threshold
    ).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y.loc[test_mask],
        predictions,
    ).ravel()

    results = {
        "threshold": threshold,
        **{
            f"test_{key}": float(value)
            for key, value in reservation_metrics.items()
        },
        **{
            f"test_pattern_{key}": float(value)
            for key, value in pattern_metrics.items()
        },
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp),
    }

    print("\n" + "=" * 60)
    print("FINAL TEST EVALUATION")
    print("=" * 60)

    print(f"Experiment        : {experiment['name']}")
    print(f"Threshold         : {threshold:.3f}")
    print(
        f"Average Precision : "
        f"{results['test_average_precision']:.4f}"
    )
    print(
        f"PR-AUC            : "
        f"{results['test_pr_auc']:.4f}"
    )
    print(
        f"F2                : "
        f"{results['test_f2']:.4f}"
    )
    print(
        f"Recall            : "
        f"{results['test_recall']:.4f}"
    )
    print(
        f"Precision         : "
        f"{results['test_precision']:.4f}"
    )
    print(
        f"F1                : "
        f"{results['test_f1']:.4f}"
    )

    print("\nPattern-weighted sensitivity:")

    print(
        f"Average Precision : "
        f"{results['test_pattern_average_precision']:.4f}"
    )
    print(
        f"PR-AUC            : "
        f"{results['test_pattern_pr_auc']:.4f}"
    )
    print(
        f"F2                : "
        f"{results['test_pattern_f2']:.4f}"
    )

    print("\nConfusion matrix counts:")
    print(f"TN={tn}  FP={fp}")
    print(f"FN={fn}  TP={tp}")

    return results


def save_results(
    results: dict,
    output_path: str | Path,
) -> None:
    """Persist final test metrics."""
    path = Path(output_path)

    if not path.is_absolute():
        path = PROJECT_ROOT / path

    path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    with path.open(
        "w",
        encoding="utf-8",
    ) as file:
        yaml.safe_dump(
            results,
            file,
            sort_keys=False,
            allow_unicode=True,
        )

    print(f"\nResults saved to: {path}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate the selected model once on the fixed test set."
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
        "--save",
        required=False,
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    results = evaluate_test(
        experiment_path=args.experiment,
        threshold_path=args.threshold,
    )

    if args.save:
        save_results(
            results,
            args.save,
        )