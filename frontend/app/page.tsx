"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Ship, AlertTriangle, CheckCircle2, Clock, Globe, ArrowUpRight } from "lucide-react";
import KPICard from "./components/KPICard";
import AlertFeed from "./components/AlertFeed";
import DisruptionChart from "./components/DisruptionChart";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Analytics {
  total_shipments: number;
  in_transit: number;
  delivered: number;
  delayed: number;
  disrupted: number;
  on_time_rate: number;
  active_alerts: number;
  avg_delay_hours: number;
}

interface RegionData {
  region: string;
  count: number;
}

const REGION_COLORS = [
  "#00d4ff","#7c3aed","#f59e0b","#ef4444","#10b981",
  "#3b82f6","#ec4899","#8b5cf6",
];

function RegionTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px", padding: "8px 12px" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: 700, color: "#00d4ff" }}>{payload[0].value} alerts</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Analytics | null>(null);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, regionRes] = await Promise.all([
          axios.get(`${API}/api/analytics/summary`),
          axios.get(`${API}/api/analytics/by-region`),
        ]);
        setStats(statsRes.data);
        setRegions(regionRes.data.slice(0, 7));
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade-in-up">
      <header style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Network Overview</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Real-time supply chain resilience and disruption monitoring.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/map" className="btn btn-primary">
            <Globe size={15} />
            Live Network Map
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
        marginBottom: "32px"
      }}>
        <KPICard
          title="Total Shipments"
          value={loading ? "…" : stats?.total_shipments ?? 0}
          subtitle="Active in network"
          icon={<Ship size={20} />}
          accentColor="var(--cyan)"
        />
        <KPICard
          title="On-Time Rate"
          value={loading ? "…" : `${stats?.on_time_rate}%`}
          subtitle="Against original ETA"
          icon={<CheckCircle2 size={20} />}
          accentColor="var(--success)"
          trend={stats && stats.on_time_rate > 90 ? "up" : "down"}
          trendLabel={stats && stats.on_time_rate > 90 ? "Healthy" : "Below Target"}
        />
        <KPICard
          title="Active Disruptions"
          value={loading ? "…" : stats?.disrupted ?? 0}
          subtitle="Critical bottlenecks"
          icon={<AlertTriangle size={20} />}
          accentColor="var(--danger)"
          trend={stats && stats.disrupted > 0 ? "up" : "flat"}
          trendLabel={stats && stats.disrupted > 5 ? "Critical" : "Manageable"}
        />
        <KPICard
          title="Avg. Delay"
          value={loading ? "…" : `${stats?.avg_delay_hours}h`}
          subtitle="Per affected unit"
          icon={<Clock size={20} />}
          accentColor="var(--warning)"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Main Content Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Disruption trend chart */}
          <div className="glass" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "16px" }}>Disruption Trend</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Last 14 days</p>
              </div>
              <Link href="/analytics" style={{ fontSize: "12px", color: "var(--cyan)", display: "flex", alignItems: "center", gap: "4px" }}>
                Full Report <ArrowUpRight size={14} />
              </Link>
            </div>
            <DisruptionChart height={220} />
          </div>

          {/* Regional Risk distribution */}
          <div className="glass" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "16px" }}>Regional Risk Distribution</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Active alerts by region</p>
              </div>
              <Link href="/analytics" style={{ fontSize: "12px", color: "var(--cyan)", display: "flex", alignItems: "center", gap: "4px" }}>
                Details <ArrowUpRight size={14} />
              </Link>
            </div>
            {regions.length === 0 ? (
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-muted)", fontSize: "13px" }}>
                {loading ? "Loading…" : "No regional data yet"}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={regions} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: "#4a617a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="region" type="category" tick={{ fill: "#7a93b4", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<RegionTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {regions.map((_, i) => (
                      <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <AlertFeed />

          <div className="glass" style={{ padding: "20px" }}>
            <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>System Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <StatusItem label="Disruption Engine" status="active" />
              <StatusItem label="Route Optimizer"   status="active" />
              <StatusItem label="Gemini AI Analysis" status="active" />
              <StatusItem label="Port Data Feed"    status="syncing" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="glass" style={{ padding: "20px" }}>
            <h3 style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>Fleet Snapshot</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "In Transit", value: stats?.in_transit ?? 0, color: "var(--cyan)" },
                { label: "Delivered",  value: stats?.delivered  ?? 0, color: "var(--success)" },
                { label: "Delayed",    value: stats?.delayed    ?? 0, color: "var(--warning)" },
                { label: "Disrupted",  value: stats?.disrupted  ?? 0, color: "var(--danger)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color }}>{loading ? "…" : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: "active" | "syncing" | "error" }) {
  const colors = { active: "#10b981", syncing: "#3b82f6", error: "#ef4444" };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors[status],
          animation: status === "syncing" ? "pulse-border 2s infinite" : "none" }} />
        <span style={{ fontSize: "11px", fontWeight: 600, color: colors[status], textTransform: "uppercase" }}>
          {status}
        </span>
      </div>
    </div>
  );
}
