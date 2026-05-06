"use client";

/**
 * PropertyMapView.tsx
 * Loaded lazily (dynamic import, ssr: false) from BrowsePropertiesPage.
 * Uses Leaflet via react-leaflet.
 * Install: npm i leaflet react-leaflet   +   npm i -D @types/leaflet
 */

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Building2 } from "lucide-react";

// ── Fix Leaflet's broken default icon paths in Next.js ──────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Custom orange numbered icon ──────────────────────────────────────────────
function makeIcon(index: number, highlighted: boolean) {
  const bg = highlighted ? "#c43d06" : "#E8540A";
  const size = highlighted ? 36 : 30;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="${bg}" stroke="white" stroke-width="2.5"/>
      <text x="18" y="23" text-anchor="middle" font-family="system-ui,sans-serif"
            font-size="13" font-weight="700" fill="white">${index + 1}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ── Auto-fit map bounds to markers ──────────────────────────────────────────
function BoundsFitter({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 14);
      return;
    }
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [coords, map]);
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
  properties: any[];
  highlightedId: string | null;
  onPinClick: (id: string) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PropertyMapView({
  properties,
  highlightedId,
  onPinClick,
}: Props) {
  const geoProps = properties.filter(
    (p) => p.location?.location?.latitude && p.location?.location?.longitude,
  );

  const coords: [number, number][] = geoProps.map((p) => [
    p.location.location.latitude,
    p.location.location.longitude,
  ]);

  const center: [number, number] =
    coords.length > 0 ? coords[0] : [27.7172, 85.324];

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full"
      scrollWheelZoom={true}
      style={{ minHeight: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsFitter coords={coords} />

      {geoProps.map((property, i) => {
        const highlighted = highlightedId === property._id;
        const info = property.basic_info;
        const loc = property.location;
        const pricing = (() => {
          const cfg = property?.publishing?.pricing_configuration;
          if (!cfg) return null;
          if (cfg.rent?.active)
            return `${cfg.rent.currency} ${cfg.rent.amount?.toLocaleString()}/mo`;
          if (cfg.sale?.active)
            return `${cfg.sale.currency} ${cfg.sale.amount?.toLocaleString()}`;
          return null;
        })();

        return (
          <Marker
            key={property._id}
            position={[
              property.location.location.latitude,
              property.location.location.longitude,
            ]}
            icon={makeIcon(i, highlighted)}
            eventHandlers={{
              click: () => onPinClick(property._id),
            }}
            zIndexOffset={highlighted ? 1000 : 0}>
            <Popup
              closeButton={false}
              className="property-popup"
              minWidth={200}>
              <div className="p-1 space-y-1">
                <p className="font-bold text-gray-900 text-sm">{info.name}</p>
                <p className="text-xs text-gray-500 flex items-start gap-1">
                  <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-[#E8540A]" />
                  {loc.address_line_1}, {loc.city}
                </p>
                {pricing && (
                  <p className="text-xs font-bold text-[#E8540A]">{pricing}</p>
                )}
                <button
                  onClick={() => onPinClick(property._id)}
                  className="w-full mt-1 text-[11px] font-semibold bg-[#E8540A] text-white rounded-lg py-1 hover:bg-[#d14a09] transition">
                  View Property
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
