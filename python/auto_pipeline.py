import subprocess
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def run_pipeline():
    try:
        # Run data cleaning
        result1 = subprocess.run(
            [sys.executable, "data_cleaning.py"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True
        )

        print("🔹 Data Cleaning Output:\n", result1.stdout)
        print("🔹 Data Cleaning Error:\n", result1.stderr)

        # Run CSV to JSON
        result2 = subprocess.run(
            [sys.executable, "csv_to_json.py"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True
        )

        print("🔹 JSON Output:\n", result2.stdout)
        print("🔹 JSON Error:\n", result2.stderr)

        print(" Pipeline completed successfully")

    except Exception as e:
        print(" Pipeline error:", e)


if __name__ == "__main__":
    run_pipeline()