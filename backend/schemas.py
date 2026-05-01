from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AlertOut(BaseModel):
    id: int
    shipment_id: int
    severity: str
    alert_type: str
    message: str
    region: str
    recommended_action: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RouteOut(BaseModel):
    id: int
    shipment_id: int
    route_name: str
    is_primary: bool
    is_active: bool
    waypoints: str
    estimated_duration_hours: float
    cost_delta_percent: float
    reliability_score: float
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class ShipmentOut(BaseModel):
    id: int
    tracking_id: str
    origin_city: str
    origin_country: str
    origin_lat: float
    origin_lon: float
    dest_city: str
    dest_country: str
    dest_lat: float
    dest_lon: float
    current_city: str
    current_lat: float
    current_lon: float
    carrier: str
    cargo_type: str
    weight_kg: float
    status: str
    disruption_level: str
    eta: datetime
    original_eta: datetime
    created_at: datetime
    route_waypoints: Optional[str] = None
    progress_percent: float
    alerts: List[AlertOut] = []
    alt_routes: List[RouteOut] = []

    class Config:
        from_attributes = True


class ShipmentSummary(BaseModel):
    id: int
    tracking_id: str
    origin_city: str
    origin_country: str
    dest_city: str
    dest_country: str
    current_city: str
    current_lat: float
    current_lon: float
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    carrier: str
    cargo_type: str
    status: str
    disruption_level: str
    eta: datetime
    progress_percent: float
    alert_count: int = 0

    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    total_shipments: int
    in_transit: int
    delivered: int
    delayed: int
    disrupted: int
    on_time_rate: float
    active_alerts: int
    avg_delay_hours: float
