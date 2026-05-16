"""
train_models.py
===============
Full training pipeline for StockSense AI.

What this does:
  1. Loads custom_dataset.csv (4.7M rows)
  2. Aggregates hourly → weekly per product
  3. Engineers demand-driver features (price, discount, promo, weather)
  4. Trains Prophet (with regressors) + SARIMA per product
  5. Runs pattern analysis: what conditions drove demand UP vs DOWN
  6. Saves models + pattern report to backend/models/
  7. Generates stock overflow/underflow risk signals

Run: python train_models.py
"""

import os, sys, json, warnings, hashlib
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
from prophet import Prophet
from prophet.serialize import model_to_json
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import logging

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger(__name__)

# ─── PATHS ───────────────────────────────────────────────────────────────────
BASE       = os.path.dirname(__file__)
DATA_PATH  = os.path.join(BASE, "data", "custom_dataset.csv")
MODEL_DIR  = os.path.join(BASE, "models")
os.makedirs(MODEL_DIR, exist_ok=True)

FORECAST_WEEKS = 26   # 6-month forward forecast
SAFETY_STOCK_Z = 1.65 # 95% service level


# ─── STEP 1: LOAD & AGGREGATE ─────────────────────────────────────────────────
def load_and_aggregate():
    log.info("Loading dataset (chunked to avoid memory issues)...")
    raw_cols = list(pd.read_csv(DATA_PATH, nrows=0).columns)
    col_map  = {c.lower().strip(): c for c in raw_cols}

    # Map actual col names → standard names
    rename = {}
    for std in ["date", "product", "quantity", "price", "discount", "promotion", "weather"]:
        if std in col_map:
            rename[col_map[std]] = std

    chunks_by_product = {}
    chunk_size = 500_000
    total = 0

    for chunk in pd.read_csv(DATA_PATH, usecols=list(rename.keys()),
                              chunksize=chunk_size, low_memory=True):
        chunk = chunk.rename(columns=rename)
        chunk["date"]     = pd.to_datetime(chunk["date"], errors="coerce")
        chunk             = chunk.dropna(subset=["date"])
        chunk["quantity"] = pd.to_numeric(chunk["quantity"], errors="coerce").fillna(0)
        chunk["price"]    = pd.to_numeric(chunk.get("price", 0), errors="coerce").fillna(0)
        chunk["discount"] = pd.to_numeric(chunk.get("discount", 0), errors="coerce").fillna(0)
        chunk["promotion"]= pd.to_numeric(chunk.get("promotion", 0), errors="coerce").fillna(0)
        chunk["weather"]  = pd.to_numeric(chunk.get("weather", 0), errors="coerce").fillna(0)

        # Keep only the main product (GENERAL) + filter out numeric artifact rows
        chunk = chunk[chunk["product"].astype(str).str.upper() == "GENERAL"]

        chunk["week"] = chunk["date"].dt.to_period("W").apply(lambda r: r.start_time)
        agg = chunk.groupby("week").agg(
            quantity  = ("quantity",  "sum"),
            price     = ("price",     "mean"),
            discount  = ("discount",  "mean"),
            promotion = ("promotion", "mean"),
            weather   = ("weather",   "mean"),
        )
        if "GENERAL" not in chunks_by_product:
            chunks_by_product["GENERAL"] = []
        chunks_by_product["GENERAL"].append(agg)
        total += len(chunk)

    log.info(f"Processed {total:,} rows")

    product_dfs = {}
    for prod, chunks in chunks_by_product.items():
        df = pd.concat(chunks)
        df = df.groupby(level=0).agg(
            quantity  = ("quantity",  "sum"),
            price     = ("price",     "mean"),
            discount  = ("discount",  "mean"),
            promotion = ("promotion", "mean"),
            weather   = ("weather",   "mean"),
        )
        df = df.asfreq("W").ffill().fillna(0)
        product_dfs[prod] = df
        log.info(f"  Product '{prod}': {len(df)} weekly rows  |  "
                 f"qty range [{df['quantity'].min():.0f} – {df['quantity'].max():.0f}]")

    return product_dfs


