"""
data_service.py — Memory-optimized for large custom datasets.
"""

import os
import pandas as pd
import numpy as np
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)

# Cache for the processed weekly aggregated data
_weekly_cache: Dict[str, pd.DataFrame] = {}

CUSTOM_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "custom_dataset.csv")

FESTIVE_SEASONS = [
    {"name": "New Year / Winter Clearance", "start_month": 1, "end_month": 1, "impact": "High"},
    {"name": "Valentine's Period", "start_month": 2, "end_month": 2, "impact": "Medium"},
    {"name": "Spring Collection", "start_month": 3, "end_month": 4, "impact": "Medium"},
    {"name": "Summer Surge", "start_month": 6, "end_month": 8, "impact": "Medium"},
    {"name": "Back to School", "start_month": 9, "end_month": 9, "impact": "High"},
    {"name": "Halloween / Autumn", "start_month": 10, "end_month": 10, "impact": "Medium"},
    {"name": "Black Friday / Pre-Christmas", "start_month": 11, "end_month": 11, "impact": "Extreme"},
    {"name": "Christmas / Boxing Day", "start_month": 12, "end_month": 12, "impact": "Extreme"},
]


def _apply_date_shift(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["date"])
    max_date = df["date"].max()
    target_end = datetime(2026, 5, 1)
    shift = target_end - max_date
    df["date"] = df["date"] + shift
    return df


