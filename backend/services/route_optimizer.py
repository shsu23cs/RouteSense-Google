"""
Route optimization service.
Generates alternative routes for disrupted shipments.
"""
import json
import random
from sqlalchemy.orm import Session
import models


def generate_alternative_routes(db: Session, shipment: models.Shipment) -> list[models.Route]:
    """Create 3 alternative routes and persist them."""
    # Remove stale alternatives
    db.query(models.Route).filter(
        models.Route.shipment_id == shipment.id,
        models.Route.is_active == False,
    ).delete()

    origin = {"name": shipment.origin_city, "lat": shipment.origin_lat, "lon": shipment.origin_lon}
    dest   = {"name": shipment.dest_city,   "lat": shipment.dest_lat,   "lon": shipment.dest_lon}

    base_duration = abs(shipment.eta - shipment.original_eta).total_seconds() / 3600
    base_duration = max(base_duration, 240)  # at least 10 days

    options = [
        {
            "route_name": "Express Air Freight",
            "waypoints": json.dumps([
                origin,
                {"name": "Emirates Air Hub – Dubai", "lat": 25.2048, "lon": 55.2708},
                dest,
            ]),
            "estimated_duration_hours": 48.0,
            "cost_delta_percent": 85.0,
            "reliability_score": 97.0,
            "description": (
                "Air freight via Emirates Cargo hub. Fastest possible option with guaranteed "
                "slot booking. Cost premium reflects urgent handling fees."
            ),
        },
        {
            "route_name": "Alternate Sea – Cape of Good Hope",
            "waypoints": json.dumps([
                origin,
                {"name": "Cape of Good Hope", "lat": -34.357, "lon": 18.474},
                dest,
            ]),
            "estimated_duration_hours": base_duration + 72,
            "cost_delta_percent": 12.0,
            "reliability_score": 88.0,
            "description": (
                "Bypass affected Suez / Red Sea corridor via the Cape of Good Hope. "
                "Adds ~3 days but avoids current congestion hotspot. Moderate cost increase."
            ),
        },
        {
            "route_name": "Intermodal Rail + Sea Transfer",
            "waypoints": json.dumps([
                origin,
                {"name": "Central Asia Rail Hub – Almaty", "lat": 43.238, "lon": 76.889},
                {"name": "Black Sea Transfer – Constanta",  "lat": 44.180, "lon": 28.637},
                dest,
            ]),
            "estimated_duration_hours": base_duration + 24,
            "cost_delta_percent": 20.0,
            "reliability_score": 82.0,
            "description": (
                "Combined Belt-and-Road rail segment with short sea leg. "
                "Avoids affected maritime corridors. Suitable for non-perishable cargo."
            ),
        },
    ]

    created = []
    for opt in options:
        route = models.Route(
            shipment_id=shipment.id,
            route_name=opt["route_name"],
            is_primary=False,
            is_active=False,
            waypoints=opt["waypoints"],
            estimated_duration_hours=opt["estimated_duration_hours"],
            cost_delta_percent=opt["cost_delta_percent"],
            reliability_score=opt["reliability_score"],
            description=opt["description"],
        )
        db.add(route)
        created.append(route)

    db.commit()
    for r in created:
        db.refresh(r)
    return created


def apply_route(db: Session, shipment_id: int, route_id: int) -> bool:
    """Mark a route as active and update shipment ETA."""
    # Deactivate previous active routes
    db.query(models.Route).filter(
        models.Route.shipment_id == shipment_id,
        models.Route.is_active == True,
    ).update({"is_active": False})

    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        return False

    route.is_active = True

    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if shipment:
        import datetime
        new_eta = datetime.datetime.utcnow() + datetime.timedelta(hours=route.estimated_duration_hours)
        shipment.eta = new_eta
        shipment.status = "in_transit"
        shipment.disruption_level = "low"

    db.commit()
    return True
