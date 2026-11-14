"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export type DistrictNavItem = { key: string; title: string; href: string };

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

  const visibleNav = useMemo(() => nav.slice(0, 24), [nav]);

  return (
    <div className="district-site">
      <header className="district-top">
        <div className="district-top-inner">
          <Link className="district-brand" href={homeHref} onClick={() => setOpen(false)}>
            {name}
          </Link>
          <nav className={open ? "district-nav open" : "district-nav"} aria-label={`${name} pages`}>
            <Link href={homeHref} className={isHome ? "active" : undefined} onClick={() => setOpen(false)}>
              Home
            </Link>
            {visibleNav.map((item) => (
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
          </nav>
          <button
            type="button"
            className="district-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </header>
      <div className="wrap district-body">{children}</div>
    </div>
  );
}
