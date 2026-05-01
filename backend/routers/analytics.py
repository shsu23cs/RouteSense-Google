from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models, schemas
import datetime

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def get_summary(db: Session = Depends(get_db)):
    total      = db.query(models.Shipment).count()
    in_transit = db.query(models.Shipment).filter(models.Shipment.status == "in_transit").count()
    delivered  = db.query(models.Shipment).filter(models.Shipment.status == "delivered").count()
    delayed    = db.query(models.Shipment).filter(models.Shipment.status == "delayed").count()
    disrupted  = db.query(models.Shipment).filter(models.Shipment.status == "disrupted").count()
    active_alerts = db.query(models.Alert).filter(models.Alert.is_resolved == False).count()

    on_time = in_transit + delivered
    on_time_rate = round((on_time / total * 100) if total else 0, 1)

    # Avg delay: hours between original_eta and current eta for non-delivered shipments
    delayed_ships = db.query(models.Shipment).filter(
        models.Shipment.status.in_(["delayed", "disrupted"])
    ).all()
    if delayed_ships:
        avg_delay = sum(
            max((s.eta - s.original_eta).total_seconds() / 3600, 0)
            for s in delayed_ships
        ) / len(delayed_ships)
    else:
        avg_delay = 0.0

    return schemas.AnalyticsSummary(
        total_shipments=total,
        in_transit=in_transit,
        delivered=delivered,
        delayed=delayed,
        disrupted=disrupted,
        on_time_rate=on_time_rate,
        active_alerts=active_alerts,
        avg_delay_hours=round(avg_delay, 1),
    )


@router.get("/disruptions-over-time")
def disruptions_over_time(db: Session = Depends(get_db)):
    """Return alert counts grouped by day for the last 14 days."""
    now = datetime.datetime.utcnow()
    days = []
    for i in range(13, -1, -1):
        day_start = (now - datetime.timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + datetime.timedelta(days=1)
        count = db.query(models.Alert).filter(
            models.Alert.created_at >= day_start,
            models.Alert.created_at < day_end,
        ).count()
        days.append({"date": day_start.strftime("%b %d"), "disruptions": count})
    return days


@router.get("/by-type")
def disruptions_by_type(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Alert.alert_type, func.count(models.Alert.id).label("count"))
        .group_by(models.Alert.alert_type)
        .all()
    )
    return [{"type": r[0], "count": r[1]} for r in rows]


@router.get("/by-carrier")
def disruptions_by_carrier(db: Session = Depends(get_db)):
    from sqlalchemy import join
    rows = (
        db.query(models.Shipment.carrier, func.count(models.Alert.id).label("count"))
        .join(models.Alert, models.Alert.shipment_id == models.Shipment.id)
        .filter(models.Alert.is_resolved == False)
        .group_by(models.Shipment.carrier)
        .order_by(func.count(models.Alert.id).desc())
        .all()
    )
    return [{"carrier": r[0], "disruptions": r[1]} for r in rows]


@router.get("/by-region")
def disruptions_by_region(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Alert.region, func.count(models.Alert.id).label("count"))
        .group_by(models.Alert.region)
        .order_by(func.count(models.Alert.id).desc())
        .all()
    )
    return [{"region": r[0], "count": r[1]} for r in rows]
