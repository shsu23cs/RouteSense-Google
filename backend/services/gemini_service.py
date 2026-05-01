"""
Optional Gemini AI integration for enhanced disruption analysis.
Falls back gracefully when GEMINI_API_KEY is not set.
"""
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

_model = None


def _get_model():
    global _model
    if _model is not None:
        return _model
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-2.0-flash")
        return _model
    except Exception as e:
        print(f"[Gemini] Init error: {e}")
        return None


def analyze_disruption(shipment_info: dict, alert_info: dict) -> str:
    """
    Ask Gemini to analyze a disruption and return an enhanced recommendation.
    Falls back to a pre-built rule-based recommendation if API is unavailable.
    """
    model = _get_model()
    if model is None:
        return _rule_based_recommendation(alert_info)

    prompt = f"""
You are a supply chain risk analyst. A disruption has been detected:

Shipment: {shipment_info.get('tracking_id')} 
Route: {shipment_info.get('origin_city')} → {shipment_info.get('dest_city')}
Carrier: {shipment_info.get('carrier')}
Cargo: {shipment_info.get('cargo_type')}

Disruption type: {alert_info.get('alert_type')}
Severity: {alert_info.get('severity')}
Description: {alert_info.get('message')}

Provide a concise (2-3 sentences) actionable recommendation for the logistics manager,
considering cargo type and severity. Focus on immediate next steps.
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini] API error: {e}")
        return _rule_based_recommendation(alert_info)


def _rule_based_recommendation(alert_info: dict) -> str:
    atype = alert_info.get("alert_type", "")
    severity = alert_info.get("severity", "low")

    if atype == "weather" and severity in ("high", "critical"):
        return ("Immediately reroute vessel away from storm system. Engage alternative carrier "
                "if vessel is unable to safely proceed. Notify consignee of expected 48-96 hour delay.")
    if atype == "port_congestion":
        return ("Divert to nearest alternate port with available berths. "
                "Pre-clear customs documentation to minimize additional hold time on arrival.")
    if atype == "carrier_delay":
        return ("Arrange emergency transshipment at nearest hub port. "
                "Notify all downstream parties and update delivery commitments immediately.")
    if atype == "customs":
        return ("Engage a licensed customs broker to expedite paperwork. "
                "Ensure all certificates and commercial invoices are complete and compliant.")
    if atype == "mechanical":
        return ("Dispatch emergency repair team. Assess cargo condition and viability. "
                "If reefer cargo, arrange immediate cold-chain transfer to avoid product loss.")
    return "Monitor situation closely and prepare contingency plans with logistics partners."


def get_route_recommendation(shipment_info: dict, routes: list) -> str:
    """Ask Gemini which alternative route is best, or return rule-based advice."""
    model = _get_model()
    if model is None or not routes:
        # Default: recommend lowest cost-delta with high reliability
        best = sorted(routes, key=lambda r: (r.get("cost_delta_percent", 99), -r.get("reliability_score", 0)))
        if best:
            return f"Recommended: '{best[0]['route_name']}' — best balance of cost and reliability."
        return "Review available alternatives and select based on cargo urgency."

    route_list = "\n".join(
        f"- {r['route_name']}: +{r['cost_delta_percent']}% cost, {r['reliability_score']}% reliability, "
        f"{r['estimated_duration_hours']:.0f}h duration"
        for r in routes
    )
    prompt = f"""
Supply chain analyst: recommend the best alternative route for this disrupted shipment.

Cargo: {shipment_info.get('cargo_type')}
Disruption level: {shipment_info.get('disruption_level')}

Options:
{route_list}

Reply in ONE sentence naming the recommended route and the main reason.
"""
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Route evaluation unavailable. Review options manually. (Error: {e})"
