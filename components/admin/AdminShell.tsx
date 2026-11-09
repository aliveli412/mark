import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";
import { usingSampleData } from "@/lib/data/catalog";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/news", label: "News" },
  { href: "/admin/shop", label: "Shop" },
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
  const sample = usingSampleData();
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
        <form action={signOutAction}>
          <button className="btn-admin secondary" type="submit">Sign out</button>
        </form>
        <Link href="/">View site</Link>
      </aside>
      <main className="admin-main">
        {sample ? (
          <div className="banner-sample">
            Running on sample data until Supabase is connected. Changes stay on this server only.
          </div>
        ) : null}
        <div className="admin-top">
          <h1>{title}</h1>
        </div>
        {children}
      </main>
    </div>
  );
}
