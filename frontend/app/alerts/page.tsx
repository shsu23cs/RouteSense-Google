"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { RefreshCw, Bell, Filter, CheckCircle, AlertTriangle } from "lucide-react";
import AlertCard from "../components/AlertCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

const SEVERITY_FILTERS = ["all", "critical", "high", "medium", "low", "info"];
const SEV_COLORS: Record<string, string> = {
  critical: "#ef4444", high: "#ef4444", medium: "#f59e0b",
  low: "#3b82f6", info: "#00d4ff", all: "var(--text-secondary)",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showResolved, setShowResolved] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (severityFilter !== "all") params.set("severity", severityFilter);
      if (showResolved) params.set("include_resolved", "true");
      const res = await axios.get(`${API}/api/alerts/?${params}`);
      setAlerts(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [severityFilter, showResolved]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResolved = (id: number) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_resolved: true } : a));

  const displayed       = alerts.filter(a => showResolved || !a.is_resolved);
  const unresolvedCount = alerts.filter(a => !a.is_resolved).length;
  const criticalCount   = alerts.filter(a => a.severity === "critical" && !a.is_resolved).length;
  const resolvedCount   = alerts.filter(a => a.is_resolved).length;

  return (
    <div className="animate-fade-in-up">
      <header style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Alert Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Monitor and resolve active supply chain disruption alerts.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchAlerts}><RefreshCw size={14} />Refresh</button>
      </header>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Critical",   value: criticalCount,   icon: <AlertTriangle size={20} color="#ef4444" />, color: "#ef4444" },
          { label: "Unresolved", value: unresolvedCount, icon: <Bell size={20} color="var(--cyan)" />,      color: "var(--cyan)" },
          { label: "Resolved",   value: resolvedCount,   icon: <CheckCircle size={20} color="var(--success)" />, color: "var(--success)" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "12px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {icon}
            </div>
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}>{loading ? "…" : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass" style={{ padding: "14px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <Filter size={13} color="var(--text-muted)" />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {SEVERITY_FILTERS.map(sev => (
            <button key={sev} id={`filter-${sev}`} onClick={() => setSeverityFilter(sev)} style={{
              padding: "5px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              border: "1px solid", textTransform: "capitalize",
              background: severityFilter === sev ? `${SEV_COLORS[sev]}22` : "transparent",
              borderColor: severityFilter === sev ? `${SEV_COLORS[sev]}55` : "var(--border)",
              color: severityFilter === sev ? SEV_COLORS[sev] : "var(--text-muted)", transition: "all 0.15s",
            }}>{sev}</button>
          ))}
        </div>
        <label style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)} style={{ accentColor: "var(--cyan)" }} id="show-resolved" />
          Show resolved
        </label>
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
        {loading ? "Loading…" : `${displayed.length} alert${displayed.length !== 1 ? "s" : ""}`}
      </p>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass" style={{ height: "110px", background: "rgba(255,255,255,0.02)" }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="glass" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Bell size={40} style={{ margin: "0 auto 16px", display: "block", color: "var(--text-muted)", opacity: 0.3 }} />
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>No alerts found</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {severityFilter !== "all" ? `No ${severityFilter} severity alerts.` : "All clear — no active alerts."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {displayed.map(alert => <AlertCard key={alert.id} alert={alert} onResolved={handleResolved} />)}
        </div>
      )}
    </div>
  );
}
