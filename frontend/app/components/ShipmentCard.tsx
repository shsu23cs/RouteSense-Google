"use client";

import { useState } from "react";
import {
  Ship, MapPin, Clock, Package, BarChart2, Route,
} from "lucide-react";
import DisruptionBadge from "./DisruptionBadge";
import RouteModal from "./RouteModal";
import { formatDistanceToNow } from "date-fns";

interface Shipment {
  id: number;
  tracking_id: string;
  origin_city: string;
  origin_country: string;
  dest_city: string;
  dest_country: string;
  current_city: string;
  carrier: string;
  cargo_type: string;
  status: string;
  disruption_level: string;
  eta: string;
  progress_percent: number;
  alert_count: number;
}

interface ShipmentCardProps {
  shipment: Shipment;
  onRouteApplied?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  in_transit: "var(--cyan)",
  delivered:  "var(--success)",
  delayed:    "var(--warning)",
  disrupted:  "var(--danger)",
};

export default function ShipmentCard({ shipment: s, onRouteApplied }: ShipmentCardProps) {
  const [showModal, setShowModal] = useState(false);
  const statusColor = STATUS_COLORS[s.status] ?? "var(--text-muted)";
  const needsRoute = s.disruption_level !== "none" && s.status !== "delivered";

  return (
    <>
      <div
        className="glass animate-fade-in-up"
        style={{ padding: "18px 20px", borderLeft: `3px solid ${statusColor}` }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "8px",
              background: `${statusColor}18`, border: `1px solid ${statusColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center", color: statusColor,
            }}>
              <Ship size={15} />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                {s.tracking_id}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.carrier}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span className={`badge badge-${s.status}`}>{s.status.replace("_", " ")}</span>
            <DisruptionBadge level={s.disruption_level} />
          </div>
        </div>

        {/* Route */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <MapPin size={12} color="var(--cyan)" />
          <span>{s.origin_city}, {s.origin_country}</span>
          <span style={{ color: "var(--text-muted)" }}>→</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{s.dest_city}, {s.dest_country}</span>
        </div>

        {/* Current location + cargo */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" }}>
            <Ship size={11} />
            <span>@ {s.current_city}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" }}>
            <Package size={11} />
            <span>{s.cargo_type}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)" }}>
            <Clock size={11} />
            <span>ETA {formatDistanceToNow(new Date(s.eta), { addSuffix: true })}</span>
          </div>
          {s.alert_count > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--danger)" }}>
              <BarChart2 size={11} />
              <span>{s.alert_count} alert{s.alert_count > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Progress</span>
            <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>
              {Math.round(s.progress_percent)}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${s.progress_percent}%` }} />
          </div>
        </div>

        {/* Actions */}
        {needsRoute && (
          <button
            className="btn btn-primary"
            style={{ fontSize: "12px", padding: "7px 14px", width: "100%" }}
            onClick={() => setShowModal(true)}
          >
            <Route size={13} />
            Optimize Route
          </button>
        )}
      </div>

      {showModal && (
        <RouteModal
          shipmentId={s.id}
          trackingId={s.tracking_id}
          onClose={() => setShowModal(false)}
          onApplied={() => { setShowModal(false); onRouteApplied?.(); }}
        />
      )}
    </>
  );
}
