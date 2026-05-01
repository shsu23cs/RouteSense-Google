"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DataPoint {
  date: string;
  disruptions: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,22,40,0.95)", border: "1px solid rgba(0,212,255,0.2)",
      borderRadius: "10px", padding: "10px 14px",
    }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "16px", fontWeight: 700, color: "#00d4ff" }}>
        {payload[0].value} <span style={{ fontSize: "11px", fontWeight: 400 }}>disruptions</span>
      </p>
    </div>
  );
}

interface DisruptionChartProps {
  height?: number;
}

export default function DisruptionChart({ height = 240 }: DisruptionChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/analytics/disruptions-over-time`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: "13px" }}>
        Loading chart…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="disruptionGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#4a617a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fill: "#4a617a", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(0,212,255,0.15)", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="disruptions"
          stroke="#00d4ff"
          strokeWidth={2}
          fill="url(#disruptionGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#00d4ff", stroke: "rgba(0,212,255,0.3)", strokeWidth: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
