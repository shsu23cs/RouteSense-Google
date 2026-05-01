"""
Seed the database with realistic shipment data and run a background
disruption simulator that fires every 30 seconds.
"""
import json
import random
import asyncio
import datetime
from database import SessionLocal
import models

CITIES = [
    {"name": "Shanghai",    "country": "China",       "lat": 31.2304,  "lon": 121.4737, "region": "Asia Pacific"},
    {"name": "Rotterdam",   "country": "Netherlands", "lat": 51.9244,  "lon": 4.4777,   "region": "Europe"},
    {"name": "Los Angeles", "country": "USA",         "lat": 34.0522,  "lon": -118.2437,"region": "North America"},
    {"name": "Singapore",   "country": "Singapore",   "lat": 1.3521,   "lon": 103.8198, "region": "Asia Pacific"},
    {"name": "Dubai",       "country": "UAE",         "lat": 25.2048,  "lon": 55.2708,  "region": "Middle East"},
    {"name": "Mumbai",      "country": "India",       "lat": 19.0760,  "lon": 72.8777,  "region": "Asia Pacific"},
    {"name": "Hamburg",     "country": "Germany",     "lat": 53.5753,  "lon": 10.0153,  "region": "Europe"},
    {"name": "New York",    "country": "USA",         "lat": 40.7128,  "lon": -74.0060, "region": "North America"},
    {"name": "Tokyo",       "country": "Japan",       "lat": 35.6762,  "lon": 139.6503, "region": "Asia Pacific"},
    {"name": "Sydney",      "country": "Australia",   "lat": -33.8688, "lon": 151.2093, "region": "Asia Pacific"},
    {"name": "Antwerp",     "country": "Belgium",     "lat": 51.2194,  "lon": 4.4025,   "region": "Europe"},
    {"name": "Hong Kong",   "country": "China",       "lat": 22.3193,  "lon": 114.1694, "region": "Asia Pacific"},
    {"name": "Busan",       "country": "South Korea", "lat": 35.1796,  "lon": 129.0756, "region": "Asia Pacific"},
    {"name": "Chicago",     "country": "USA",         "lat": 41.8781,  "lon": -87.6298, "region": "North America"},
    {"name": "London",      "country": "UK",          "lat": 51.5074,  "lon": -0.1278,  "region": "Europe"},
    {"name": "Felixstowe",  "country": "UK",          "lat": 51.9642,  "lon": 1.3518,   "region": "Europe"},
]

CARRIERS = ["Maersk", "MSC", "COSCO", "CMA CGM", "Evergreen", "Hapag-Lloyd", "Yang Ming", "ZIM"]
CARGO_TYPES = ["Electronics", "Automotive Parts", "Pharmaceuticals", "Food & Beverage",
               "Chemicals", "Machinery", "Textiles", "Consumer Goods"]

DISRUPTION_TEMPLATES = [
    {"type": "weather",          "severity": "critical", "msg": "Typhoon Haikui causing severe disruptions near {region} — all vessels rerouted",          "action": "Reroute via southern corridor; ETA extended by 3-5 days"},
    {"type": "weather",          "severity": "high",     "msg": "Severe North Atlantic storm system reducing vessel speed to 8 knots",                      "action": "Monitor conditions; consider waiting in Azores for weather window"},
    {"type": "port_congestion",  "severity": "high",     "msg": "Port congestion at {port} — berth wait time exceeding 72 hours",                           "action": "Divert to alternate port; coordinate with customs for pre-clearance"},
    {"type": "port_congestion",  "severity": "critical", "msg": "Labor strike at {port} — all loading operations suspended indefinitely",                   "action": "Immediate diversion required; engage emergency logistics partner"},
    {"type": "carrier_delay",    "severity": "medium",   "msg": "Vessel mechanical failure on {carrier} — emergency port call scheduled",                   "action": "Arrange transshipment at nearest hub; notify consignee of delay"},
    {"type": "customs",          "severity": "medium",   "msg": "Extended customs inspection at {port} causing estimated 48-hour delay",                    "action": "Submit additional documentation; engage customs broker immediately"},
    {"type": "mechanical",       "severity": "high",     "msg": "Refrigeration unit malfunction detected on reefer cargo — temperature excursion risk",     "action": "Emergency service call; assess cargo viability; prepare insurance claim"},
    {"type": "weather",          "severity": "low",      "msg": "Dense fog at {port} halting all port operations — expected to clear in 12 hours",          "action": "No immediate action required; monitor port advisories"},
]

