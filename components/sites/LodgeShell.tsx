"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { MarkSite } from "@/lib/mark-sites";
import { lodgePath, markSites } from "@/lib/mark-sites";

export function LodgeShell({ site, children }: { site: MarkSite; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="lodge-site">
      <header className="lodge-top">
        <div className="lodge-top-inner">
          <Link className="lodge-brand" href={lodgePath(site.slug)} onClick={() => setOpen(false)}>
            {site.brand}
          </Link>
          <nav className={open ? "lodge-nav open" : "lodge-nav"} aria-label={`${site.brand} primary`}>
            <Link href={lodgePath(site.slug)} onClick={() => setOpen(false)}>
              Home
            </Link>
            {site.nav.map((group) => (
              <div className="lodge-menu" key={group.slug}>
                <Link href={lodgePath(site.slug, group.slug, group.links?.[0]?.slug)} onClick={() => setOpen(false)}>
                  {group.label}
                </Link>
                {group.links && group.links.length > 1 ? (
                  <div className="lodge-submenu">
                    {group.links.map((link) => (
                      <Link
                        key={link.slug}
                        href={lodgePath(site.slug, group.slug, link.slug)}
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="lodge-menu">
              <span className="lodge-nav-label">MMM Sites</span>
              <div className="lodge-submenu dark">
                {markSites.map((item) => (
                  <Link
                    key={item.slug}
                    className={item.accent ? "accent" : undefined}
                    href={lodgePath(item.slug)}
                    onClick={() => setOpen(false)}
                  >
                    {item.menuLabel}
                  </Link>
                ))}
              </div>
            </div>
            <Link href={lodgePath(site.slug, "contact")} onClick={() => setOpen(false)}>
              Contact Us
            </Link>
          </nav>
          <div className="lodge-tools">
            <Link href="/shop/basket" aria-label="Basket">
              Basket
            </Link>
            <Link href="/search" aria-label="Search">
              Search
            </Link>
            <button type="button" aria-label="Menu" onClick={() => setOpen((value) => !value)}>
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <div className="lodge-titlebar">
        <div className="wrap">{site.fullName}</div>
      </div>

      <div className="wrap lodge-layout">
        <aside className="lodge-side">
          {site.nav.map((group) => (
            <div key={group.slug}>
              <Link
                className={pathname.includes(`/${group.slug}`) ? "active" : undefined}
                href={lodgePath(site.slug, group.slug, group.links?.[0]?.slug)}
              >
                {group.label}
              </Link>
              {group.links ? (
                <ul>
                  {group.links.map((link) => (
                    <li key={link.slug}>
                      <Link
                        className={pathname.endsWith(`/${link.slug}`) ? "active" : undefined}
                        href={lodgePath(site.slug, group.slug, link.slug)}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </aside>
        <div className="lodge-main">{children}</div>
      </div>

      <footer className="lodge-footer">
        <div className="wrap lodge-footer-grid">
          <section>
            <form action="/search" method="get">
              <label className="sr-only" htmlFor={`search-${site.slug}`}>
                Search
              </label>
              <input id={`search-${site.slug}`} name="q" placeholder="Search…" />
            </form>
            <p className="lodge-app-note">Get our lodge app now!</p>
          </section>
          <section>
            <h2>{site.fullName}</h2>
            {site.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>WhatsApp / Telegram: {site.phone}</p>
          </section>
          <section>
            <h2>Regular Meetings</h2>
            <p>{site.meetingsBlurb}</p>
          </section>
          <section>
            <h2>Guaranteed SAFE Checkout</h2>
            <p>Pay secure by Stripe on the Mark Portal shop.</p>
            <Link href="/shop">Visit shop →</Link>
          </section>
        </div>
        <div className="wrap lodge-legal">
          <Link href="/">← Mark Master Masons portal</Link>
          <span>© {site.fullName}</span>
        </div>
      </footer>
    </div>
  );
}
