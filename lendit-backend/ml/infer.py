import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import yaml

ML_DIR = Path(__file__).resolve().parent
CONFIG_PATH = ML_DIR / "config.yaml"
MODEL_PATH = ML_DIR / "model" / "risk_model.pkl"
SCALER_PATH = ML_DIR / "model" / "scaler.pkl"
META_PATH = ML_DIR / "model" / "model_meta.json"


def load_config() -> dict:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def classify(score: int, low_threshold: int, medium_threshold: int) -> str:
    if score <= low_threshold:
        return "LOW"
    if score <= medium_threshold:
        return "MEDIUM"
    return "HIGH"


def predict(features_input: dict) -> dict:
    config = load_config()
    features = config["features"]
    thresholds = config["thresholds"]

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    vector = np.array([[float(features_input[f]) for f in features]])
    vector_scaled = scaler.transform(vector)
    probability = float(model.predict_proba(vector_scaled)[0][1])

    risk_score = int(round(100 * probability))
    risk_class = classify(risk_score, int(thresholds["low"]), int(thresholds["medium"]))

    return {
        "probability": round(probability, 6),
        "risk_score": risk_score,
        "risk_classification": risk_class,
    }


def main():
    parser = argparse.ArgumentParser(description="Run risk score inference")
    parser.add_argument("--avg_rating", type=float, required=True)
    parser.add_argument("--review_count", type=float, required=True)
    parser.add_argument("--avg_damage", type=float, required=True)
    parser.add_argument("--avg_experience", type=float, required=True)
    args = parser.parse_args()

    features_input = {
        "avg_rating": args.avg_rating,
        "review_count": args.review_count,
        "avg_damage": args.avg_damage,
        "avg_experience": args.avg_experience,
    }

    result = predict(features_input)

    output ={
        "input": features_input,
        "output": result,
    }

    if META_PATH.exists():
        output["model_meta"] = json.loads(META_PATH.read_text(encoding="utf-8"))

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
