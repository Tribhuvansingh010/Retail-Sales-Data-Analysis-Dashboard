import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CLEANED_DIR = os.path.join(BASE_DIR, "..", "data", "cleaned")

files = [
    os.path.join(CLEANED_DIR, "sales.csv"),
    os.path.join(CLEANED_DIR, "customers.csv"),
    os.path.join(CLEANED_DIR, "products.csv")
]

for f in files:
    print(f"{f} exists? {os.path.exists(f)}")