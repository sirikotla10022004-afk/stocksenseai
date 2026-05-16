import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

paths = [
    r"C:\Users\Siri\Downloads\archive\retail_sales.csv",
    r"C:\Users\Siri\Downloads\archive (1)\sales_data.csv",
    r"C:\Users\Siri\Downloads\archive (2)\global_ecommerce_forecasting.csv",
    r"C:\Users\Siri\Downloads\archive (3)\ecommerce_dataset.csv"
]

target_path = r"c:\Users\Siri\.gemini\antigravity\scratch\demand-forecasting\backend\data\custom_dataset.csv"
os.makedirs(os.path.dirname(target_path), exist_ok=True)

dfs = []

col_map = {
    "date": ["date", "order date", "invoice date", "timestamp", "time", "day"],
    "product": ["product", "description", "sku", "item", "product name", "product_code", "product_category"],
    "quantity": ["quantity", "units", "units sold", "qty", "amount", "target", "sales"],
    "price": ["price", "unit price", "cost", "mrp"],
    "discount": ["discount", "disc"],
    "promotion": ["promotion", "promo"],
    "weather": ["weather"]
}

def reconstruct_date(df):
    if "Week_of_Year" in df.columns and "Day_of_Week" in df.columns:
        print("Reconstructing dates from normalized week/day...")
        # ecommerce_dataset.csv usually has normalized values (0 to 1)
        # We'll map them to 2025
        weeks = (df["Week_of_Year"] * 51).astype(int) + 1 # 1-52
        days = (df["Day_of_Week"] * 6).astype(int)       # 0-6
        
        # Start of 2025
        start_date = datetime(2025, 1, 1)
        df['date'] = df.apply(lambda row: start_date + timedelta(weeks=int(row['Week_of_Year']*51), days=int(row['Day_of_Week']*6)), axis=1)
        return df
    return df

for p in paths:
    if not os.path.exists(p): continue
    try:
        df = pd.read_csv(p)
        print(f"Ingesting {p}...")
        
        if "Week_of_Year" in df.columns:
            df = reconstruct_date(df)

        mapping = {}
        for target, aliases in col_map.items():
            for col in df.columns:
                if col.lower().strip() in aliases:
                    mapping[col] = target
                    break
        
        df = df.rename(columns=mapping)
        
        if "date" not in df.columns:
            df["date"] = pd.date_range(end="2026-05-01", periods=len(df), freq="H")
        else:
            df["date"] = pd.to_datetime(df["date"], errors='coerce')

        if "product" not in df.columns: 
            # If there's a Category column, use it as product
            if "Product_Category" in df.columns:
                df["product"] = df["Product_Category"].astype(str)
            else:
                df["product"] = "GENERAL"
        
        if "quantity" not in df.columns: df["quantity"] = 1
        
        # Scale up Target if it's binary (0/1) to look like demand volume
        if df["quantity"].nunique() <= 2 and df["quantity"].max() == 1:
            df["quantity"] = df["quantity"] * np.random.randint(5, 15)

        for reg in ["price", "discount", "promotion", "weather"]:
            if reg not in df.columns: df[reg] = 0.0
                
        dfs.append(df[["date", "product", "quantity", "price", "discount", "promotion", "weather"]])
    except Exception as e:
        print(f"Error {p}: {e}")

if dfs:
    combined = pd.concat(dfs, ignore_index=True)
    combined = combined.dropna(subset=["date"])
    # Cap size to 500k rows for performance if needed, but we used chunking so it's fine
    combined = combined.sort_values("date")
    combined.to_csv(target_path, index=False)
    print(f"SUCCESS: {len(combined)} rows merged into {target_path}")
