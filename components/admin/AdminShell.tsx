"use client";

import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/shop", label: "Shop" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/memberships", label: "Memberships" },
];

export function AdminShell({
  title,
  email,
  children,
}: {
  title: string;
  email: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">
          Mark Admin
          <small>{email}</small>
        </div>
        <nav>
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            const result = await signOutAction();
            window.location.assign(result.next);
          }}
        >
          <button className="btn-admin secondary" type="submit">Sign out</button>
        </form>
        <Link href="/">View site</Link>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <h1>{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
