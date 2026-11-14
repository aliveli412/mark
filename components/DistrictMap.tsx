"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import type { Province } from "@/lib/site";
import { provinces as allProvinces } from "@/lib/site";

type InnerProps = { provinces: Province[] };

type DistrictMapProps = {
  provinces?: Province[];
  className?: string;
};

export function DistrictMap({ provinces = allProvinces, className }: DistrictMapProps) {
  const [MapView, setMapView] = useState<ComponentType<InnerProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("@/components/DistrictMapInner").then((mod) => {
      if (!cancelled) setMapView(() => mod.DistrictMapInner);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => provinces, [provinces]);

  return (
    <div className={className ? `district-map ${className}` : "district-map"}>
      <div className="district-map-frame" role="region" aria-label="Grand and District Lodges world map">
        {MapView ? (
          <MapView provinces={items} />
        ) : (
          <div className="district-map-loading" aria-hidden="true">
            Loading map…
          </div>
        )}
      </div>
      <p className="district-map-hint">
        Blue markers open each district page on this portal (e.g. Belgium → /districts/belgium). Use + / − to zoom.
      </p>
    </div>
  );
}
