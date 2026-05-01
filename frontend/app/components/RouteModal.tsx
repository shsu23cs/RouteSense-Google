"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Route, Zap, DollarSign, Shield, Loader2 } from "lucide-react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RouteOption {
  id: number;
  route_name: string;
  estimated_duration_hours: number;
  cost_delta_percent: number;
  reliability_score: number;
  description: string;
  waypoints: string;
}

interface RouteModalProps {
  shipmentId: number;
  trackingId: string;
  onClose: () => void;
  onApplied: () => void;
}

export default function RouteModal({ shipmentId, trackingId, onClose, onApplied }: RouteModalProps) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [aiRec, setAiRec] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/shipments/${shipmentId}/optimize`);
      setRoutes(res.data.routes);
      setAiRec(res.data.ai_recommendation);
      setLoaded(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyRoute = async (routeId: number) => {
    setApplying(routeId);
    try {
      await axios.patch(`${API}/api/shipments/${shipmentId}/apply-route?route_id=${routeId}`);
      onApplied();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(null);
    }
  };

  const formatDuration = (h: number) => {
    const days = Math.floor(h / 24);
    const hrs  = Math.round(h % 24);
    return days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;
  };

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: "680px", padding: "28px", position: "relative",
        background: "#0d1f38", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Route Optimization</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              Shipment {trackingId}
            </p>
          </div>
          <button className="btn btn-ghost" style={{ padding: "6px" }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {!loaded ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Generate AI-powered alternative routes for this disrupted shipment.
            </p>
            <button className="btn btn-primary" onClick={loadRoutes} disabled={loading}>
              {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={15} />}
              {loading ? "Analyzing routes…" : "Generate Alternative Routes"}
            </button>
          </div>
        ) : (
          <>
            {/* AI Recommendation */}
            {aiRec && (
              <div style={{
                background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
                borderRadius: "12px", padding: "12px 16px", marginBottom: "18px",
                display: "flex", gap: "10px", alignItems: "flex-start",
              }}>
                <Zap size={16} color="#7c3aed" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: "#a78bfa", marginBottom: "3px" }}>
                    AI RECOMMENDATION
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{aiRec}</p>
                </div>
              </div>
            )}

            {/* Route options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {routes.map((r) => (
                <div key={r.id} className="glass" style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <Route size={14} color="var(--cyan)" />
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{r.route_name}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px", lineHeight: 1.5 }}>
                        {r.description}
                      </p>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--text-muted)" }}>
                          <Zap size={12} color="var(--cyan)" />
                          <span>{formatDuration(r.estimated_duration_hours)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px",
                          color: r.cost_delta_percent > 30 ? "var(--warning)" : "var(--text-muted)" }}>
                          <DollarSign size={12} />
                          <span>+{r.cost_delta_percent}% cost</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px",
                          color: r.reliability_score > 90 ? "var(--success)" : "var(--text-muted)" }}>
                          <Shield size={12} />
                          <span>{r.reliability_score}% reliable</span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: "12px", padding: "8px 14px", flexShrink: 0 }}
                      onClick={() => applyRoute(r.id)}
                      disabled={applying !== null}
                    >
                      {applying === r.id
                        ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                        : "Apply Route"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
