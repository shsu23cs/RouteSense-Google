from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from services.disruption_engine import resolve_alert

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=List[schemas.AlertOut])
def list_alerts(
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    is_resolved: Optional[bool] = None,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(models.Alert)
    if severity:
        q = q.filter(models.Alert.severity == severity)
    if alert_type:
        q = q.filter(models.Alert.alert_type == alert_type)
    if is_resolved is not None:
        q = q.filter(models.Alert.is_resolved == is_resolved)
    return q.order_by(models.Alert.created_at.desc()).limit(limit).all()


@router.patch("/{alert_id}/resolve")
def resolve(alert_id: int, db: Session = Depends(get_db)):
    ok = resolve_alert(db, alert_id)
    if not ok:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert resolved"}
