from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class ProductBase(BaseModel):
    product_code: str
    name: str
    current_stock: int

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

class HistoricalSalesBase(BaseModel):
    date: date
    quantity: int

class HistoricalSalesCreate(HistoricalSalesBase):
    product_id: int

class HistoricalSales(HistoricalSalesBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class PredictedDemandBase(BaseModel):
    date: date
    predicted_quantity: float

class PredictedDemandCreate(PredictedDemandBase):
    product_id: int

class PredictedDemand(PredictedDemandBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True
