"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { MarkSite } from "@/lib/mark-sites";
import { lodgePath, markSites } from "@/lib/mark-sites";

const MEMBER_MENU: { section: string; label: string }[] = [
  { section: "account", label: "My Account" },
  { section: "record", label: "My lodge record" },
  { section: "meeting", label: "Regular Meetings" },
  { section: "summons", label: "Summons & Minutes" },
  { section: "payments", label: "Payment methods" },
  { section: "addresses", label: "Addresses" },
  { section: "subscriptions", label: "Subscriptions" },
  { section: "tickets", label: "Event Tickets" },
  { section: "password", label: "Password Change" },
];

const LOCAL_ACCESS_CODE = "111111";

type HeaderMember = {
  id: string;
  full_name: string;
  email: string;
  access_code: string;
};

function titleFromPath(site: MarkSite, pathname: string) {
  if (pathname === lodgePath(site.slug) || pathname === `${lodgePath(site.slug)}/`) {
    return site.fullName;
  }
  if (pathname.endsWith("/contact")) return "Contact Us";
  if (pathname.includes("/membership")) return "Members Page";
  for (const group of site.nav) {
    for (const link of group.links) {
      if (pathname.endsWith(`/${group.slug}/${link.slug}`)) return link.label;
    }
  }
  if (pathname.includes("/posts/")) {
    const slug = pathname.split("/posts/")[1];
    return slug ? slug.replace(/-/g, " ") : "Article";
  }
  return site.fullName;
}

