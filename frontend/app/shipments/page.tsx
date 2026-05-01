"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Search, Filter, RefreshCw, Ship, Package } from "lucide-react";
import ShipmentCard from "../components/ShipmentCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  alert_count: number;
}

const STATUSES = ["", "in_transit", "delayed", "disrupted", "delivered"];
const DISRUPTION_LEVELS = ["", "none", "low", "medium", "high", "critical"];

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [disruption, setDisruption] = useState("");
  const [carrier, setCarrier] = useState("");
  const [carriers, setCarriers] = useState<string[]>([]);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)    params.set("search", search);
      if (status)    params.set("status", status);
      if (disruption) params.set("disruption_level", disruption);
      if (carrier)   params.set("carrier", carrier);
      const res = await axios.get(`${API}/api/shipments/?${params}`);
      setShipments(res.data);

      // Extract unique carriers for filter dropdown
      if (!carriers.length) {
        const uniqueCarriers = [...new Set(res.data.map((s: Shipment) => s.carrier))] as string[];
        setCarriers(uniqueCarriers.sort());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, status, disruption, carrier, carriers.length]);

  useEffect(() => {
    const t = setTimeout(fetchShipments, 300);
    return () => clearTimeout(t);
  }, [fetchShipments]);

  const counts = {
    total:     shipments.length,
    disrupted: shipments.filter(s => s.status === "disrupted").length,
    delayed:   shipments.filter(s => s.status === "delayed").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <header style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Shipments</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Track and manage all active shipments in real-time.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchShipments} title="Refresh">
          <RefreshCw size={14} />
          Refresh
        </button>
      </header>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total",     value: counts.total,     color: "var(--cyan)"    },
          { label: "Disrupted", value: counts.disrupted, color: "var(--danger)"  },
          { label: "Delayed",   value: counts.delayed,   color: "var(--warning)" },
          { label: "Delivered", value: counts.delivered, color: "var(--success)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color, lineHeight: 1 }}>{loading ? "…" : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <Filter size={14} color="var(--text-muted)" />

          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              className="input"
              placeholder="Search tracking ID, city, carrier…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: "32px" }}
              id="shipment-search"
            />
          </div>

          {/* Status filter */}
          <select className="input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: "150px" }} id="status-filter">
            {STATUSES.map(s => (
              <option key={s} value={s}>{s ? s.replace("_", " ") : "All Statuses"}</option>
            ))}
          </select>

          {/* Disruption filter */}
          <select className="input" value={disruption} onChange={e => setDisruption(e.target.value)} style={{ width: "170px" }} id="disruption-filter">
            {DISRUPTION_LEVELS.map(d => (
              <option key={d} value={d}>{d ? d : "All Disruptions"}</option>
            ))}
          </select>

          {/* Carrier filter */}
          <select className="input" value={carrier} onChange={e => setCarrier(e.target.value)} style={{ width: "160px" }} id="carrier-filter">
            <option value="">All Carriers</option>
            {carriers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {(search || status || disruption || carrier) && (
            <button className="btn btn-ghost" onClick={() => { setSearch(""); setStatus(""); setDisruption(""); setCarrier(""); }} style={{ fontSize: "12px" }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {loading ? "Loading…" : `${shipments.length} shipment${shipments.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Shipment grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass" style={{ padding: "18px 20px", height: "180px",
              background: "rgba(255,255,255,0.02)", animation: "pulse-border 2s infinite" }} />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <div className="glass" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Package size={40} style={{ margin: "0 auto 16px", display: "block", color: "var(--text-muted)", opacity: 0.4 }} />
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
            No shipments found
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
          {shipments.map(s => (
            <ShipmentCard key={s.id} shipment={s} onRouteApplied={fetchShipments} />
          ))}
        </div>
      )}

      {/* Empty hint if no shipments at all */}
      {!loading && shipments.length === 0 && !search && !status && !disruption && !carrier && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Ship size={24} style={{ margin: "0 auto 8px", display: "block", color: "var(--cyan)", opacity: 0.4 }} />
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Make sure the backend is running on {API}
          </p>
        </div>
      )}
    </div>
  );
}
