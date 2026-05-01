import React from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle, ShieldAlert } from "lucide-react";

const CONFIG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  none:     { label: "None",     icon: <CheckCircle size={9} />,   cls: "badge-none"     },
  low:      { label: "Low",      icon: <Info size={9} />,          cls: "badge-low"      },
  medium:   { label: "Medium",   icon: <AlertCircle size={9} />,   cls: "badge-medium"   },
  high:     { label: "High",     icon: <AlertTriangle size={9} />, cls: "badge-high"     },
  critical: { label: "Critical", icon: <ShieldAlert size={9} />,   cls: "badge-critical" },
};

interface DisruptionBadgeProps {
  level: string;
  className?: string;
}

export default function DisruptionBadge({ level, className = "" }: DisruptionBadgeProps) {
  const cfg = CONFIG[level?.toLowerCase()] ?? CONFIG.none;
  return (
    <span className={`badge ${cfg.cls} ${className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