# Intermediate waypoint city pairs (for route visualization)
WAYPOINTS_MAP = {
    ("Shanghai", "Rotterdam"):   [{"name": "Strait of Malacca", "lat": 1.26,   "lon": 103.82},
                                   {"name": "Suez Canal",        "lat": 30.58,  "lon": 32.33}],
    ("Singapore", "Los Angeles"):[{"name": "Pacific Ocean",     "lat": 15.0,   "lon": 160.0}],
    ("Dubai", "New York"):       [{"name": "Suez Canal",        "lat": 30.58,  "lon": 32.33},
                                   {"name": "Mediterranean",     "lat": 36.0,   "lon": 18.0}],
    ("Hong Kong", "Hamburg"):    [{"name": "Strait of Malacca", "lat": 1.26,   "lon": 103.82},
                                   {"name": "Suez Canal",        "lat": 30.58,  "lon": 32.33}],
    ("Busan", "Los Angeles"):    [{"name": "North Pacific",     "lat": 40.0,   "lon": 170.0}],
    ("Mumbai", "Rotterdam"):     [{"name": "Suez Canal",        "lat": 30.58,  "lon": 32.33}],
    ("Shanghai", "Sydney"):      [{"name": "Coral Sea",         "lat": -20.0,  "lon": 155.0}],
}


def _get_waypoints(origin: str, dest: str) -> list:
    key = (origin, dest)
    if key in WAYPOINTS_MAP:
        return WAYPOINTS_MAP[key]
    rev = (dest, origin)
    if rev in WAYPOINTS_MAP:
        return list(reversed(WAYPOINTS_MAP[rev]))
    return []


def _interpolate(origin, dest, pct):
    """Return lat/lon at pct% along origin→dest path."""
    lat = origin["lat"] + (dest["lat"] - origin["lat"]) * pct
    lon = origin["lon"] + (dest["lon"] - origin["lon"]) * pct
    return lat, lon


