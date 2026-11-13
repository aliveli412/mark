"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageBanner } from "@/components/PageBanner";
import { searchEntries } from "@/lib/site";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return searchEntries;
    return searchEntries.filter((entry) => `${entry.title} ${entry.text}`.toLowerCase().includes(needle));
  }, [needle]);

  return (
    <>
      <PageBanner title="Search" />
      <div className="wrap page search-page">
        <input
          type="search"
          value={query}
          placeholder="search"
          aria-label="Search"
          onChange={(event) => setQuery(event.target.value)}
        />
        <div style={{ marginTop: 18 }}>
          {matches.map((entry) => (
            <Link className="search-hit" key={entry.href} href={entry.href}>
              <strong>{entry.title}</strong>
              <span>{entry.text}</span>
            </Link>
          ))}
          {matches.length === 0 ? <p>Nothing matches that search.</p> : null}
        </div>
      </div>
    </>
  );
}
