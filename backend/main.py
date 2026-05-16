from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
from typing import List, Optional
import io

import models, schemas
from database import engine, get_db
from routers.auth_router import router as auth_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockSense AI — Demand Forecasting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

CUSTOM_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "custom_dataset.csv")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "StockSense AI API is running"}

# ─────────────────────────────────────────────────────────
# DATA UPLOAD & MANAGEMENT
# ─────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8', errors='ignore')))
        
        # Intelligent Column Mapping
        col_map = {
            "date": ["date", "order date", "invoice date", "timestamp", "time", "day"],
            "product": ["product", "description", "sku", "item", "product name", "product_code"],
            "quantity": ["quantity", "units", "units sold", "qty", "amount"],
            "price": ["price", "unit price", "cost", "mrp"],
            "discount": ["discount", "disc", "reduction", "off"],
            "promotion": ["promotion", "promo", "deal", "ad", "campaign"],
            "weather": ["weather", "temp", "temperature", "condition"],
            "category": ["category", "sector", "class", "classification", "group", "type"]
        }
        
        final_cols = {}
        for target, aliases in col_map.items():
            for col in df.columns:
                if col.lower().strip() in aliases:
                    final_cols[target] = col
                    break
        
        required = ["date", "product", "quantity"]
        missing = [r for r in required if r not in final_cols]
        if missing:
            raise HTTPException(status_code=400, detail=f"Could not find columns for: {', '.join(missing)}. Please rename your columns to 'Date', 'Product', and 'Quantity'.")

        # Standardize
        df = df.rename(columns={final_cols[k]: k for k in final_cols})
        df["date"] = pd.to_datetime(df["date"])
        df["quantity"] = pd.to_numeric(df["quantity"], errors='coerce').fillna(0)
        
        # Optional: ensure category exists
        if "category" not in df.columns:
            df["category"] = "General"
            
        # Numeric Regressors
        for col in ["price", "discount", "promotion", "weather"]:
            if col in final_cols:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            elif col not in df.columns:
                df[col] = 10.0 if col == "price" else 0.0
            
        os.makedirs(os.path.dirname(CUSTOM_DATA_PATH), exist_ok=True)
        df.to_csv(CUSTOM_DATA_PATH, index=False)
        
        from services.data_service import clear_cache
        clear_cache()
        
        return {
            "message": "Dataset uploaded and mapped successfully",
            "rows": len(df),
            "columns_found": list(final_cols.values()),
            "start_date": str(df["date"].min().date()),
            "end_date": str(df["date"].max().date())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

@app.post("/api/upload-model")
async def upload_model(file: UploadFile = File(...)):
    filename = file.filename.lower()
    if not (filename.endswith('.json') or filename.endswith('.pkl')):
        raise HTTPException(status_code=400, detail="Only .json (Prophet) or .pkl (SARIMA) model files are allowed.")
    
    from services.ml_service_v2 import MODEL_DIR
    target_name = "prophet_model.json" if filename.endswith('.json') else "sarima_model.pkl"
    save_path = os.path.join(MODEL_DIR, target_name)
    
    contents = await file.read()
    with open(save_path, "wb") as f:
        f.write(contents)
    
    from services.data_service import clear_cache
    clear_cache()
    
    return {"message": f"Model {target_name} uploaded successfully and is now active."}

@app.delete("/api/custom-data")
def delete_custom_data():
    if os.path.exists(CUSTOM_DATA_PATH):
        os.remove(CUSTOM_DATA_PATH)
        from services.data_service import clear_cache
        clear_cache()
        return {"message": "Custom dataset removed. Reverting to UCI dataset."}
    return {"message": "No custom dataset found."}

@app.get("/api/custom-data-status")
def get_custom_data_status():
    if os.path.exists(CUSTOM_DATA_PATH):
        df = pd.read_csv(CUSTOM_DATA_PATH)
        return {
            "active": True,
            "rows": len(df),
            "filename": "custom_dataset.csv",
            "last_updated": str(datetime.fromtimestamp(os.path.getmtime(CUSTOM_DATA_PATH)))
        }
    return {"active": False}

# ─────────────────────────────────────────────────────────
# ML ENDPOINTS (Prioritize Custom Data)
# ─────────────────────────────────────────────────────────

@app.get("/api/trends")
def get_industry_trends(sector: str, business_type: str = "retail", periods: int = 12):
    from services.data_service import get_weekly_data, get_top_products
    from services.ml_service_v2 import get_comprehensive_analysis

    # ONE ML analysis for the sector — frontend handles per-product trending via productGenerator
    df = get_weekly_data(sector)
    analysis = get_comprehensive_analysis(df, sector, periods=periods)

    # Lightweight top products — just name + sales volume, NO per-product ML
    top_products_list = get_top_products(sector, top_n=5)
    top_products_simple = [
        {
            "name": p["name"],
            "total_sold": p["total_sold"],
            "analysis": {
                "prophet": {
                    "change_pct": analysis.get("prophet", {}).get("change_pct", 10),
                    "trend_direction": analysis.get("prophet", {}).get("trend_direction", "up"),
                    "trend_reason": analysis.get("prophet", {}).get("trend_reason", "")
                }
            }
        }
        for p in top_products_list
    ]

    return {
        "sector": sector,
        "business_type": business_type,
        "top_products": top_products_simple,
        "is_custom_data": os.path.exists(CUSTOM_DATA_PATH),
        **analysis,
    }


@app.get("/api/product-analysis")
def get_product_analysis(sector: str, product: str, periods: int = 12, freq: str = "W"):
    from services.data_service import get_weekly_data, get_top_products
    from services.ml_service_v2 import get_comprehensive_analysis

    if not product.strip():
        raise HTTPException(status_code=400, detail="product query cannot be empty")

    df = get_weekly_data(sector, product_query=product, freq=freq)
    analysis = get_comprehensive_analysis(df, sector, periods=periods, product_name=product, freq=freq)
    top_products = get_top_products(sector, product_query=product, top_n=5)

    return {
        "sector": sector,
        "product_query": product,
        "top_products": top_products,
        "is_custom_data": os.path.exists(CUSTOM_DATA_PATH),
        **analysis,
    }

@app.get("/api/forecast-summary")
def get_forecast_summary(sector: str):
    """Returns real KPIs: total volume, week-on-week growth, and data source info."""
    from services.data_service import get_weekly_data
    
    df = get_weekly_data(sector)
    if df.empty or len(df) < 2:
        return {"total_volume": 0, "wow_change_pct": 0, "is_custom_data": False}
    
    qty = df["quantity"]
    total_4w = int(qty.tail(4).sum())
    prev_4w = int(qty.iloc[-8:-4].sum()) if len(qty) >= 8 else int(qty.head(4).sum())
    wow_change = round(((total_4w - prev_4w) / max(prev_4w, 1)) * 100, 1)
    peak_week = qty.idxmax()
    
    return {
        "total_volume_4w": total_4w,
        "prev_volume_4w": prev_4w,
        "wow_change_pct": wow_change,
        "peak_week": str(peak_week.date()) if hasattr(peak_week, 'date') else str(peak_week),
        "peak_volume": int(qty.max()),
        "avg_weekly_volume": round(float(qty.mean()), 1),
        "data_points": len(qty),
        "is_custom_data": os.path.exists(CUSTOM_DATA_PATH),
    }

