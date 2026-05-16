import os
import joblib
import pandas as pd
from prophet import Prophet
from prophet.serialize import model_from_json

MODEL_DIR = r"c:\Users\Siri\.gemini\antigravity\scratch\demand-forecasting\backend\models"

def test_models():
    print("--- Testing Models ---")
    
    # 1. Test prophet_model.json
    p_json = os.path.join(MODEL_DIR, "prophet_model.json")
    if os.path.exists(p_json):
        try:
            with open(p_json, 'r') as f:
                m = model_from_json(f.read())
            print("prophet_model.json: LOADED")
            future = m.make_future_dataframe(periods=4, freq='W')
            forecast = m.predict(future)
            print(f"prophet_model.json: PREDICTED ({len(forecast)} rows)")
        except Exception as e:
            print(f"prophet_model.json: FAILED - {e}")
    else:
        print("prophet_model.json: NOT FOUND")

    # 2. Test arima_model.pkl
    a_pkl = os.path.join(MODEL_DIR, "arima_model.pkl")
    if os.path.exists(a_pkl):
        try:
            fit = joblib.load(a_pkl)
            print("arima_model.pkl: LOADED")
            forecast = fit.forecast(steps=4)
            print(f"arima_model.pkl: PREDICTED ({len(forecast)} values)")
        except Exception as e:
            print(f"arima_model.pkl: FAILED - {e}")
    else:
        print("arima_model.pkl: NOT FOUND")

if __name__ == "__main__":
    test_models()
