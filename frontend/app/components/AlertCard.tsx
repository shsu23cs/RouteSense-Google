"use client";

import { useState } from "react";
import { CheckCircle, ChevronRight, AlertTriangle, Cloud, Anchor, Truck, Package, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  weather:         <Cloud size={14} />,
  port_congestion: <Anchor size={14} />,
  carrier_delay:   <Truck size={14} />,
  customs:         <Package size={14} />,
  mechanical:      <Settings size={14} />,
};

interface Alert {
  id: number;
  shipment_id: number;
  severity: string;
  alert_type: string;
  message: string;
  region: string;
  recommended_action: string;
  is_resolved: boolean;
  created_at: string;
}

interface AlertCardProps {
  alert: Alert;
  onResolved?: (id: number) => void;
}

export default function AlertCard({ alert, onResolved }: AlertCardProps) {
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(alert.is_resolved);

  const handleResolve = async () => {
    setResolving(true);
    try {
      await axios.patch(`${API}/api/alerts/${alert.id}/resolve`);
      setResolved(true);
      onResolved?.(alert.id);
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const severityColors: Record<string, string> = {
    critical: "#ef4444", high: "#ef4444", medium: "#f59e0b", low: "#3b82f6", info: "#00d4ff",
  };
  const color = severityColors[alert.severity] ?? "var(--cyan)";

  return (
    <div
      className="glass animate-fade-in-up"
      style={{
        padding: "16px 18px",
        borderLeft: `3px solid ${color}`,
        opacity: resolved ? 0.5 : 1,
        transition: "opacity 0.3s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span className={`badge badge-${alert.severity}`}>
              {alert.severity === "critical" && <AlertTriangle size={9} />}
              {alert.severity}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
              {TYPE_ICONS[alert.alert_type] ?? <ChevronRight size={12} />}
              {alert.alert_type.replace("_", " ")}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </span>
          </div>

          <p style={{ fontSize: "13.5px", color: "var(--text-primary)", marginBottom: "6px", lineHeight: 1.5 }}>
            {alert.message}
          </p>

          <div style={{
            background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)",
            borderRadius: "8px", padding: "8px 12px", marginTop: "8px",
          }}>
            <p style={{ fontSize: "11px", color: "var(--cyan)", fontWeight: 600, marginBottom: "2px" }}>
              RECOMMENDED ACTION
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {alert.recommended_action}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>📍 {alert.region}</span>
          </div>
        </div>

        {!resolved && (
          <button
            className="btn btn-success"
            style={{ fontSize: "12px", padding: "6px 12px", flexShrink: 0 }}
            onClick={handleResolve}
            disabled={resolving}
          >
            <CheckCircle size={13} />
            {resolving ? "…" : "Resolve"}
          </button>
        )}

        {resolved && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--success)" }}>
            <CheckCircle size={13} /> Resolved
          </div>
        )}
      </div>
    </div>
  );
}
