from pathlib import Path

import numpy as np
import pandas as pd
import yaml
from sklearn.model_selection import StratifiedGroupKFold

PROJECT_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = PROJECT_ROOT / "model" / "config.yml"


def load_config() -> dict:
    """Load experiment configuration."""
    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def load_dataset(config: dict) -> pd.DataFrame:
    """Load the DVC-managed dataset."""
    data_path = PROJECT_ROOT / config["data"]["path"]
    return pd.read_csv(data_path)


def get_feature_columns(config: dict) -> list[str]:
    """Return the complete ordered list of predictor variables."""
    return config["features"]["categorical"] + config["features"]["numerical"]


def build_pattern_groups(
    X: pd.DataFrame,
    categorical_columns: list[str],
) -> pd.Series:
    """
    Assign the same group ID to observations with identical predictors.

    Categorical variables are normalized to string representation and missing
    values are represented explicitly before hashing.
    """
    normalized = X.copy()

    for column in categorical_columns:
        normalized[column] = normalized[column].astype("string").fillna("__MISSING__")

    groups = pd.util.hash_pandas_object(
        normalized,
        index=False,
    ).astype("uint64")

    # Defensive check against accidental hash collisions.
    n_unique_patterns = len(normalized.drop_duplicates())
    n_unique_hashes = groups.nunique()

    if n_unique_patterns != n_unique_hashes:
        raise RuntimeError("Hash collision detected while creating pattern groups.")

    return groups


def create_partitions(
    df: pd.DataFrame,
    config: dict,
) -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """
    Create:
      1. A fixed development/test partition.
      2. Five cross-validation folds inside development.

    Identical predictor patterns are never split across partitions or CV folds.
    """
    target = config["data"]["target"]
    feature_columns = get_feature_columns(config)
    categorical_columns = config["features"]["categorical"]
    split_config = config["split"]

    X = df[feature_columns].copy()
    y = df[target].astype(int).copy()

    groups = build_pattern_groups(
        X,
        categorical_columns,
    )

    # ------------------------------------------------------------------
    # 1. Fixed development/test split (~80/20)
    # ------------------------------------------------------------------
    outer_splitter = StratifiedGroupKFold(
        n_splits=split_config["test_n_folds"],
        shuffle=True,
        random_state=split_config["random_state"],
    )

    outer_fold = np.full(len(df), -1, dtype=np.int16)

    for fold, (_, holdout_idx) in enumerate(outer_splitter.split(X, y, groups)):
        outer_fold[holdout_idx] = fold

    if np.any(outer_fold == -1):
        raise RuntimeError("Some observations were not assigned to an outer fold.")

    test_fold = split_config["test_fold"]

    partition = np.where(
        outer_fold == test_fold,
        "test",
        "development",
    )

    # ------------------------------------------------------------------
    # 2. Cross-validation folds inside development only
    # ------------------------------------------------------------------
    development_mask = partition == "development"

    X_dev = X.loc[development_mask]
    y_dev = y.loc[development_mask]
    groups_dev = groups.loc[development_mask]

    cv_splitter = StratifiedGroupKFold(
        n_splits=split_config["cv_n_folds"],
        shuffle=True,
        random_state=split_config["random_state"],
    )

    cv_fold = np.full(len(df), -1, dtype=np.int16)

    development_indices = np.flatnonzero(development_mask)

    for fold, (_, validation_idx) in enumerate(
        cv_splitter.split(
            X_dev,
            y_dev,
            groups_dev,
        )
    ):
        original_idx = development_indices[validation_idx]
        cv_fold[original_idx] = fold

    # Test observations deliberately keep cv_fold = -1.
    if np.any(cv_fold[development_mask] == -1):
        raise RuntimeError(
            "Some development observations were not assigned to a CV fold."
        )

    # ------------------------------------------------------------------
    # 3. Pattern frequency and sensitivity-analysis weights
    # ------------------------------------------------------------------
    pattern_frequency = groups.map(groups.value_counts())

    metadata = pd.DataFrame(
        {
            "row_id": df.index,
            "group_id": groups,
            "outer_fold": outer_fold,
            "partition": partition,
            "cv_fold": cv_fold,
            "pattern_frequency": pattern_frequency,
            "pattern_weight": 1.0 / pattern_frequency,
        }
    )

    return X, y, metadata


def print_partition_summary(
    y: pd.Series,
    metadata: pd.DataFrame,
) -> None:
    """Print diagnostics for test partition and development CV folds."""

    print("\nPARTITION SUMMARY")

    for partition_name in ["development", "test"]:
        mask = metadata["partition"].eq(partition_name)

        group_sizes = metadata.loc[mask].groupby("group_id").size()

        print(
            f"{partition_name:12s} | "
            f"rows={mask.sum():6d} | "
            f"patterns={len(group_sizes):6d} | "
            f"cancel_rate={y.loc[mask].mean():.4f} | "
            f"avg_rows_pattern={group_sizes.mean():.3f} | "
            f"singletons={100 * group_sizes.eq(1).mean():.2f}% | "
            f"p95_group={group_sizes.quantile(0.95):.0f} | "
            f"max_group={group_sizes.max()}"
        )

    # Check group independence between development and test.
    development_groups = set(
        metadata.loc[
            metadata["partition"] == "development",
            "group_id",
        ]
    )

    test_groups = set(
        metadata.loc[
            metadata["partition"] == "test",
            "group_id",
        ]
    )

    overlap = development_groups & test_groups

    print(f"\nOverlapping groups between development and test: {len(overlap)}")

    if overlap:
        raise RuntimeError(
            "At least one predictor pattern appears in both development and test."
        )

    # Cross-validation diagnostics.
    print("\nCROSS-VALIDATION FOLDS")

    development_mask = metadata["partition"].eq("development")

    for fold in sorted(metadata.loc[development_mask, "cv_fold"].unique()):
        validation_mask = development_mask & metadata["cv_fold"].eq(fold)

        training_mask = development_mask & ~metadata["cv_fold"].eq(fold)

        validation_groups = set(
            metadata.loc[
                validation_mask,
                "group_id",
            ]
        )

        training_groups = set(
            metadata.loc[
                training_mask,
                "group_id",
            ]
        )

        fold_overlap = validation_groups & training_groups

        validation_group_sizes = (
            metadata.loc[validation_mask].groupby("group_id").size()
        )

        print(
            f"fold={fold} | "
            f"train_rows={training_mask.sum():6d} | "
            f"val_rows={validation_mask.sum():6d} | "
            f"val_patterns={len(validation_group_sizes):6d} | "
            f"val_cancel_rate={y.loc[validation_mask].mean():.4f} | "
            f"avg_rows_pattern={validation_group_sizes.mean():.3f} | "
            f"singletons={100 * validation_group_sizes.eq(1).mean():.2f}% | "
            f"p95_group={validation_group_sizes.quantile(0.95):.0f} | "
            f"max_group={validation_group_sizes.max()} | "
            f"group_overlap={len(fold_overlap)}"
        )

        if fold_overlap:
            raise RuntimeError(f"Group leakage detected in CV fold {fold}.")


if __name__ == "__main__":
    config = load_config()
    dataset = load_dataset(config)

    X, y, metadata = create_partitions(
        dataset,
        config,
    )

    print(f"Dataset rows: {len(dataset)}")
    print(f"Predictors: {X.shape[1]}")
    print(f"Unique predictor patterns: {metadata['group_id'].nunique()}")

    print_partition_summary(
        y,
        metadata,
    )
