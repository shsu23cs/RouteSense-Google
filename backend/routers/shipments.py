from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(prefix="/shipments", tags=["shipments"])


@router.get("/", response_model=List[schemas.ShipmentSummary])
def list_shipments(
    status: Optional[str] = None,
    disruption_level: Optional[str] = None,
    carrier: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Shipment)
    if status:
        q = q.filter(models.Shipment.status == status)
    if disruption_level:
        q = q.filter(models.Shipment.disruption_level == disruption_level)
    if carrier:
        q = q.filter(models.Shipment.carrier == carrier)
    if search:
        q = q.filter(
            models.Shipment.tracking_id.ilike(f"%{search}%") |
            models.Shipment.origin_city.ilike(f"%{search}%") |
            models.Shipment.dest_city.ilike(f"%{search}%") |
            models.Shipment.carrier.ilike(f"%{search}%")
        )
    shipments = q.order_by(models.Shipment.created_at.desc()).all()

    result = []
    for s in shipments:
        active_alerts = sum(1 for a in s.alerts if not a.is_resolved)
        result.append(schemas.ShipmentSummary(
            id=s.id, tracking_id=s.tracking_id,
            origin_city=s.origin_city,    origin_country=s.origin_country,
            dest_city=s.dest_city,        dest_country=s.dest_country,
            current_city=s.current_city,
            current_lat=s.current_lat,    current_lon=s.current_lon,
            origin_lat=s.origin_lat,      origin_lon=s.origin_lon,
            dest_lat=s.dest_lat,          dest_lon=s.dest_lon,
            carrier=s.carrier,            cargo_type=s.cargo_type,
            status=s.status,              disruption_level=s.disruption_level,
            eta=s.eta,                    progress_percent=s.progress_percent,
            alert_count=active_alerts,
        ))
    return result


@router.get("/{shipment_id}", response_model=schemas.ShipmentOut)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return s


@router.patch("/{shipment_id}/apply-route")
def apply_route(shipment_id: int, route_id: int, db: Session = Depends(get_db)):
    from services.route_optimizer import apply_route as _apply
    success = _apply(db, shipment_id, route_id)
    if not success:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"message": "Route applied successfully"}


@router.get("/{shipment_id}/optimize")
def optimize_routes(shipment_id: int, db: Session = Depends(get_db)):
    from services.route_optimizer import generate_alternative_routes
    from services.gemini_service import get_route_recommendation
    s = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    routes = generate_alternative_routes(db, s)
    routes_data = [
        {
            "id": r.id, "route_name": r.route_name,
            "estimated_duration_hours": r.estimated_duration_hours,
            "cost_delta_percent": r.cost_delta_percent,
            "reliability_score": r.reliability_score,
            "description": r.description,
            "waypoints": r.waypoints,
        }
        for r in routes
    ]
    shipment_info = {
        "cargo_type": s.cargo_type,
        "disruption_level": s.disruption_level,
    }
    recommendation = get_route_recommendation(shipment_info, routes_data)
    return {"routes": routes_data, "ai_recommendation": recommendation}
