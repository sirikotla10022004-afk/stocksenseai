"""
Update models.py to add name field to User and ensure compatibility.
"""
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=True)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, unique=True, index=True)
    name = Column(String)
    category = Column(String, nullable=True)
    current_stock = Column(Integer, default=0)
    sales = relationship("HistoricalSales", back_populates="product")
    predictions = relationship("PredictedDemand", back_populates="product")


class HistoricalSales(Base):
    __tablename__ = "historical_sales"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    date = Column(Date)
    quantity = Column(Integer)
    product = relationship("Product", back_populates="sales")


class PredictedDemand(Base):
    __tablename__ = "predicted_demand"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    date = Column(Date)
    predicted_quantity = Column(Float)
    product = relationship("Product", back_populates="predictions")
