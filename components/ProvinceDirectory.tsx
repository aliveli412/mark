"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DistrictMap } from "@/components/DistrictMap";
import { provinces } from "@/lib/site";

export function ProvinceDirectory({ showMap = true }: { showMap?: boolean }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return provinces;
    return provinces.filter((province) => province.name.toLowerCase().includes(needle));
  }, [query]);

  return (
    <div className="province-directory">
      {showMap ? <DistrictMap provinces={matches} /> : null}

      <div className="finder">
        <input
          type="search"
          value={query}
          placeholder="Find a Grand or District Lodge"
          aria-label="Find a Grand or District Lodge"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="province-grid">
        {matches.map((province) => (
          <Link key={province.slug} href={province.href}>
            {province.name}
          </Link>
        ))}
      </div>
      {matches.length === 0 ? <p>No lodge matches that name.</p> : null}
    </div>
  );
}
