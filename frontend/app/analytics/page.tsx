"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart3, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const COLORS = ["#00d4ff","#7c3aed","#f59e0b","#ef4444","#10b981","#3b82f6","#ec4899","#8b5cf6"];

interface TimeData   { date: string;    disruptions: number; }
interface TypeData   { type: string;    count: number; }
interface CarrierData { carrier: string; disruptions: number; }
interface RegionData  { region: string;  count: number; }

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; fill?: string; }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,22,40,0.96)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "10px", padding: "10px 14px" }}>
      {label && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: "14px", fontWeight: 700, color: p.fill ?? "#00d4ff" }}>
          {p.value} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-muted)" }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "16px" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeData,    setTimeData]    = useState<TimeData[]>([]);
  const [typeData,    setTypeData]    = useState<TypeData[]>([]);
  const [carrierData, setCarrierData] = useState<CarrierData[]>([]);
  const [regionData,  setRegionData]  = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [time, type, carrier, region] = await Promise.all([
        axios.get(`${API}/api/analytics/disruptions-over-time`),
        axios.get(`${API}/api/analytics/by-type`),
        axios.get(`${API}/api/analytics/by-carrier`),
        axios.get(`${API}/api/analytics/by-region`),
      ]);
      setTimeData(time.data);
      setTypeData(type.data);
      setCarrierData(carrier.data);
      setRegionData(region.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalDisruptions = typeData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="animate-fade-in-up">
      <header style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Deep-dive into disruption patterns, carrier performance, and regional risks.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchAll}><RefreshCw size={14} />Refresh</button>
      </header>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Disruptions Logged",  value: totalDisruptions,        color: "var(--danger)"  },
          { label: "Disruption Types Detected", value: typeData.length,         color: "var(--warning)" },
          { label: "Regions Affected",          value: regionData.length,       color: "var(--cyan)"    },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px" }}>
            <BarChart3 size={24} color={color} style={{ opacity: 0.7 }} />
            <div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>{label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}>{loading ? "…" : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* 1. Disruptions over time */}
        <div style={{ gridColumn: "1 / -1" }}>
          <ChartCard title="Disruptions Over Time" subtitle="Alert count per day — last 14 days">
            {loading ? <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div> : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={timeData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#4a617a", fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fill: "#4a617a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ stroke: "rgba(0,212,255,0.15)", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="disruptions" name="disruptions" stroke="#00d4ff" strokeWidth={2}
                    fill="url(#grad1)" dot={false} activeDot={{ r: 4, fill: "#00d4ff" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* 2. By type (Pie) */}
        <ChartCard title="Disruptions by Type" subtitle="Breakdown of incident categories">
          {loading ? <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div> : (
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={typeData} dataKey="count" nameKey="type" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90} paddingAngle={3} strokeWidth={0}>
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {typeData.map((d, i) => (
                  <div key={d.type} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", flex: 1, textTransform: "capitalize" }}>
                      {d.type.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: COLORS[i % COLORS.length] }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* 3. By carrier (horizontal bar) */}
        <ChartCard title="Disruptions by Carrier" subtitle="Active alert count per logistics carrier">
          {loading ? <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div> : (
            carrierData.length === 0 ? (
              <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                No active disruptions by carrier
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={carrierData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <XAxis type="number" tick={{ fill: "#4a617a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="carrier" type="category" tick={{ fill: "#7a93b4", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="disruptions" name="disruptions" radius={[0, 6, 6, 0]}>
                    {carrierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          )}
        </ChartCard>

        {/* 4. By region (vertical bar) */}
        <div style={{ gridColumn: "1 / -1" }}>
          <ChartCard title="Disruptions by Region" subtitle="Geographic concentration of supply chain incidents">
            {loading ? <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading…</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={regionData} margin={{ top: 0, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="region" tick={{ fill: "#7a93b4", fontSize: 11 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "#4a617a", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" name="alerts" radius={[6, 6, 0, 0]}>
                    {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

      </div>
    </div>
  );
}