# ─── STEP 2: PATTERN ANALYSIS ────────────────────────────────────────────────
def analyse_demand_drivers(df: pd.DataFrame, product: str) -> dict:
    """
    Identify what conditions push demand UP or DOWN.
    Returns a dict with correlation insights + threshold boundaries.
    """
    d = df.copy()
    d["qty_change"] = d["quantity"].pct_change().fillna(0)
    d["demand_up"]  = (d["qty_change"] > 0.05).astype(int)   # >5% week-on-week rise
    d["demand_down"]= (d["qty_change"] < -0.05).astype(int)  # >5% week-on-week drop

    features = ["price", "discount", "promotion", "weather"]
    insights = {}

    for feat in features:
        if d[feat].std() < 0.001:
            insights[feat] = {"correlation": 0.0, "driver": "no_signal",
                              "up_avg": float(d[feat].mean()), "down_avg": float(d[feat].mean())}
            continue

        corr = d[feat].corr(d["quantity"])
        up_avg   = float(d.loc[d["demand_up"] == 1, feat].mean())
        down_avg = float(d.loc[d["demand_down"] == 1, feat].mean())

        if abs(corr) < 0.05:
            driver = "weak"
        elif corr > 0:
            driver = "positive"   # higher value → more demand
        else:
            driver = "negative"   # higher value → less demand

        insights[feat] = {
            "correlation": round(float(corr), 4),
            "driver": driver,
            "up_avg":   round(up_avg,   2) if not np.isnan(up_avg)   else 0,
            "down_avg": round(down_avg, 2) if not np.isnan(down_avg) else 0,
            "interpretation": _interpret(feat, driver, corr, up_avg, down_avg),
        }

    # Seasonal pattern: which weeks/months are peaks?
    d.index = pd.to_datetime(d.index)
    monthly = d.groupby(d.index.month)["quantity"].mean()
    peak_month   = int(monthly.idxmax())
    trough_month = int(monthly.idxmin())

    MONTHS = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",
              7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"}

    return {
        "product":      product,
        "drivers":      insights,
        "peak_month":   MONTHS[peak_month],
        "trough_month": MONTHS[trough_month],
        "peak_qty_avg": round(float(monthly.max()), 1),
        "trough_qty_avg": round(float(monthly.min()), 1),
        "seasonality_strength": round(float((monthly.max() - monthly.min()) / max(monthly.mean(), 1) * 100), 1),
    }


def _interpret(feat, driver, corr, up_avg, down_avg):
    if feat == "price":
        if driver == "negative":
            return f"Higher prices suppress demand (corr={corr:.2f}). Demand rises when price ≈ {up_avg:.1f} and drops when price ≈ {down_avg:.1f}."
        elif driver == "positive":
            return f"Price and demand move together (corr={corr:.2f}) — premium product effect."
        return "Price has minimal impact on demand."
    if feat == "discount":
        if driver == "positive":
            return f"Discounts boost demand (corr={corr:.2f}). Demand spikes at discount ≈ {up_avg:.0f}%."
        return f"Discounts have limited impact (corr={corr:.2f})."
    if feat == "promotion":
        if driver == "positive":
            return "Active promotions drive significant demand uplift."
        return "Promotions show weak demand correlation."
    if feat == "weather":
        if driver == "positive":
            return "Demand increases during favorable weather conditions."
        elif driver == "negative":
            return "Adverse weather conditions suppress demand."
        return "Weather has minimal impact on demand."
    return ""