def _get_synthetic_data(seed_text: str = "42", freq: str = "W") -> pd.DataFrame:
    """Return reproducible synthetic data seeded by product name so each product looks unique."""
    seed = int(hashlib.md5(seed_text.encode()).hexdigest(), 16) % (2**32)
    rng = np.random.default_rng(seed)

    periods = 104
    idx = pd.date_range(end="2026-05-01", periods=periods, freq=freq)
    t = np.linspace(0, 4 * np.pi, periods)
    base_level = rng.integers(200, 1000)
    amplitude = rng.integers(50, 200)
    seasonal = base_level + amplitude * np.sin(t) + (amplitude / 2) * np.sin(2 * t)
    noise = rng.integers(-amplitude // 4, amplitude // 4, periods)
    quantity = np.maximum(10, (seasonal + noise).astype(int))

    return pd.DataFrame({
        "quantity": quantity,
        "price": float(10.0 + rng.uniform(-2, 2)),
        "discount": 0.0,
        "promotion": 0.0,
        "weather": 0.0,
    }, index=idx)


def get_weekly_data(sector: str, product_query: str = "", freq: str = "W") -> pd.DataFrame:
    """Reads data and filters by sector/category. Supports 'W' (Weekly) or 'D' (Daily)."""
    cache_key = f"{sector}::{product_query.lower()}::{freq}"
    if cache_key in _weekly_cache:
        return _weekly_cache[cache_key]

    path = CUSTOM_DATA_PATH if os.path.exists(CUSTOM_DATA_PATH) else None

    if not path:
        result = _get_synthetic_data(seed_text=product_query or sector, freq=freq)
        _weekly_cache[cache_key] = result
        return result

    try:
        # Detect columns case-insensitively
        raw_cols = list(pd.read_csv(path, nrows=0).columns)
        usecols_map = {}
        required_cols = ["date", "product", "quantity"]
        optional_cols = ["price", "discount", "promotion", "weather", "category"]

        for orig_col in raw_cols:
            norm = orig_col.lower().strip()
            if norm in required_cols + optional_cols:
                usecols_map[orig_col] = norm

        usecols = list(usecols_map.keys())
        agg_freq = "W" if freq.upper() == "W" else "D"
        chunks = []

        for chunk in pd.read_csv(path, usecols=usecols, chunksize=100_000, low_memory=True):
            chunk = chunk.rename(columns=usecols_map)
            chunk["date"] = pd.to_datetime(chunk["date"], errors="coerce")
            chunk = chunk.dropna(subset=["date"])
            chunk["quantity"] = pd.to_numeric(chunk["quantity"], errors="coerce").fillna(0)

            # Sector/category filter
            if "category" in chunk.columns and sector.lower() not in ("all", ""):
                filtered = chunk[chunk["category"].astype(str).str.contains(sector, case=False, na=False)]
                if not filtered.empty:
                    chunk = filtered

            # Product filter
            if product_query:
                chunk = chunk[chunk["product"].astype(str).str.contains(product_query, case=False, na=False)]

            if chunk.empty:
                continue

            # Fill optional numeric columns
            for col in ["price", "discount", "promotion", "weather"]:
                if col not in chunk.columns:
                    chunk[col] = 10.0 if col == "price" else 0.0
                else:
                    chunk[col] = pd.to_numeric(chunk[col], errors="coerce").fillna(0)

            # Aggregate to requested frequency
            if agg_freq == "W":
                chunk["p_label"] = chunk["date"].dt.to_period("W").apply(lambda r: r.start_time)
            else:
                chunk["p_label"] = chunk["date"].dt.normalize()

            agg = chunk.groupby("p_label").agg({
                "quantity": "sum", "price": "mean", "discount": "mean",
                "promotion": "mean", "weather": "mean"
            })
            chunks.append(agg)

        if not chunks:
            logger.warning(f"No data found for sector='{sector}' product='{product_query}'. Using synthetic data.")
            result = _get_synthetic_data(seed_text=product_query or sector, freq=agg_freq)
            _weekly_cache[cache_key] = result
            return result

        final_agg = pd.concat(chunks).groupby(level=0).agg({
            "quantity": "sum", "price": "mean", "discount": "mean",
            "promotion": "mean", "weather": "mean"
        })

        final_agg = final_agg.reset_index().rename(columns={"p_label": "date"})
        final_agg = _apply_date_shift(final_agg)
        final_agg = final_agg.set_index("date")
        final_agg = final_agg.asfreq(agg_freq).ffill().fillna(0)

        _weekly_cache[cache_key] = final_agg
        return final_agg

    except Exception as e:
        logger.error(f"get_weekly_data error: {e}")
        result = _get_synthetic_data(seed_text=product_query or sector, freq=freq)
        _weekly_cache[cache_key] = result
        return result


def get_top_products(sector: str, product_query: str = "", top_n: int = 5) -> List[Dict]:
    """Memory-efficient top product discovery with sector filtering."""
    path = CUSTOM_DATA_PATH if os.path.exists(CUSTOM_DATA_PATH) else None
    if not path:
        return []

    counts: Dict[str, float] = {}
    try:
        raw_cols = list(pd.read_csv(path, nrows=0).columns)
        col_map = {c.lower().strip(): c for c in raw_cols}

        usecols = []
        rename_map = {}
        for target in ["product", "quantity", "category"]:
            if target in col_map:
                usecols.append(col_map[target])
                rename_map[col_map[target]] = target

        if not usecols:
            return []

        for chunk in pd.read_csv(path, usecols=usecols, chunksize=100_000, low_memory=True):
            chunk = chunk.rename(columns=rename_map)
            chunk["quantity"] = pd.to_numeric(chunk.get("quantity", 0), errors="coerce").fillna(0)

            if "category" in chunk.columns and sector.lower() not in ("all", ""):
                filtered = chunk[chunk["category"].astype(str).str.contains(sector, case=False, na=False)]
                if not filtered.empty:
                    chunk = filtered

            if product_query:
                chunk = chunk[chunk["product"].astype(str).str.contains(product_query, case=False, na=False)]

            if chunk.empty:
                continue

            agg = chunk.groupby("product")["quantity"].sum()
            for p, q in agg.items():
                counts[p] = counts.get(p, 0) + float(q)

        top = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [{"name": str(name).title(), "total_sold": int(qty)} for name, qty in top]
    except Exception as e:
        logger.error(f"get_top_products error: {e}")
        return []


def get_festive_analysis(series: pd.Series) -> List[Dict]:
    if len(series) < 12:
        return []
    monthly = series.groupby(series.index.month).mean()
    mean_val = monthly.mean()
    peaks = monthly[monthly > mean_val * 1.1].index.tolist()
    results = []
    for m in peaks:
        season = next((s for s in FESTIVE_SEASONS if s["start_month"] <= m <= s["end_month"]), None)
        if season:
            results.append({
                "month": m,
                "season_name": season["name"],
                "impact": season["impact"],
                "avg_increase_pct": round(((monthly[m] - mean_val) / max(mean_val, 1)) * 100, 1)
            })
    return results


def clear_cache():
    global _weekly_cache
    _weekly_cache = {}
    from services.ml_service_v2 import clear_model_cache
    clear_model_cache()