def seed_database():
    db = SessionLocal()
    if db.query(models.Shipment).count() > 0:
        db.close()
        return  # already seeded

    now = datetime.datetime.utcnow()

    shipment_configs = [
        # (origin_idx, dest_idx, carrier, cargo, status, disruption_level, progress, delay_hours)
        (0,  1,  "Maersk",      "Electronics",      "in_transit",  "none",     35, 0),
        (3,  2,  "MSC",         "Automotive Parts",  "in_transit",  "none",     60, 0),
        (4,  7,  "CMA CGM",     "Pharmaceuticals",   "disrupted",   "critical", 45, 72),
        (11, 1,  "COSCO",       "Machinery",         "in_transit",  "none",     20, 0),
        (5,  1,  "Hapag-Lloyd", "Chemicals",         "delayed",     "medium",   55, 36),
        (8,  6,  "Evergreen",   "Consumer Goods",    "in_transit",  "none",     75, 0),
        (13, 2,  "Yang Ming",   "Textiles",          "disrupted",   "high",     30, 48),
        (0,  9,  "ZIM",         "Electronics",       "in_transit",  "none",     50, 0),
        (3,  7,  "Maersk",      "Food & Beverage",   "delivered",   "none",     100, 0),
        (4,  1,  "MSC",         "Automotive Parts",  "in_transit",  "none",     65, 0),
        (0,  6,  "COSCO",       "Machinery",         "delayed",     "low",      40, 12),
        (12, 2,  "CMA CGM",     "Electronics",       "in_transit",  "none",     85, 0),
        (11, 7,  "Hapag-Lloyd", "Pharmaceuticals",   "disrupted",   "high",     25, 60),
        (1,  7,  "Maersk",      "Consumer Goods",    "in_transit",  "none",     55, 0),
        (5,  6,  "Evergreen",   "Textiles",          "delivered",   "none",     100, 0),
        (8,  1,  "Yang Ming",   "Automotive Parts",  "in_transit",  "none",     45, 0),
        (4,  2,  "ZIM",         "Chemicals",         "delayed",     "medium",   70, 24),
        (3,  6,  "MSC",         "Electronics",       "in_transit",  "none",     30, 0),
        (0,  7,  "COSCO",       "Food & Beverage",   "disrupted",   "medium",   60, 30),
        (13, 1,  "Maersk",      "Machinery",         "in_transit",  "none",     15, 0),
        (11, 9,  "CMA CGM",     "Consumer Goods",    "delivered",   "none",     100, 0),
        (5,  7,  "Hapag-Lloyd", "Textiles",          "in_transit",  "none",     80, 0),
        (12, 6,  "Evergreen",   "Electronics",       "in_transit",  "none",     35, 0),
        (4,  1,  "Yang Ming",   "Pharmaceuticals",   "delayed",     "low",      50, 18),
        (0,  2,  "ZIM",         "Automotive Parts",  "in_transit",  "none",     90, 0),
    ]

    for i, (oi, di, carrier, cargo, status, dlevel, progress, delay_h) in enumerate(shipment_configs, 1):
        origin = CITIES[oi]
        dest   = CITIES[di]
        pct    = progress / 100.0

        cur_lat, cur_lon = _interpolate(origin, dest, pct)
        waypoints = _get_waypoints(origin["name"], dest["name"])

        days_ago = random.randint(3, 15)
        created = now - datetime.timedelta(days=days_ago)
        total_days = random.randint(18, 35)
        original_eta = created + datetime.timedelta(days=total_days)
        eta = original_eta + datetime.timedelta(hours=delay_h)

        if status == "delivered":
            cur_lat, cur_lon = dest["lat"], dest["lon"]
            eta = now - datetime.timedelta(days=random.randint(1, 3))

        s = models.Shipment(
            tracking_id=f"SC-2024-{i:03d}",
            origin_city=origin["name"],    origin_country=origin["country"],
            origin_lat=origin["lat"],      origin_lon=origin["lon"],
            dest_city=dest["name"],        dest_country=dest["country"],
            dest_lat=dest["lat"],          dest_lon=dest["lon"],
            current_city=f"En route to {dest['name']}" if status != "delivered" else dest["name"],
            current_lat=cur_lat,           current_lon=cur_lon,
            carrier=carrier,               cargo_type=cargo,
            weight_kg=round(random.uniform(5000, 28000), 1),
            status=status,                 disruption_level=dlevel,
            eta=eta,                       original_eta=original_eta,
            created_at=created,
            route_waypoints=json.dumps(waypoints),
            progress_percent=float(progress),
        )
        db.add(s)
        db.flush()

        # Add alerts for disrupted/delayed shipments
        if dlevel in ("medium", "high", "critical"):
            templates = [t for t in DISRUPTION_TEMPLATES if t["severity"] == dlevel or
                         (dlevel == "medium" and t["severity"] in ("medium", "low"))]
            tmpl = random.choice(templates) if templates else DISRUPTION_TEMPLATES[0]
            alert = models.Alert(
                shipment_id=s.id,
                severity=dlevel,
                alert_type=tmpl["type"],
                message=tmpl["msg"].format(region=origin["region"], port=dest["name"], carrier=carrier),
                region=origin["region"],
                recommended_action=tmpl["action"],
                is_resolved=False,
                created_at=now - datetime.timedelta(hours=random.randint(1, 12)),
            )
            db.add(alert)

        # Add alternative routes for disrupted shipments
        if status == "disrupted":
            routes_data = [
                {
                    "name": "Express Air Freight",
                    "waypoints": json.dumps([
                        {"name": origin["name"],  "lat": origin["lat"], "lon": origin["lon"]},
                        {"name": "Transit Hub",   "lat": 25.2048,       "lon": 55.2708},
                        {"name": dest["name"],    "lat": dest["lat"],   "lon": dest["lon"]},
                    ]),
                    "duration": 48.0, "cost_delta": 85.0, "reliability": 97.0,
                    "desc": "Air freight via Emirates hub. Fastest option, significantly higher cost.",
                },
                {
                    "name": "Alternative Sea Route (Cape of Good Hope)",
                    "waypoints": json.dumps([
                        {"name": origin["name"],         "lat": origin["lat"], "lon": origin["lon"]},
                        {"name": "Cape of Good Hope",    "lat": -34.357,       "lon": 18.474},
                        {"name": dest["name"],           "lat": dest["lat"],   "lon": dest["lon"]},
                    ]),
                    "duration": float(total_days * 24 + 72), "cost_delta": 12.0, "reliability": 88.0,
                    "desc": "Bypass Suez Canal via Cape of Good Hope. Adds 3 days but avoids congestion.",
                },
                {
                    "name": "Intermodal Rail + Sea",
                    "waypoints": json.dumps([
                        {"name": origin["name"],  "lat": origin["lat"], "lon": origin["lon"]},
                        {"name": "Rail Segment",  "lat": 43.238,        "lon": 76.889},
                        {"name": dest["name"],    "lat": dest["lat"],   "lon": dest["lon"]},
                    ]),
                    "duration": float(total_days * 24 + 24), "cost_delta": 20.0, "reliability": 82.0,
                    "desc": "Combined rail and sea transport. Moderate cost increase, avoids affected sea lanes.",
                },
            ]
            for rd in routes_data:
                db.add(models.Route(
                    shipment_id=s.id,
                    route_name=rd["name"],
                    is_primary=False, is_active=False,
                    waypoints=rd["waypoints"],
                    estimated_duration_hours=rd["duration"],
                    cost_delta_percent=rd["cost_delta"],
                    reliability_score=rd["reliability"],
                    description=rd["desc"],
                ))

    db.commit()
    db.close()
    print("✅ Database seeded with 25 shipments.")


