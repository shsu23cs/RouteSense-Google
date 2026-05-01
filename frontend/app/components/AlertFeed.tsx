"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LiveEvent {
  type: string;
  alert_id?: number;
  tracking_id?: string;
  severity?: string;
  alert_type?: string;
  message?: string;
  region?: string;
  created_at?: string;
}

const SEV_COLOR: Record<string, string> = {
  critical: "#ef4444", high: "#ef4444", medium: "#f59e0b", low: "#3b82f6", info: "#00d4ff",
};

export default function AlertFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connect = () => {
      const es = new EventSource(`${API}/api/events`);
      esRef.current = es;

      es.onopen = () => setConnected(true);
      es.onmessage = (e) => {
        try {
          const data: LiveEvent = JSON.parse(e.data);
          if (data.type === "connected") return;
          setEvents((prev) => [data, ...prev].slice(0, 20));
        } catch {}
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
        setTimeout(connect, 5000); // reconnect
      };
    };

    connect();
    return () => esRef.current?.close();
  }, []);

  return (
    <div className="glass" style={{ padding: "18px 20px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <h3 style={{ fontWeight: 700, fontSize: "15px" }}>Live Alert Feed</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px",
          color: connected ? "var(--success)" : "var(--danger)" }}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? "Connected" : "Reconnecting…"}
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)", fontSize: "13px" }}>
          <AlertTriangle size={24} style={{ margin: "0 auto 8px", display: "block", opacity: 0.4 }} />
          Monitoring network… alerts will appear here
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
          {events.map((ev, i) => (
            <div
              key={i}
              className="animate-slide-in"
              style={{
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "10px",
                borderLeft: `3px solid ${SEV_COLOR[ev.severity ?? "info"] ?? "var(--cyan)"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span className={`badge badge-${ev.severity}`} style={{ fontSize: "10px" }}>
                  {ev.severity}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {ev.created_at ? formatDistanceToNow(new Date(ev.created_at), { addSuffix: true }) : "just now"}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.4 }}>
                <strong style={{ color: "var(--cyan)" }}>{ev.tracking_id}</strong> — {ev.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
