import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from services.ml_service import preprocess_sales_data, generate_forecast

models.Base.metadata.create_all(bind=engine)

def seed_database():
    db: Session = SessionLocal()
    try:
        # Clear existing
        db.query(models.PredictedDemand).delete()
        db.query(models.HistoricalSales).delete()
        db.query(models.Product).delete()
        db.commit()

        # Categorized products
        products_data = [
            {"code": "F001", "name": "Organic Almond Milk", "category": "Food", "sub_category": "Dairy Alternatives", "stock": 50, "base": 30},
            {"code": "F002", "name": "Artisan Sourdough Bread", "category": "Food", "sub_category": "Bakery", "stock": 10, "base": 40},
            {"code": "D001", "name": "Sparkling Mineral Water", "category": "Drinks", "sub_category": "Water", "stock": 200, "base": 60},
            {"code": "D002", "name": "Cold Brew Coffee", "category": "Drinks", "sub_category": "Coffee", "stock": 15, "base": 50}, # low stock
            {"code": "E001", "name": "Wireless Earbuds", "category": "Electronics", "sub_category": "Audio", "stock": 100, "base": 15},
            {"code": "E002", "name": "Smart Watch", "category": "Electronics", "sub_category": "Wearables", "stock": 30, "base": 10},
            {"code": "C001", "name": "Cotton T-Shirt", "category": "Clothing", "sub_category": "Tops", "stock": 300, "base": 80}, # high stock
            {"code": "C002", "name": "Denim Jeans", "category": "Clothing", "sub_category": "Bottoms", "stock": 40, "base": 25},
        ]
        
        products = []
        for p in products_data:
            prod = models.Product(
                product_code=p["code"],
                name=p["name"],
                category=p["category"],
                sub_category=p["sub_category"],
                current_stock=p["stock"]
            )
            db.add(prod)
            products.append(prod)
            
        db.commit()
        
        today = date.today()
        
        for p_idx, prod in enumerate(products):
            base_sales = products_data[p_idx]["base"]
            trend = random.choice([-0.1, 0.1, 0.2, 0.05])
            
            for i in range(60):
                current_date = today - timedelta(days=60-i)
                is_weekend = current_date.weekday() >= 5
                seasonality = 1.3 if is_weekend else 1.0
                noise = random.uniform(0.9, 1.1)
                qty = max(0, int((base_sales + (i * trend)) * seasonality * noise))
                
                sale = models.HistoricalSales(
                    product_id=prod.id,
                    date=current_date,
                    quantity=qty
                )
                db.add(sale)
                
        db.commit()
        print("Successfully seeded historical sales data.")
        
        print("Generating forecasts...")
        for product in products:
            sales = db.query(models.HistoricalSales).filter(models.HistoricalSales.product_id == product.id).order_by(models.HistoricalSales.date.asc()).all()
            sales_data = [{"date": s.date, "quantity": s.quantity} for s in sales]
            df = preprocess_sales_data(sales_data)
            
            predictions = generate_forecast(df, periods=7, model_type="ARIMA")["predictions"]
            
            for pred in predictions:
                prediction = models.PredictedDemand(
                    product_id=product.id,
                    date=pred["date"],
                    predicted_quantity=pred["predicted_quantity"]
                )
                db.add(prediction)
                
        db.commit()
        print("Seeding complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