# ── Background simulator ──────────────────────────────────────────────────────

# Populated by main.py so SSE can push to connected clients
alert_subscribers: list = []


async def start_simulator():
    """Every 30 s, randomly create a disruption event and broadcast it."""
    await asyncio.sleep(10)  # initial delay
    while True:
        await asyncio.sleep(30)
        db = SessionLocal()
        try:
            active = db.query(models.Shipment).filter(
                models.Shipment.status.in_(["in_transit", "delayed"])
            ).all()
            if not active:
                continue

            shipment = random.choice(active)
            tmpl = random.choice(DISRUPTION_TEMPLATES)
            origin_city_obj = next((c for c in CITIES if c["name"] == shipment.origin_city), CITIES[0])

            alert = models.Alert(
                shipment_id=shipment.id,
                severity=tmpl["severity"],
                alert_type=tmpl["type"],
                message=tmpl["msg"].format(
                    region=origin_city_obj.get("region", "Asia Pacific"),
                    port=shipment.dest_city,
                    carrier=shipment.carrier,
                ),
                region=origin_city_obj.get("region", "Global"),
                recommended_action=tmpl["action"],
                is_resolved=False,
            )
            db.add(alert)

            # Escalate shipment status
            if tmpl["severity"] in ("high", "critical"):
                shipment.status = "disrupted"
                shipment.disruption_level = tmpl["severity"]
                shipment.eta = shipment.eta + datetime.timedelta(hours=random.randint(24, 96))
            elif tmpl["severity"] == "medium":
                shipment.status = "delayed"
                shipment.disruption_level = "medium"
                shipment.eta = shipment.eta + datetime.timedelta(hours=random.randint(12, 48))

            db.commit()
            db.refresh(alert)

            event_payload = {
                "type": "new_alert",
                "alert_id": alert.id,
                "shipment_id": shipment.id,
                "tracking_id": shipment.tracking_id,
                "severity": alert.severity,
                "alert_type": alert.alert_type,
                "message": alert.message,
                "region": alert.region,
                "recommended_action": alert.recommended_action,
                "created_at": alert.created_at.isoformat(),
            }

            for q in list(alert_subscribers):
                try:
                    await q.put(event_payload)
                except Exception:
                    pass

        except Exception as e:
            print(f"Simulator error: {e}")
        finally:
            db.close()