# ─── STEP 3: TRAIN PROPHET ───────────────────────────────────────────────────
def train_prophet(df: pd.DataFrame, product: str):
    log.info(f"  [Prophet] Training on {len(df)} weeks of data...")
    p_df = df.reset_index().rename(columns={"index": "ds", "week": "ds", "quantity": "y"})
    if "ds" not in p_df.columns:
        p_df = p_df.rename(columns={p_df.columns[0]: "ds"})

    p_df["ds"] = pd.to_datetime(p_df["ds"])
    p_df = p_df.sort_values("ds").dropna(subset=["y"])

    # Active regressors (only include if they have variance)
    regressors = []
    for reg in ["price", "discount", "promotion", "weather"]:
        if reg in p_df.columns and p_df[reg].std() > 0.001:
            regressors.append(reg)

    m = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode="multiplicative",
        changepoint_prior_scale=0.15,       # sensitive to trend changes
        seasonality_prior_scale=12.0,        # strong seasonality
        uncertainty_samples=200,             # confidence intervals
    )

    for reg in regressors:
        m.add_regressor(reg, standardize=True)

    log.info(f"  [Prophet] Active regressors: {regressors}")
    m.fit(p_df)

    # Build future frame (26 weeks ahead)
    future = m.make_future_dataframe(periods=FORECAST_WEEKS, freq="W")
    for reg in regressors:
        # Project future regressors using last 12-week rolling mean
        future[reg] = df[reg].tail(12).mean()

    forecast = m.predict(future)

    # Save model
    safe_name = product.replace(" ", "_").replace("/", "-")
    model_path = os.path.join(MODEL_DIR, f"prophet_{safe_name}.json")
    with open(model_path, "w") as f:
        f.write(model_to_json(m))
    log.info(f"  [Prophet] Saved → {model_path}")

    return m, forecast, regressors


# ─── STEP 4: TRAIN SARIMA ────────────────────────────────────────────────────
def train_sarima(series: pd.Series, product: str):
    log.info(f"  [SARIMA]  Training on {len(series)} weeks of data...")
    train = series.tail(104)  # use last 2 years

    # Order: (p,d,q)(P,D,Q,S)  — weekly data, annual seasonality = 52
    model = SARIMAX(train,
                    order=(1, 1, 1),
                    seasonal_order=(1, 1, 0, 52),
                    enforce_stationarity=False,
                    enforce_invertibility=False)
    fit = model.fit(disp=False, maxiter=200)

    safe_name = product.replace(" ", "_").replace("/", "-")
    model_path = os.path.join(MODEL_DIR, f"sarima_{safe_name}.pkl")
    joblib.dump(fit, model_path)
    log.info(f"  [SARIMA]  Saved → {model_path}")

    return fit


# ─── STEP 5: STOCK RISK ANALYSIS ─────────────────────────────────────────────
def compute_stock_signals(df: pd.DataFrame, forecast: pd.DataFrame,
                          pattern: dict, product: str) -> dict:
    """
    Compute overflow / underflow signals for the next 26 weeks.
    """
    qty = df["quantity"]
    mu  = float(qty.mean())
    sigma = float(qty.std())

    # Safety stock: Z * sigma (95% service level)
    safety_stock = SAFETY_STOCK_Z * sigma

    # Future predictions
    future_rows = forecast[forecast["ds"] > df.index.max()].copy()
    future_rows["yhat"] = future_rows["yhat"].clip(lower=0)

    alerts = []
    for _, row in future_rows.iterrows():
        predicted = row["yhat"]
        upper     = row.get("yhat_upper", predicted * 1.2)
        lower     = row.get("yhat_lower", predicted * 0.8)

        # Overflow: predicted demand << mean (stock will pile up)
        if predicted < mu - 1.5 * sigma:
            alerts.append({
                "week":  str(row["ds"].date()),
                "type":  "OVERFLOW_RISK",
                "predicted": round(float(predicted), 0),
                "threshold": round(float(mu - 1.5 * sigma), 0),
                "action": "Reduce reorder quantity. Risk of excess inventory.",
                "severity": "HIGH" if predicted < mu - 2 * sigma else "MEDIUM",
            })
        # Underflow: predicted demand >> mean (stock will run out)
        elif predicted > mu + 1.5 * sigma:
            alerts.append({
                "week":  str(row["ds"].date()),
                "type":  "UNDERFLOW_RISK",
                "predicted": round(float(predicted), 0),
                "threshold": round(float(mu + 1.5 * sigma), 0),
                "action": "Increase safety stock now. Risk of stockout.",
                "severity": "HIGH" if predicted > mu + 2 * sigma else "MEDIUM",
            })

    # Overall risk summary
    overflow_weeks  = sum(1 for a in alerts if a["type"] == "OVERFLOW_RISK")
    underflow_weeks = sum(1 for a in alerts if a["type"] == "UNDERFLOW_RISK")
    total_predicted = float(future_rows["yhat"].sum())

    return {
        "product":            product,
        "baseline_weekly_avg": round(mu, 1),
        "baseline_std":        round(sigma, 1),
        "safety_stock_units":  round(safety_stock, 0),
        "reorder_point":       round(mu + safety_stock, 0),
        "forecast_total_6m":   round(total_predicted, 0),
        "overflow_weeks":      overflow_weeks,
        "underflow_weeks":     underflow_weeks,
        "overall_risk":        "HIGH" if underflow_weeks > 4 or overflow_weeks > 4
                               else "MEDIUM" if underflow_weeks > 1 or overflow_weeks > 1
                               else "LOW",
        "alerts":              alerts[:10],  # top 10 alerts
        "forecast_weekly": [
            {
                "week": str(r["ds"].date()),
                "predicted": round(float(r["yhat"]), 0),
                "lower":     round(float(r.get("yhat_lower", r["yhat"] * 0.85)), 0),
                "upper":     round(float(r.get("yhat_upper", r["yhat"] * 1.15)), 0),
            }
            for _, r in future_rows.iterrows()
        ],
    }


