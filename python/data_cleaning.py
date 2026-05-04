def clean_data():
    import pandas as pd
    import os

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    RAW_DIR = os.path.join(BASE_DIR, "..", "data", "raw")
    CLEANED_DIR = os.path.join(BASE_DIR, "..", "data", "cleaned")

    os.makedirs(CLEANED_DIR, exist_ok=True)

    print("🧹 Cleaning raw CSV files...")

    for file in os.listdir(RAW_DIR):
        if file.lower().endswith(".csv"):
            raw_path = os.path.join(RAW_DIR, file)
            cleaned_path = os.path.join(CLEANED_DIR, file)

            try:
                print("Processing:", file)

                df = pd.read_csv(raw_path)

                df.columns = df.columns.str.strip().str.lower()
                df = df.drop_duplicates()
                df = df.dropna(how="all")

                df.to_csv(cleaned_path, index=False)

                print("✅ Cleaned:", file)

            except Exception as e:
                print("❌ Error:", e)


if __name__ == "__main__":
    clean_data()