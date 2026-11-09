import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminEvents, listAdminPosts, listAdminProducts } from "@/lib/data/catalog";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const [events, posts, products] = await Promise.all([
    listAdminEvents(),
    listAdminPosts(),
    listAdminProducts(),
  ]);

  return (
    <AdminShell title="Dashboard" email={session.user.email}>
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
          <li>Connect Supabase and run <code>supabase/schema.sql</code>.</li>
          <li>Create an Auth user and set <code>profiles.role</code> to <code>super_admin</code>.</li>
          <li>Add lodge pages and Stripe dues after the content admin is live.</li>
        </ol>
      </div>
    </AdminShell>
  );
}
