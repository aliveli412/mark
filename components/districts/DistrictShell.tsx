"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export type DistrictNavItem = { key: string; title: string; href: string };

const PRIMARY_KEYS = [
  "history",
  "welcome",
  "about",
  "lodge-directory",
  "lodges",
  "meetings",
  "calendar",
  "calendar-2",
  "gallery",
  "photo-gallery",
  "contact",
  "contact-us",
  "executive",
  "meet-the-team",
  "news",
  "blog",
];

function pickPrimary(nav: DistrictNavItem[]) {
  const picked: DistrictNavItem[] = [];
  for (const key of PRIMARY_KEYS) {
    const item = nav.find((entry) => entry.key === key || entry.key.endsWith(`/${key}`));
    if (item && !picked.some((p) => p.key === item.key)) picked.push(item);
    if (picked.length >= 6) break;
  }
  if (picked.length < 4) {
    for (const item of nav) {
      if (picked.some((p) => p.key === item.key)) continue;
      picked.push(item);
      if (picked.length >= 5) break;
    }
  }
  return picked;
}

export function DistrictShell({
  slug,
  name,
  nav,
  children,
}: {
  slug: string;
  name: string;
  nav: DistrictNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const homeHref = `/districts/${slug}`;
  const isHome = pathname === homeHref || pathname === `${homeHref}/`;
  const primary = useMemo(() => pickPrimary(nav), [nav]);

  return (
    <div className="district-site">
      <header className="district-top">
        <div className="district-top-inner">
          <Link className="district-brand" href={homeHref} onClick={() => setOpen(false)}>
            {name}
          </Link>
          <nav className="district-nav-primary" aria-label={`${name} primary`}>
            <Link href={homeHref} className={isHome ? "active" : undefined}>
              Home
            </Link>
            {primary.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : undefined}
              >
                {item.title}
              </Link>
            ))}
            <Link href="/grand-lodges">All districts</Link>
          </nav>
          <button
            type="button"
            className="district-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
            <span className="district-burger-label">Pages</span>
          </button>
        </div>
        {open ? (
          <nav className="district-nav-panel" aria-label={`${name} all pages`}>
            <div className="district-nav-panel-inner">
              <Link href={homeHref} className={isHome ? "active" : undefined} onClick={() => setOpen(false)}>
                Home
              </Link>
              {nav.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
              <Link href="/grand-lodges" onClick={() => setOpen(false)}>
                ← All districts
              </Link>
            </div>
          </nav>
        ) : null}
      </header>
      <div className="wrap district-body">{children}</div>
    </div>
  );
}
