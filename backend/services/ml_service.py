import pandas as pd
from datetime import timedelta
import logging
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
try:
    from prophet import Prophet
except ImportError:
    Prophet = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def preprocess_sales_data(sales_data):
    """
    sales_data: list of dicts with 'date' and 'quantity'
    """
    if not sales_data:
        return pd.DataFrame()
    df = pd.DataFrame(sales_data)
    df['date'] = pd.to_datetime(df['date'])
    # Aggregate daily
    df = df.groupby('date').sum().reset_index()
    # Sort
    df = df.sort_values('date')
    return df

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error

def calculate_metrics(y_true, y_pred):
    if len(y_true) == 0 or len(y_pred) == 0:
        return {"rmse": 0.0, "mae": 0.0}
    
    # Handle NaN/inf which might occur in some fits
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    if not np.any(mask):
        return {"rmse": 0.0, "mae": 0.0}
        
    y_true_clean = y_true[mask]
    y_pred_clean = y_pred[mask]
    
    mae = mean_absolute_error(y_true_clean, y_pred_clean)
    rmse = np.sqrt(mean_squared_error(y_true_clean, y_pred_clean))
    return {"rmse": float(rmse), "mae": float(mae)}

def generate_forecast(df, periods=7, model_type='ARIMA'):
    """
    df: DataFrame with 'date' and 'quantity'
    Returns: {"predictions": [...], "metrics": {"rmse": float, "mae": float}}
    """
    if df.empty or len(df) < 3:
        if len(df) > 0:
            avg = df['quantity'].mean()
        else:
            avg = 0
        last_date = df['date'].max() if not df.empty else pd.Timestamp.now()
        preds = []
        for i in range(1, periods+1):
            preds.append({
                "date": (last_date + timedelta(days=i)).date(),
                "predicted_quantity": float(avg)
            })
        return {"predictions": preds, "metrics": {"rmse": 0.0, "mae": 0.0}}

    df.set_index('date', inplace=True)
    df = df.asfreq('D', fill_value=0)
    
    predictions = []
    metrics = {"rmse": 0.0, "mae": 0.0}
    
    if model_type == 'ARIMA':
        try:
            model = ARIMA(df['quantity'], order=(5,1,0))
            model_fit = model.fit()
            # Calculate metrics
            fitted = model_fit.fittedvalues
            metrics = calculate_metrics(df['quantity'].values, fitted.values)
            
            forecast = model_fit.forecast(steps=periods)
            for i, val in enumerate(forecast):
                pred_date = df.index[-1] + timedelta(days=i+1)
                predictions.append({
                    "date": pred_date.date(),
                    "predicted_quantity": max(0, float(val))
                })
            return {"predictions": predictions, "metrics": metrics}
        except Exception as e:
            logger.error(f"ARIMA failed: {e}")
            model_type = 'SMA'
            
    if model_type == 'SARIMA':
        try:
            model = SARIMAX(df['quantity'], order=(1, 1, 1), seasonal_order=(1, 1, 1, 7))
            model_fit = model.fit(disp=False)
            fitted = model_fit.fittedvalues
            metrics = calculate_metrics(df['quantity'].values, fitted.values)
            
            forecast = model_fit.forecast(steps=periods)
            for i, val in enumerate(forecast):
                pred_date = df.index[-1] + timedelta(days=i+1)
                predictions.append({
                    "date": pred_date.date(),
                    "predicted_quantity": max(0, float(val))
                })
            return {"predictions": predictions, "metrics": metrics}
        except Exception as e:
            logger.error(f"SARIMA failed: {e}")
            model_type = 'SMA'
            
    if model_type == 'Prophet' and Prophet is not None:
        try:
            pdf = df.reset_index().rename(columns={'date': 'ds', 'quantity': 'y'})
            m = Prophet(daily_seasonality=True, yearly_seasonality=False)
            m.fit(pdf)
            
            # Predict on historical data for metrics
            fitted = m.predict(pdf)
            metrics = calculate_metrics(pdf['y'].values, fitted['yhat'].values)
            
            future = m.make_future_dataframe(periods=periods)
            forecast = m.predict(future)
            future_forecast = forecast.tail(periods)
            for _, row in future_forecast.iterrows():
                predictions.append({
                    "date": row['ds'].date(),
                    "predicted_quantity": max(0, float(row['yhat']))
                })
            return {"predictions": predictions, "metrics": metrics}
        except Exception as e:
            logger.error(f"Prophet failed: {e}")
            model_type = 'SMA'
            
    # SMA fallback metrics
    last_7 = df['quantity'].tail(7)
    avg = last_7.mean() if not last_7.empty else 0
    # Naive metrics
    y_pred = [avg] * len(df)
    metrics = calculate_metrics(df['quantity'].values, y_pred)
    
    for i in range(1, periods+1):
        pred_date = df.index[-1] + timedelta(days=i)
        predictions.append({
            "date": pred_date.date(),
            "predicted_quantity": float(avg)
        })
    return {"predictions": predictions, "metrics": metrics}
