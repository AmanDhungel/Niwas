"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

const PropertyMap = ({ data }: { data: any }) => {
  const lat = data?.location?.location?.latitude;
  const lng = data?.location?.location?.longitude;
  const address = data?.location?.address_line_1 || "Property Location";

  const position: [number, number] = lat && lng ? [lat, lng] : [0, 0];

  if (!lat || !lng) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-500 italic">
        Coordinates not available for this property.
      </div>
    );
  }

  return (
    <MapContainer
      center={position}
      zoom={15}
      scrollWheelZoom={false}
      className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={customIcon}>
        <Popup className="font-sans">
          <div className="text-sm font-bold text-[#ff6b35]">
            {data.basic_info?.name}
          </div>
          <div className="text-xs text-gray-600">{address}</div>
        </Popup>
      </Marker>
      <ChangeView center={position} />
      <MapResizer />
    </MapContainer>
  );
};

export default PropertyMap;
