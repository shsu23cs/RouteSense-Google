from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("/{shipment_id}")
def get_routes(shipment_id: int, db: Session = Depends(get_db)):
    routes = db.query(models.Route).filter(models.Route.shipment_id == shipment_id).all()
    return [
        {
            "id": r.id,
            "route_name": r.route_name,
            "is_primary": r.is_primary,
            "is_active": r.is_active,
            "waypoints": r.waypoints,
            "estimated_duration_hours": r.estimated_duration_hours,
            "cost_delta_percent": r.cost_delta_percent,
            "reliability_score": r.reliability_score,
            "description": r.description,
            "created_at": r.created_at.isoformat(),
        }
        for r in routes
    ]
