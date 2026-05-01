"""
Rule-based disruption severity engine.
Optionally enhanced with Gemini AI when GEMINI_API_KEY is set.
"""
import json
import random
import datetime
from sqlalchemy.orm import Session
import models


SEVERITY_WEIGHTS = {
    "none":     0,
    "low":      1,
    "medium":   2,
    "high":     3,
    "critical": 4,
}

DISRUPTION_RULES = [
    # (alert_type, keywords_in_message, base_severity)
    ("weather",         ["typhoon", "hurricane", "cyclone"],  "critical"),
    ("weather",         ["storm", "gale", "fog"],             "high"),
    ("weather",         ["rain", "wind"],                     "low"),
    ("port_congestion", ["strike", "suspended"],              "critical"),
    ("port_congestion", ["congestion", "72 hours", "berth"],  "high"),
    ("port_congestion", ["delay", "wait"],                    "medium"),
    ("carrier_delay",   ["mechanical", "failure"],            "high"),
    ("carrier_delay",   ["delay", "off-schedule"],            "medium"),
    ("customs",         ["inspection", "hold"],               "medium"),
    ("mechanical",      ["malfunction", "temperature"],       "high"),
]


def classify_severity(alert_type: str, message: str) -> str:
    """Return severity string based on rule matching."""
    msg_lower = message.lower()
    for atype, keywords, severity in DISRUPTION_RULES:
        if atype == alert_type and any(kw in msg_lower for kw in keywords):
            return severity
    return "low"


def compute_delay_hours(disruption_level: str) -> int:
    mapping = {"none": 0, "low": 6, "medium": 24, "high": 48, "critical": 96}
    base = mapping.get(disruption_level, 0)
    return base + random.randint(0, base // 2 + 1)


def generate_disruption_summary(shipment: models.Shipment, alert: models.Alert) -> dict:
    """Build a structured summary for the frontend."""
    return {
        "shipment_id": shipment.id,
        "tracking_id": shipment.tracking_id,
        "carrier": shipment.carrier,
        "route": f"{shipment.origin_city} → {shipment.dest_city}",
        "severity": alert.severity,
        "type": alert.alert_type,
        "message": alert.message,
        "delay_estimate_hours": compute_delay_hours(alert.severity),
        "recommended_action": alert.recommended_action,
        "region": alert.region,
    }


def resolve_alert(db: Session, alert_id: int) -> bool:
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        return False
    alert.is_resolved = True
    db.commit()
    return True


def get_active_disruption_count(db: Session) -> int:
    return db.query(models.Alert).filter(models.Alert.is_resolved == False).count()
