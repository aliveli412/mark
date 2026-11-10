import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { listAdminOrders } from "@/lib/data/orders";
import { formatPence } from "@/lib/format";

export default async function AdminOrdersPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const orders = await listAdminOrders();

  return (
    <AdminShell title="Orders" email={gate.session.user.email}>
      <div className="admin-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/admin/shop">
          Products
        </Link>
      </div>
      <div className="admin-card">
        {orders.length === 0 ? (
          <p>No Stripe orders yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Email</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.created_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}</td>
                  <td>{order.email}</td>
                  <td>{formatPence(order.total_pence)}</td>
                  <td>
                    <span className={`pill ${order.status === "paid" ? "ok" : "draft"}`}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
