"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageBanner } from "@/components/PageBanner";
import { posts } from "@/lib/posts";
import { searchEntries } from "@/lib/site";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const entries = useMemo(
    () => [
      ...searchEntries,
      ...posts.map((post) => ({
        href: `/blog/${post.slug}`,
        title: post.title,
        text: post.excerpt,
      })),
    ],
    [],
  );
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? entries.filter((entry) => `${entry.title} ${entry.text}`.toLowerCase().includes(needle))
    : entries;

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
