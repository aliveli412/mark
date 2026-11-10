import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { listAdminEvents, listAdminPosts, listAdminProducts } from "@/lib/data/catalog";

export default async function AdminDashboardPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;

  const [events, posts, products] = await Promise.all([
    listAdminEvents(),
    listAdminPosts(),
    listAdminProducts(),
  ]);

  return (
    <AdminShell title="Dashboard" email={gate.session.user.email}>
      <div className="admin-grid">
        <div className="admin-card stat-card">
          <span>Events</span>
          <strong>{events.length}</strong>
          <Link href="/admin/events">Manage events</Link>
        </div>
        <div className="admin-card stat-card">
          <span>News</span>
          <strong>{posts.length}</strong>
          <Link href="/admin/news">Manage news</Link>
        </div>
        <div className="admin-card stat-card">
          <span>Products</span>
          <strong>{products.length}</strong>
          <Link href="/admin/shop">Manage shop</Link>
        </div>
      </div>
      <div className="admin-card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Next build steps</h2>
        <ol>
          <li>Manage events, news and shop from the links above.</li>
          <li>Mark Sites microsites live under /sites (menu: Mark Sites).</li>
          <li>Shop checkout uses Stripe — add STRIPE_SECRET_KEY locally, then open Admin → Shop.</li>
        </ol>
      </div>
    </AdminShell>
  );
}
