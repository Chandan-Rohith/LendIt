import random
import csv
from datetime import datetime

OUTPUT_FILE = "data/feature_snapshot.csv"
NUM_ROWS = 500

def generate_label(avg_rating, avg_damage, avg_experience):
    return int(
        avg_rating < 3.0 or
        avg_damage >= 2.0 or
        avg_experience >= 2.5
    )

rows = []

for i in range(NUM_ROWS):
    avg_rating = round(random.uniform(1.0, 5.0), 2)
    review_count = random.randint(1, 50)
    avg_damage = round(random.uniform(0.0, 3.0), 2)
    avg_experience = round(random.uniform(1.0, 3.0), 2)

    # Add noise
    avg_rating += round(random.uniform(-0.2, 0.2), 2)
    avg_damage += round(random.uniform(-0.2, 0.2), 2)
    avg_experience += round(random.uniform(-0.1, 0.1), 2)

    # Clamp values
    avg_rating = max(1.0, min(5.0, avg_rating))
    avg_damage = max(0.0, min(3.0, avg_damage))
    avg_experience = max(1.0, min(3.0, avg_experience))

    label = generate_label(avg_rating, avg_damage, avg_experience)

    rows.append([
        f"user_{i}",
        round(avg_rating, 2),
        review_count,
        round(avg_damage, 2),
        round(avg_experience, 2),
        label,
        datetime.utcnow().isoformat()
    ])

with open(OUTPUT_FILE, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        "user_id",
        "avg_rating",
        "review_count",
        "avg_damage",
        "avg_experience",
        "label",
        "created_at"
    ])
    writer.writerows(rows)

print("✅ Dataset generated successfully")