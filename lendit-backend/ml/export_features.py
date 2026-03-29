import os
import re
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import yaml
from sqlalchemy import create_engine, text

ML_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ML_DIR.parent
APP_PROPS = BACKEND_DIR / "src" / "main" / "resources" / "application.properties"
CONFIG_PATH = ML_DIR / "config.yaml"
OUTPUT_PATH = ML_DIR / "data" / "feature_snapshot.csv"


def read_properties(path: Path) -> dict:
    props = {}
    if not path.exists():
        return props

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        props[key.strip()] = value.strip()
    return props


def parse_jdbc_mysql_url(jdbc_url: str):
    pattern = r"^jdbc:mysql://([^:/?#]+)(?::(\d+))?/([^?]+)(?:\?.*)?$"
    match = re.match(pattern, jdbc_url)
    if not match:
        raise ValueError("Unsupported JDBC URL format. Set LENDIT_ML_DB_URL explicitly.")

    host = match.group(1)
    port = match.group(2) or "3306"
    database = match.group(3)
    return host, port, database


def get_sqlalchemy_url() -> str:
    env_url = os.getenv("LENDIT_ML_DB_URL")
    if env_url:
        return env_url

    props = read_properties(APP_PROPS)
    jdbc_url = props.get("spring.datasource.url")
    username = props.get("spring.datasource.username")
    password = props.get("spring.datasource.password")

    if not jdbc_url or not username:
        raise RuntimeError(
            "Datasource details not found. Add spring.datasource.* in application.properties "
            "or set LENDIT_ML_DB_URL environment variable."
        )

    host, port, database = parse_jdbc_mysql_url(jdbc_url)
    return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}"


def load_config() -> dict:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def detect_review_columns(engine) -> set:
    sql = text(
        """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'reviews'
        """
    )
    with engine.connect() as conn:
        rows = conn.execute(sql).fetchall()
    return {row[0] for row in rows}


def export_snapshot():
    config = load_config()
    feature_order = config["features"]
    label_rule = config["label_rule"]

    db_url = get_sqlalchemy_url()
    engine = create_engine(db_url)

    available_cols = detect_review_columns(engine)
    required = {"reviewee_id", "rating"}
    if not required.issubset(available_cols):
        raise RuntimeError(
            "reviews table is missing required columns: reviewee_id and rating. "
            f"Found columns: {sorted(available_cols)}"
        )

    selected_cols = ["reviewee_id", "rating"]
    if "damage_score" in available_cols:
        selected_cols.append("damage_score")
    if "damage_report" in available_cols:
        selected_cols.append("damage_report")
    if "experience_score" in available_cols:
        selected_cols.append("experience_score")

    query = f"SELECT {', '.join(selected_cols)} FROM reviews"
    reviews = pd.read_sql(query, engine)

    if reviews.empty:
        snapshot = pd.DataFrame(columns=["user_id", *feature_order, "label", "created_at"])
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        snapshot.to_csv(OUTPUT_PATH, index=False)
        print(f"No reviews found. Created empty snapshot at: {OUTPUT_PATH}")
        return

    reviews["rating"] = pd.to_numeric(reviews["rating"], errors="coerce")

    if "damage_score" in reviews.columns:
        reviews["damage_component"] = pd.to_numeric(reviews["damage_score"], errors="coerce").fillna(0.0)
    elif "damage_report" in reviews.columns:
        # Backward compatible mapping from boolean damage flag to 0-3 scale.
        reviews["damage_component"] = reviews["damage_report"].fillna(False).astype(bool).astype(int) * 3.0
    else:
        reviews["damage_component"] = 0.0

    if "experience_score" in reviews.columns:
        reviews["experience_component"] = pd.to_numeric(reviews["experience_score"], errors="coerce").fillna(1.0)
    else:
        # Default to smooth when historical data does not yet include experience score.
        reviews["experience_component"] = 1.0

    grouped = (
        reviews.groupby("reviewee_id", as_index=False)
        .agg(
            avg_rating=("rating", "mean"),
            review_count=("rating", "count"),
            avg_damage=("damage_component", "mean"),
            avg_experience=("experience_component", "mean"),
        )
        .rename(columns={"reviewee_id": "user_id"})
    )

    grouped["label"] = (
        (grouped["avg_rating"] < float(label_rule["avg_rating_threshold"]))
        | (grouped["avg_damage"] >= float(label_rule["avg_damage_threshold"]))
        | (grouped["avg_experience"] >= float(label_rule["avg_experience_threshold"]))
    ).astype(int)

    grouped["created_at"] = datetime.now(timezone.utc).isoformat()

    # Keep consistent schema for training and Java integration.
    snapshot = grouped[["user_id", *feature_order, "label", "created_at"]].copy()
    snapshot["avg_rating"] = snapshot["avg_rating"].round(4)
    snapshot["avg_damage"] = snapshot["avg_damage"].round(4)
    snapshot["avg_experience"] = snapshot["avg_experience"].round(4)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    snapshot.to_csv(OUTPUT_PATH, index=False)

    print(f"Exported {len(snapshot)} rows to {OUTPUT_PATH}")
    print("Columns:", ", ".join(snapshot.columns))


if __name__ == "__main__":
    export_snapshot()
