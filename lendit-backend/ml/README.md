# LendIt ML (Minimal v1)

This folder contains the minimal machine learning scaffold for risk scoring.

## Step 1 Scope

- Shared model contract in `config.yaml`
- Python dependencies in `requirements.txt`
- Base folders for `data`, `model`, and `src`

## Shared Contract

Both Python training and Java prediction must use the same feature order from `config.yaml`:

1. `avg_rating`
2. `review_count`
3. `avg_damage`
4. `avg_experience`

Label and thresholds are also configured in `config.yaml` to avoid hardcoding.

## Next Step

Implement `export_features.py` (Step 2) to aggregate features from review data and build `feature_snapshot.csv`.

## Step 2: Export Feature Snapshot

Run from `lendit-backend/ml`:

```bash
pip install -r requirements.txt
python export_features.py
```

Output:

- `data/feature_snapshot.csv`

Notes:

- The script reads feature order and label thresholds from `config.yaml`.
- If `damage_score` / `experience_score` are not yet present in historical rows, the script uses backward-compatible defaults.
- You can override DB connection with `LENDIT_ML_DB_URL`.

## Step 3: Train and Infer

### Train

```bash
python train.py
```

Artifacts created in `model/`:

- `risk_model.pkl`
- `scaler.pkl`
- `model_meta.json`

### Infer (sample)

```bash
python infer.py --avg_rating 4.1 --review_count 12 --avg_damage 0.3 --avg_experience 1.2
```

Output contains:

- risk probability
- risk score (0-100)
- risk classification (LOW/MEDIUM/HIGH)
