import subprocess
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
#  run cleaning
    subprocess.run(
        [sys.executable, "data_cleaning.py"],
        cwd=BASE_DIR,
        check=True
    )
# run json conversion
    subprocess.run(
        [sys.executable, "csv_to_json.py"],
        cwd=BASE_DIR,
        check=True
    )

    print(" Pipeline executed successfully")

except Exception as e:
    print(" Pipeline error:", e)