# ─── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    log.info("=" * 60)
    log.info("  StockSense AI — Full Model Training Pipeline")
    log.info("=" * 60)

    # Step 1: Load data
    product_dfs = load_and_aggregate()
    if not product_dfs:
        log.error("No product data found. Aborting.")
        sys.exit(1)

    all_patterns = {}
    all_stock_signals = {}

    for product, df in product_dfs.items():
        log.info(f"\n{'─'*50}")
        log.info(f"  Training: {product}  ({len(df)} weekly rows)")
        log.info(f"{'─'*50}")

        if len(df) < 20:
            log.warning(f"  Skipping {product} — insufficient data (<20 weeks).")
            continue

        # Step 2: Pattern analysis
        log.info("  Analysing demand drivers...")
        pattern = analyse_demand_drivers(df, product)
        all_patterns[product] = pattern

        log.info(f"  → Peak month: {pattern['peak_month']}, "
                 f"Trough: {pattern['trough_month']}, "
                 f"Seasonality strength: {pattern['seasonality_strength']}%")
        for feat, info in pattern["drivers"].items():
            log.info(f"     {feat:12s}: {info.get('interpretation', 'N/A')}")

        # Step 3: Train Prophet
        try:
            prophet_model, forecast, active_regs = train_prophet(df, product)

            # Step 5: Stock signals
            signals = compute_stock_signals(df, forecast, pattern, product)
            all_stock_signals[product] = signals
            log.info(f"  Stock risk: {signals['overall_risk']} | "
                     f"Underflow weeks: {signals['underflow_weeks']} | "
                     f"Overflow weeks: {signals['overflow_weeks']}")
        except Exception as e:
            log.error(f"  Prophet training failed: {e}")

        # Step 4: Train SARIMA
        try:
            train_sarima(df["quantity"], product)
        except Exception as e:
            log.error(f"  SARIMA training failed: {e}")

    # Save pattern analysis + stock signals as JSON (used by API)
    patterns_path = os.path.join(MODEL_DIR, "demand_patterns.json")
    with open(patterns_path, "w") as f:
        json.dump(all_patterns, f, indent=2, default=str)
    log.info(f"\nDemand patterns saved → {patterns_path}")

    signals_path = os.path.join(MODEL_DIR, "stock_signals.json")
    with open(signals_path, "w") as f:
        json.dump(all_stock_signals, f, indent=2, default=str)
    log.info(f"Stock signals saved → {signals_path}")

    log.info("\n" + "=" * 60)
    log.info("  ✅  Training complete!")
    log.info("  Models saved to: backend/models/")
    log.info("  Files:")
    for fname in os.listdir(MODEL_DIR):
        fpath = os.path.join(MODEL_DIR, fname)
        fsize = os.path.getsize(fpath) / 1024
        log.info(f"    {fname:40s}  {fsize:8.1f} KB")
    log.info("=" * 60)


if __name__ == "__main__":
    main()
