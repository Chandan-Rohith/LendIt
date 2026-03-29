import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
import yaml
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

ML_DIR = Path(__file__).resolve().parent
CONFIG_PATH = ML_DIR / "config.yaml"
DATA_PATH = ML_DIR / "data" / "feature_snapshot.csv"
MODEL_DIR = ML_DIR / "model"
MODEL_PATH = MODEL_DIR / "risk_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
META_PATH = MODEL_DIR / "model_meta.json"


def load_config() -> dict:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def main():
    config = load_config()
    features = config["features"]
    thresholds = config["thresholds"]
    model_version = config["model"]["version"]
    training_cfg = config.get("training", {})

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Feature snapshot not found at {DATA_PATH}. Run export_features.py first.")

    df = pd.read_csv(DATA_PATH)
    if df.empty:
        raise RuntimeError("feature_snapshot.csv is empty. Add review data and export again.")

    required_cols = set(features + ["label"])
    missing = required_cols - set(df.columns)
    if missing:
        raise RuntimeError(f"Missing required columns in dataset: {sorted(missing)}")

    model_df = df[features + ["label"]].dropna()
    if model_df["label"].nunique() < 2:
        raise RuntimeError("Training requires both classes (0 and 1) in label column.")

    x = model_df[features]
    y = model_df["label"].astype(int)

    test_size = float(training_cfg.get("test_size", 0.2))
    random_state = int(training_cfg.get("random_state", 42))

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )

    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)

    max_iter = int(training_cfg.get("max_iter", 1000))
    model = LogisticRegression(max_iter=max_iter)
    model.fit(x_train_scaled, y_train)

    y_pred = model.predict(x_test_scaled)
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
    }

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    meta = {
        "model_version": model_version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "algorithm": "logistic_regression",
        "features": features,
        "thresholds": thresholds,
        "label_rule": config["label_rule"],
        "training": 
        {
            "test_size": test_size,
            "random_state": random_state,
            "max_iter": max_iter,
            "rows_total": int(len(model_df)),
            "rows_train": int(len(x_train)),
            "rows_test": int(len(x_test)),
            "positive_rate": round(float(y.mean()), 4),
            "metrics": metrics,
        },
        "standardization": 
        {
            "mean": [round(float(v), 8) for v in scaler.mean_],
            "scale": [round(float(v), 8) for v in scaler.scale_],
        },
        "weights": 
        {
            "intercept": round(float(model.intercept_[0]), 12),
            "coefficients": [round(float(v), 12) for v in model.coef_[0]],
        },
    }

    with META_PATH.open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print("Training complete")
    print(f"Model: {MODEL_PATH}")
    print(f"Scaler: {SCALER_PATH}")
    print(f"Meta: {META_PATH}")
    print(f"Metrics: {metrics}")


if __name__ == "__main__":
    main()
