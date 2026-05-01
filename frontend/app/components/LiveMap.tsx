"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

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
  alert_count?: number;
}

interface LiveMapProps {
  shipments: Shipment[];
  height?: string;
  onMarkerClick?: (shipment: Shipment) => void;
}

const STATUS_COLORS: Record<string, string> = {
  in_transit: "#00d4ff",
  delivered:  "#10b981",
  delayed:    "#f59e0b",
  disrupted:  "#ef4444",
};

export default function LiveMap({ shipments, height = "100%", onMarkerClick }: LiveMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Check again inside the async callback to handle React Strict Mode double-invocations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (mapRef.current || !containerRef.current || (containerRef.current as any)._leaflet_id) return;

      // Fix default marker icon path issue in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
      });

      mapRef.current = map;

      // Dark tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      renderShipments(L, map, shipments, onMarkerClick);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when shipments change
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      const map = mapRef.current!;
      // Clear existing layers (except tile layer)
      map.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });
      renderShipments(L, map, shipments, onMarkerClick);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipments]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height, borderRadius: "16px", overflow: "hidden" }}
      className="animate-glow"
    />
  );
}

function renderShipments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  shipments: Shipment[],
  onMarkerClick?: (s: Shipment) => void,
) {
  shipments.forEach((s) => {
    const color = STATUS_COLORS[s.status] ?? "#00d4ff";
    const radius = s.disruption_level === "critical" ? 9 :
                   s.disruption_level === "high"     ? 7 : 6;

    // Route polyline: origin → current → destination
    const routeLine = L.polyline(
      [
        [s.origin_lat,  s.origin_lon],
        [s.current_lat, s.current_lon],
        [s.dest_lat,    s.dest_lon],
      ],
      { color, weight: 1.5, opacity: 0.35, dashArray: "5 6" }
    ).addTo(map);

    // Current position marker (filled circle)
    const marker = L.circleMarker([s.current_lat, s.current_lon], {
      radius,
      fillColor: color,
      color,
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.85,
    }).addTo(map);

    // Origin dot (small hollow)
    L.circleMarker([s.origin_lat, s.origin_lon], {
      radius: 3,
      fillColor: "transparent",
      color,
      weight: 1.5,
      opacity: 0.4,
      fillOpacity: 0,
    }).addTo(map);

    // Destination dot (small hollow)
    L.circleMarker([s.dest_lat, s.dest_lon], {
      radius: 3.5,
      fillColor: color,
      color,
      weight: 1.5,
      opacity: 0.6,
      fillOpacity: 0.3,
    }).addTo(map);

    // Popup
    const etaDate = new Date(s.eta).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif;min-width:200px;background:#0a1628;color:#e8f4ff;padding:4px 2px;">
        <div style="font-weight:700;font-size:14px;color:#00d4ff;margin-bottom:6px;">${s.tracking_id}</div>
        <div style="font-size:12px;color:#7a93b4;margin-bottom:2px;">${s.origin_city} → ${s.dest_city}</div>
        <div style="font-size:11px;color:#7a93b4;margin-bottom:2px;">📦 ${s.cargo_type} · ${s.carrier}</div>
        <div style="font-size:11px;margin-top:6px;">
          <span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:999px;font-weight:600;font-size:10px;text-transform:uppercase;">
            ${s.status.replace("_"," ")}
          </span>
        </div>
        <div style="font-size:11px;color:#4a617a;margin-top:6px;">ETA ${etaDate} · ${Math.round(s.progress_percent)}% complete</div>
      </div>
    `, {
      className: "leaflet-dark-popup",
      maxWidth: 240,
    });

    if (onMarkerClick) {
      marker.on("click", () => onMarkerClick(s));
    }

    // Keep the route line referenced to prevent GC
    void routeLine;
  });
}
