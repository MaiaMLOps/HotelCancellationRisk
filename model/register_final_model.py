from pathlib import Path

import mlflow
import mlflow.sklearn
import yaml
from mlflow.tracking import MlflowClient

from model.experiment import (
    get_data_dvc_md5,
    get_git_branch,
    get_git_commit,
    load_experiment,
)
from model.pipeline import build_model_pipeline
from model.processing.split import (
    create_partitions,
    load_config,
    load_dataset,
)


REGISTERED_MODEL_NAME = "hotel-cancellation-random-forest"

EXPERIMENT_PATH = Path(
    "model/experiments/random_forest_tuned.yml"
)

THRESHOLD_PATH = Path(
    "model/thresholds/random_forest_tuned.yml"
)


def main():
    config = load_config()
    experiment = load_experiment(EXPERIMENT_PATH)

    with THRESHOLD_PATH.open(
        "r",
        encoding="utf-8",
    ) as file:
        threshold_config = yaml.safe_load(file)

    threshold = float(
        threshold_config["threshold"]
    )

    df = load_dataset(config)

    X, y, metadata = create_partitions(
        df,
        config,
    )

    development_mask = metadata[
        "partition"
    ].eq("development")

    X_dev = X.loc[development_mask]
    y_dev = y.loc[development_mask]

    print("=" * 70)
    print("FINAL MODEL REGISTRATION")
    print("=" * 70)
    print(f"Model family : {experiment['model']}")
    print(f"Development rows : {len(X_dev)}")
    print(f"Threshold : {threshold:.3f}")
    print(f"Registry name : {REGISTERED_MODEL_NAME}")
    print("=" * 70)

    pipeline = build_model_pipeline(
        model_name=experiment["model"],
        config=config,
        params_override=experiment["params"],
    )

    print(
        "\nTraining selected pipeline "
        "on complete development partition..."
    )

    pipeline.fit(
        X_dev,
        y_dev,
    )

    mlflow.set_experiment(
        config["mlflow"]["experiment_name"]
    )

    with mlflow.start_run(
        run_name="random_forest_registered_model"
    ) as run:

        mlflow.log_params(
            {
                "model_name": experiment["model"],
                "decision_threshold": threshold,
                **{
                    f"model_{key}": value
                    for key, value
                    in experiment["params"].items()
                },
            }
        )

        mlflow.set_tags(
            {
                "model_stage": "deployment_candidate",
                "threshold_source": "development_oof",
                "git_commit": get_git_commit(),
                "git_branch": get_git_branch(),
                "data_dvc_md5": get_data_dvc_md5(),
            }
        )

        model_info = mlflow.sklearn.log_model(
            sk_model=pipeline,
            name="model",
            registered_model_name=REGISTERED_MODEL_NAME,
            input_example=X_dev.head(5),
            code_paths=["model"],
            serialization_format=mlflow.sklearn.SERIALIZATION_FORMAT_CLOUDPICKLE,
        )

        client = MlflowClient()

        versions = client.search_model_versions(
            f"name='{REGISTERED_MODEL_NAME}'"
        )

        latest_version = max(
            versions,
            key=lambda item: int(item.version),
        )

        version = latest_version.version

        client.set_registered_model_alias(
            name=REGISTERED_MODEL_NAME,
            alias="champion",
            version=version,
        )

        print("\n" + "=" * 70)
        print("REGISTRATION COMPLETED")
        print("=" * 70)
        print(
            f"MODEL_NAME={REGISTERED_MODEL_NAME}"
        )
        print(
            f"MODEL_VERSION={version}"
        )
        print(
            f"THRESHOLD={threshold:.3f}"
        )
        print(
            f"RUN_ID={run.info.run_id}"
        )
        print(
            f"MODEL_URI={model_info.model_uri}"
        )


if __name__ == "__main__":
    main()