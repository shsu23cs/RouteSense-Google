import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accentColor?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
}

export default function KPICard({
  title, value, subtitle, icon, accentColor = "var(--cyan)", trend, trendLabel,
}: KPICardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "var(--success)" : trend === "down" ? "var(--danger)" : "var(--text-muted)";

  return (
    <div className="glass animate-fade-in-up" style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      {/* Glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: accentColor, opacity: 0.07, filter: "blur(20px)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: "10px",
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accentColor,
        }}>
          {icon}
        </div>
      </div>

      <div style={{ fontSize: "30px", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: "6px" }}>
        {value}
      </div>

      {subtitle && (
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: trend ? "8px" : 0 }}>
          {subtitle}
        </p>
      )}

      {trend && trendLabel && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: trendColor }}>
          <TrendIcon size={12} />
          {trendLabel}
        </div>
      )}
    </div>
  );
}
