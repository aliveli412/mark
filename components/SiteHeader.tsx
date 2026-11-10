"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { lodgePath, markSites } from "@/lib/mark-sites";

const markLinks = [
  { href: "/what-is-mark-degree", label: "What is Mark degree?" },
  { href: "/why-join", label: "Why join?" },
  { href: "/regalia", label: "Regalia" },
  { href: "/grand-lodges", label: "Grand Lodges" },
  { href: "/links", label: "Links" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const markActive = pathname.startsWith("/mark-degree") || markLinks.some((link) => pathname === link.href);
  const sitesActive = pathname.startsWith("/sites");

  if (pathname.startsWith("/admin") || pathname.startsWith("/sites")) return null;

  return (
    <header className="site-header">
      <div className="header-row">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <img src="/images/jewel.jpg" alt="" width={36} height={36} />
          Mark Master Masons
        </Link>
        <nav className={open ? "nav open" : "nav"} aria-label="Primary">
          <Link className={pathname === "/" ? "active" : ""} href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <div className="menu">
            <Link className={markActive ? "active" : ""} href="/mark-degree" onClick={() => setOpen(false)}>
              Mark Degree
            </Link>
            <div className="submenu">
              {markLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <Link className={pathname === "/calendar" ? "active" : ""} href="/calendar" onClick={() => setOpen(false)}>
            Calendar
          </Link>
          <Link className={pathname.startsWith("/blog") ? "active" : ""} href="/blog" onClick={() => setOpen(false)}>
            Blog
          </Link>
          <div className="menu">
            <Link className={sitesActive ? "active" : ""} href={lodgePath(markSites[0].slug)} onClick={() => setOpen(false)}>
              Mark Sites <span className="nav-caret" aria-hidden="true" />
            </Link>
            <div className="submenu sites-menu">
              {markSites.map((site) => (
                <Link
                  key={site.slug}
                  className={site.accent ? "accent" : undefined}
                  href={lodgePath(site.slug)}
                  onClick={() => setOpen(false)}
                >
                  {site.menuLabel}
                </Link>
              ))}
            </div>
          </div>
          <Link className={pathname.startsWith("/shop") ? "active" : ""} href="/shop" onClick={() => setOpen(false)}>
            Shop
          </Link>
        </nav>
        <div className="tools">
          <Link className="tool" href="/search" aria-label="Search" onClick={() => setOpen(false)}>
            <SearchIcon />
          </Link>
          <Link className="tool" href="/shop/basket" aria-label="Basket" onClick={() => setOpen(false)}>
            <BagIcon />
            {count > 0 ? <span className="badge">{count}</span> : null}
          </Link>
          <button className="tool burger" type="button" aria-label="Menu" onClick={() => setOpen((value) => !value)}>
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </svg>
  );
}
