"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ship,
  Map,
  Bell,
  BarChart3,
  Zap,
  Activity,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Ship },
  { href: "/map", label: "Live Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "240px",
        height: "100vh",
        background: "rgba(5,13,26,0.95)",
        borderRight: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <img src="/routesense_logo.png" style={{ width: 34, height: 34, borderRadius: "10px" }} alt="Logo" />
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
              RouteSense
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>
              AI LOGISTICS ENGINE
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px" }}>
          <span style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: "999px", padding: "2px 8px", fontSize: "11px", color: "#10b981"
          }}>
            <Activity size={9} style={{ animation: "glow-pulse 2s infinite" }} />
            LIVE
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "12px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
        <p className="section-title" style={{ padding: "8px 8px 6px", fontSize: "10px" }}>NAVIGATION</p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px", borderRadius: "10px", fontSize: "13.5px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--cyan)" : "var(--text-secondary)",
                background: active ? "rgba(0,212,255,0.08)" : "transparent",
                border: active ? "1px solid rgba(0,212,255,0.15)" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Powered by Gemini AI
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
          v1.0.0 · Google Hackathon 2024
        </div>
      </div>
    </aside>
  );
}
