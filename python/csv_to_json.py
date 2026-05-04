import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CLEANED_DIR = os.path.join(BASE_DIR, "..", "data", "cleaned")
FRONTEND_DATA = os.path.join(BASE_DIR, "..", "frontend", "data")

# Ensure folders exist
os.makedirs(CLEANED_DIR, exist_ok=True)
os.makedirs(FRONTEND_DATA, exist_ok=True)

print(" Converting cleaned CSV to JSON...")

if not os.listdir(CLEANED_DIR):
    print(" No files found in cleaned folder")
else:
    for file in os.listdir(CLEANED_DIR):
        if file.lower().endswith(".csv"):
            try:
                csv_path = os.path.join(CLEANED_DIR, file)

                name = file.lower()

                if "sales" in name:
                    json_name = "sales.json"
                elif "customer" in name:
                    json_name = "customers.json"
                elif "product" in name:
                    json_name = "products.json"
                else:
                    print(f" Skipping unknown file: {file}")
                    continue  

                json_path = os.path.join(FRONTEND_DATA, json_name)

                df = pd.read_csv(csv_path)
                df.to_json(json_path, orient="records", indent=4)

                print(f"✅ Updated {json_name}")

            except Exception as e:
                print(f" Error processing {file}: {e}")