from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(50), unique=True, index=True)

    origin_city = Column(String(100))
    origin_country = Column(String(100))
    origin_lat = Column(Float)
    origin_lon = Column(Float)

    dest_city = Column(String(100))
    dest_country = Column(String(100))
    dest_lat = Column(Float)
    dest_lon = Column(Float)

    current_city = Column(String(100))
    current_lat = Column(Float)
    current_lon = Column(Float)

    carrier = Column(String(100))
    cargo_type = Column(String(100))
    weight_kg = Column(Float)

    # status: in_transit | delayed | disrupted | delivered
    status = Column(String(50), default="in_transit")
    # disruption_level: none | low | medium | high | critical
    disruption_level = Column(String(50), default="none")

    eta = Column(DateTime)
    original_eta = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    route_waypoints = Column(Text)          # JSON array of {lat, lon, name}
    progress_percent = Column(Float, default=0.0)

    alerts = relationship("Alert", back_populates="shipment", cascade="all, delete-orphan")
    alt_routes = relationship("Route", back_populates="shipment", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"))

    severity = Column(String(50))     # info | low | medium | high | critical
    alert_type = Column(String(50))   # weather | port_congestion | carrier_delay | customs | mechanical
    message = Column(Text)
    region = Column(String(100))
    recommended_action = Column(Text)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    shipment = relationship("Shipment", back_populates="alerts")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"))

    route_name = Column(String(200))
    is_primary = Column(Boolean, default=False)
    is_active = Column(Boolean, default=False)
    waypoints = Column(Text)                    # JSON
    estimated_duration_hours = Column(Float)
    cost_delta_percent = Column(Float, default=0.0)
    reliability_score = Column(Float, default=85.0)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    shipment = relationship("Shipment", back_populates="alt_routes")
