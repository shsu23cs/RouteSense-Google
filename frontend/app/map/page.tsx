"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Map as MapIcon, Ship, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import DisruptionBadge from "../components/DisruptionBadge";
import { formatDistanceToNow } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Dynamic import to disable SSR for Leaflet
const LiveMap = dynamic(() => import("../components/LiveMap"), { ssr: false, loading: () => (
  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(5,13,26,0.8)", borderRadius: "16px", color: "var(--text-muted)", fontSize: "14px" }}>
    Loading map…
  </div>
) });

interface Shipment {
  id: number;
  tracking_id: string;
  origin_city: string;
  origin_country: string;
  dest_city: string;
  dest_country: string;
  current_city: string;
  current_lat: number;
  current_lon: number;
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  carrier: string;
  cargo_type: string;
  status: string;
  disruption_level: string;
  eta: string;
  progress_percent: number;
  alert_count?: number;
}

const STATUS_COLORS: Record<string, string> = {
  in_transit: "var(--cyan)", delivered: "var(--success)",
  delayed: "var(--warning)", disrupted: "var(--danger)",
};

export default function MapPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchShipments = async () => {
    try {
      const res = await axios.get(`${API}/api/shipments/`);
      setShipments(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchShipments();
    const iv = setInterval(fetchShipments, 15000);
    return () => clearInterval(iv);
  }, []);

  const displayed = filter === "all" ? shipments : shipments.filter(s => s.status === filter);

  const counts = {
    all:        shipments.length,
    in_transit: shipments.filter(s => s.status === "in_transit").length,
    delayed:    shipments.filter(s => s.status === "delayed").length,
    disrupted:  shipments.filter(s => s.status === "disrupted").length,
  };

  return (
    <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", gap: "16px" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Live Network Map</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Real-time global shipment tracking with route visualization.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchShipments}><RefreshCw size={14} />Refresh</button>
      </header>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
        <Layers size={13} color="var(--text-muted)" />
        {(["all", "in_transit", "delayed", "disrupted"] as const).map(f => {
          const color = f === "all" ? "var(--cyan)" : STATUS_COLORS[f] ?? "var(--text-muted)";
          const active = filter === f;
          return (
            <button key={f} id={`map-filter-${f}`} onClick={() => setFilter(f)} style={{
              padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              border: "1px solid", transition: "all 0.15s", textTransform: "capitalize",
              background: active ? `${color}22` : "transparent",
              borderColor: active ? `${color}55` : "var(--border)",
              color: active ? color : "var(--text-muted)",
            }}>
              {f.replace("_", " ")} {f !== "all" && `(${counts[f]})`}
              {f === "all" && ` (${counts.all})`}
            </button>
          );
        })}
      </div>

      {/* Main layout: map + side panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", minHeight: 0 }}>
          {loading ? (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(5,13,26,0.5)", color: "var(--text-muted)", fontSize: "14px" }}>
              <MapIcon size={20} style={{ marginRight: "8px" }} /> Loading shipments…
            </div>
          ) : (
            <LiveMap shipments={displayed} height="100%" onMarkerClick={(s) => setSelected(s)} />
          )}
        </div>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto" }}>
          {/* Selected shipment detail */}
          {selected && (
            <div className="glass animate-fade-in-up" style={{ padding: "16px", borderLeft: `3px solid ${STATUS_COLORS[selected.status] ?? "var(--cyan)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--cyan)" }}>{selected.tracking_id}</p>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                {selected.origin_city} → {selected.dest_city}
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                <span className={`badge badge-${selected.status}`}>{selected.status.replace("_", " ")}</span>
                <DisruptionBadge level={selected.disruption_level} />
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>📦 {selected.cargo_type} · {selected.carrier}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                📍 {selected.current_city}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                ETA {formatDistanceToNow(new Date(selected.eta), { addSuffix: true })}
              </p>
              <div className="progress-track" style={{ marginTop: "10px" }}>
                <div className="progress-fill" style={{ width: `${selected.progress_percent}%` }} />
              </div>
            </div>
          )}

          {/* Shipment list */}
          <div className="glass" style={{ padding: "14px", flex: 1, overflowY: "auto" }}>
            <p className="section-title" style={{ marginBottom: "10px" }}>
              {displayed.length} shipment{displayed.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {displayed.map(s => {
                const color = STATUS_COLORS[s.status] ?? "var(--text-muted)";
                return (
                  <button key={s.id} onClick={() => setSelected(s)} style={{
                    background: selected?.id === s.id ? `${color}12` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${selected?.id === s.id ? `${color}40` : "var(--border)"}`,
                    borderRadius: "10px", padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{s.tracking_id}</span>
                      {(s.alert_count ?? 0) > 0 && (
                        <span style={{ marginLeft: "auto", fontSize: "10px", color: "var(--danger)", display: "flex", alignItems: "center", gap: "3px" }}>
                          <AlertTriangle size={9} />{s.alert_count}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", paddingLeft: "15px" }}>
                      {s.origin_city} → {s.dest_city}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="glass" style={{ padding: "12px 14px" }}>
            <p className="section-title" style={{ marginBottom: "8px" }}>Legend</p>
            {[
              { label: "In Transit", color: "var(--cyan)"    },
              { label: "Delivered",  color: "var(--success)" },
              { label: "Delayed",    color: "var(--warning)" },
              { label: "Disrupted",  color: "var(--danger)"  },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{label}</span>
              </div>
            ))}
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
              <Ship size={10} style={{ display: "inline", marginRight: "4px" }} />
              Click a marker to view details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
