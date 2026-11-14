"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { Province } from "@/lib/site";
import "leaflet/dist/leaflet.css";

function FitProvinces({ provinces }: { provinces: Province[] }) {
  const map = useMap();

  useEffect(() => {
    if (!provinces.length) return;
    const lats = provinces.map((item) => item.lat);
    const lngs = provinces.map((item) => item.lng);
    map.fitBounds(
      [
        [Math.min(...lats) - 8, Math.min(...lngs) - 12],
        [Math.max(...lats) + 8, Math.max(...lngs) + 12],
      ],
      { padding: [24, 24], maxZoom: 4 },
    );
  }, [map, provinces]);

  return null;
}

function openCountrySite(url: string) {
  // Full browser navigation to the live district Mark Site (avoids Next soft-nav ending on portal home).
  window.location.assign(url);
}

export function DistrictMapInner({ provinces }: { provinces: Province[] }) {
  return (
    <MapContainer
      className="district-map-leaflet"
      center={[20, 10]}
      zoom={2}
      minZoom={1}
      maxZoom={8}
      scrollWheelZoom={false}
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <FitProvinces provinces={provinces} />
      {provinces.map((province) => (
        <CircleMarker
          key={province.slug}
          center={[province.lat, province.lng]}
          radius={7}
          pathOptions={{
            color: "#1a1f4d",
            fillColor: "#2a2f6d",
            fillOpacity: 0.95,
            weight: 2,
          }}
          eventHandlers={{
            click: () => openCountrySite(province.liveUrl),
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1}>
            {province.name}
          </Tooltip>
          <Popup>
            <strong>{province.name}</strong>
            <br />
            <a
              href={province.liveUrl}
              onClick={(event) => {
                event.preventDefault();
                openCountrySite(province.liveUrl);
              }}
            >
              Open {province.name} site →
            </a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
