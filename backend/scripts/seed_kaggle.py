import asyncio
import os
import sys
import pandas as pd
import kagglehub

# Ensure we can import 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import init_db
from app.models.case import Case
from app.models.evidence import Evidence

async def seed_data():
    print("Initializing Database...")
    await init_db()

    from app.models.user import User
    admin = await User.find_one({"role": "admin"})
    if not admin:
        print("No admin user found. Creating a default one...")
        admin = User(name="System Admin", email="admin@raw.intel", password_hash="dummy", role="admin")
        await admin.insert()

    print("Downloading dataset via kagglehub...")
    path = kagglehub.dataset_download("jimohyusuf/cybercrime-forensic-dataset")
    csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
    if not csv_files:
        print("No CSV files found in the dataset.")
        return

    csv_path = os.path.join(path, csv_files[0])
    print(f"Loading dataset from {csv_path}")
    df = pd.read_csv(csv_path)

    # Let's take the first 50 Suspicious rows to avoid overloading
    df_suspicious = df[df['Label'] == 'Suspicious'].head(50)

    count = 0
    for _, row in df_suspicious.iterrows():
        title = f"Anomaly Investigation: {row['Anomaly_Type']} (IP: {row['IP_Address']})"
        crime_type = str(row['Activity_Type'])
        
        case = Case(
            title=title,
            crime_type=crime_type,
            status="open",
            risk_score=85
        )
        await case.insert()
        
        evidence = Evidence(
            case_id=str(case.id),
            type="log",
            hash="kaggle_seed_hash",
            path="kaggle_dataset_row",
            timestamp=str(row['Timestamp']),
            ai_status="pending",
            ai_raw_text=str(row.to_dict()),
            uploaded_by=admin.id
        )
        await evidence.insert()
        count += 1

    print(f"Successfully seeded {count} cases from the Kaggle dataset!")

if __name__ == "__main__":
    asyncio.run(seed_data())
