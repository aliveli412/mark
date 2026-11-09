"use client";

import { useMemo, useState } from "react";
import { provinces } from "@/lib/site";

export function ProvinceDirectory() {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return provinces;
    return provinces.filter((province) => province.name.toLowerCase().includes(needle));
  }, [query]);

  return (
    <div>
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
          <a key={province.name} href={province.href} target="_blank" rel="noreferrer">
            {province.name}
          </a>
        ))}
      </div>
      {matches.length === 0 ? <p>No lodge matches that name.</p> : null}
    </div>
  );
}
