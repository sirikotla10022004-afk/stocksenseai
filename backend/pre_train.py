from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from services.ml_service import preprocess_sales_data, generate_forecast

# Ensure models exist
models.Base.metadata.create_all(bind=engine)

def train_existing_data():
    db: Session = SessionLocal()
    try:
        products = db.query(models.Product).all()
        if not products:
            print("No products found in the database. Nothing to train on.")
            return

        print(f"Found {len(products)} products. Clearing old predictions and generating new ones using ARIMA...")
        
        # Clear existing
        db.query(models.PredictedDemand).delete()
        
        count = 0
        for product in products:
            sales = db.query(models.HistoricalSales).filter(models.HistoricalSales.product_id == product.id).order_by(models.HistoricalSales.date.asc()).all()
            if not sales:
                continue
                
            sales_data = [{"date": s.date, "quantity": s.quantity} for s in sales]
            df = preprocess_sales_data(sales_data)
            
            # Use ARIMA to generate predictions
            predictions = generate_forecast(df, periods=7, model_type="ARIMA")
            
            for pred in predictions:
                prediction = models.PredictedDemand(
                    product_id=product.id,
                    date=pred["date"],
                    predicted_quantity=pred["predicted_quantity"]
                )
                db.add(prediction)
            
            count += 1
            print(f"Generated forecast for {product.name} (ID: {product.product_code})")
            
        db.commit()
        print(f"Successfully trained models and generated forecasts for {count} products!")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    train_existing_data()