function PrimaryNavLinks({
  site,
  onNavigate,
}: {
  site: MarkSite;
  onNavigate: () => void;
}) {
  return (
    <>
      <Link href={lodgePath(site.slug)} onClick={onNavigate}>
        Home
      </Link>
      {site.nav.map((group) => {
        const first = group.links[0];
        const firstHref = first?.href
          ? lodgePath(site.slug, first.href)
          : lodgePath(site.slug, group.slug, first?.slug);
        return (
          <div className="lodge-menu" key={group.slug}>
            <Link href={firstHref} onClick={onNavigate}>
              {group.label}
            </Link>
            {group.links.length > 1 ? (
              <div className="lodge-submenu">
                {group.links.map((link) => (
                  <Link
                    key={link.slug}
                    href={link.href ? lodgePath(site.slug, link.href) : lodgePath(site.slug, group.slug, link.slug)}
                    onClick={onNavigate}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="lodge-menu">
        <span className="lodge-nav-label">MMM Sites</span>
        <div className="lodge-submenu dark">
          {markSites.map((item) => (
            <Link
              key={item.slug}
              className={item.accent ? "accent" : undefined}
              href={lodgePath(item.slug)}
              onClick={onNavigate}
            >
              {item.menuLabel}
            </Link>
          ))}
        </div>
      </div>
      <Link href={lodgePath(site.slug, "contact")} onClick={onNavigate}>
        Contact Us
      </Link>
    </>
  );
}

export function LodgeShell({ site, children }: { site: MarkSite; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState<HeaderMember | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [accessEmail, setAccessEmail] = useState("");
  const [accessCode, setAccessCode] = useState(LOCAL_ACCESS_CODE);
  const [signInPending, setSignInPending] = useState(false);
  const [signInError, setSignInError] = useState("");
  const pageTitle = useMemo(() => titleFromPath(site, pathname), [site, pathname]);
  const isHome = pathname === lodgePath(site.slug) || pathname === `${lodgePath(site.slug)}/`;
  const isMembership = pathname.includes("/membership");
  const membershipHref = lodgePath(site.slug, "membership");

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/membership/session", { cache: "no-store" });
      const data = (await response.json()) as {
        session?: { lodgeSlug?: string } | null;
        membership?: HeaderMember | null;
      };
      if (data.session?.lodgeSlug === site.slug && data.membership) {
        setMember(data.membership);
      } else {
        setMember(null);
      }
    } catch {
      setMember(null);
    } finally {
      setSessionReady(true);
    }
  }, [site.slug]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession, pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setSignInPending(true);
    setSignInError("");
    try {
      const response = await fetch("/api/membership/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodge_slug: site.slug,
          email: accessEmail.trim(),
          access_code: accessCode.trim(),
        }),
      });
      const data = (await response.json()) as { membership?: HeaderMember; error?: string };
      if (!response.ok || !data.membership) {
        setSignInError(data.error || "Could not sign in.");
        setSignInPending(false);
        return;
      }
      setMember(data.membership);
      setOpen(false);
      router.push(membershipHref);
      router.refresh();
    } catch {
      setSignInError("Could not reach the membership service.");
    }
    setSignInPending(false);
  }

  async function signOut() {
    await fetch("/api/membership/session", { method: "DELETE" }).catch(() => null);
    setMember(null);
    setOpen(false);
    if (isMembership) {
      router.push(membershipHref);
      router.refresh();
    }
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className={`lodge-site${isMembership ? " is-membership" : ""}`}>
      <header className="lodge-top">
        <div className="lodge-top-inner">
          <Link className="lodge-brand" href={lodgePath(site.slug)} onClick={closeMenu}>
            {site.brand}
          </Link>
          <nav className="lodge-nav" aria-label={`${site.brand} primary`}>
            <PrimaryNavLinks site={site} onNavigate={closeMenu} />
          </nav>
          <div className="lodge-tools">
            <Link href="/shop/basket" aria-label="Basket" onClick={closeMenu}>
              Basket
            </Link>
            <Link href="/search" aria-label="Search" onClick={closeMenu}>
              Search
            </Link>
            <button
              type="button"
              className="lodge-burger"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="lodge-drawer"
              onClick={() => setOpen((value) => !value)}
            >
              <span aria-hidden="true">{open ? "✕" : "☰"}</span>
            </button>
          </div>

          {open ? (
            <div id="lodge-drawer" className="lodge-drawer" role="dialog" aria-label="Site and members menu">
              <section className="lodge-drawer-members" aria-label="Members">
                <h2>Members</h2>
                {!sessionReady ? <p className="lodge-drawer-note">Checking sign-in…</p> : null}

                {sessionReady && member ? (
                  <>
                    <p className="lodge-drawer-hello">
                      Signed in as <strong>{member.full_name || member.email}</strong>
                    </p>
                    <nav className="lodge-drawer-member-nav" aria-label="Members account">
                      {MEMBER_MENU.map((item) => (
                        <Link
                          key={item.section}
                          href={`${membershipHref}?section=${item.section}`}
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button type="button" className="lodge-drawer-logout" onClick={() => void signOut()}>
                        Log out
                      </button>
                    </nav>
                  </>
                ) : null}

                {sessionReady && !member ? (
                  <>
                    <p className="lodge-drawer-note">Sign in for summons, meeting, dues, and your lodge record.</p>
                    <form className="lodge-drawer-signin" onSubmit={(event) => void signIn(event)}>
                      <label>
                        Email
                        <input
                          type="email"
                          autoComplete="email"
                          required
                          value={accessEmail}
                          onChange={(event) => setAccessEmail(event.target.value)}
                          placeholder="you@example.com"
                        />
                      </label>
                      <label>
                        Access code
                        <input
                          type="text"
                          autoComplete="one-time-code"
                          required
                          value={accessCode}
                          onChange={(event) => setAccessCode(event.target.value)}
                        />
                      </label>
                      {signInError ? <p className="lodge-drawer-error">{signInError}</p> : null}
                      <button className="btn" type="submit" disabled={signInPending}>
                        {signInPending ? "Signing in…" : "Sign in"}
                      </button>
                    </form>
                    <div className="lodge-drawer-guest-links">
                      <Link href={`${membershipHref}?mode=register`} onClick={closeMenu}>
                        Register
                      </Link>
                      <Link href={membershipHref} onClick={closeMenu}>
                        Members Page
                      </Link>
                    </div>
                  </>
                ) : null}
              </section>

              <nav className="lodge-drawer-site-nav" aria-label={`${site.brand} mobile`}>
                <h2>Menu</h2>
                <PrimaryNavLinks site={site} onNavigate={closeMenu} />
              </nav>
            </div>
          ) : null}
        </div>
      </header>

      {open ? <button type="button" className="lodge-drawer-backdrop" aria-label="Close menu" onClick={closeMenu} /> : null}

      <div className="lodge-titlebar">
        <div className="wrap lodge-titlebar-row">
          <div>{isHome ? site.fullName : pageTitle}</div>
          {!isHome ? (
            <nav className="lodge-crumbs" aria-label="Breadcrumb">
              <Link href={lodgePath(site.slug)}>Home</Link>
              <span>›</span>
              <span>{pageTitle}</span>
            </nav>
          ) : null}
        </div>
      </div>

      <div className={`wrap lodge-layout${isMembership ? " lodge-layout-membership" : ""}`}>
        {isMembership ? null : (
          <aside className="lodge-side">
            {site.nav.map((group) => {
              const first = group.links[0];
              const firstHref = first?.href
                ? lodgePath(site.slug, first.href)
                : lodgePath(site.slug, group.slug, first?.slug);
              return (
                <div key={group.slug}>
                  <Link
                    className={
                      pathname.includes(`/${group.slug}`) || (first?.href && pathname.includes(`/${first.href}`))
                        ? "active"
                        : undefined
                    }
                    href={firstHref}
                  >
                    {group.label}
                  </Link>
                  <ul>
                    {group.links.map((link) => {
                      const href = link.href
                        ? lodgePath(site.slug, link.href)
                        : lodgePath(site.slug, group.slug, link.slug);
                      const active = link.href
                        ? pathname.includes(`/${link.href}`)
                        : pathname.endsWith(`/${link.slug}`);
                      return (
                        <li key={link.slug}>
                          <Link className={active ? "active" : undefined} href={href}>
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </aside>
        )}
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
            {site.phone ? <p>WhatsApp / Telegram: {site.phone}</p> : null}
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
