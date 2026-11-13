import Link from "next/link";
import { deleteProductAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { listAdminProducts } from "@/lib/data/catalog";
import { formatPence } from "@/lib/format";

export default async function AdminShopPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const products = await listAdminProducts();

  return (
    <AdminShell title="Shop" email={gate.session.user.email}>
      <p className="lede" style={{ marginTop: 0 }}>
        Add products here → they appear on <Link href="/shop">/shop</Link> when Active.
        Checkout uses Stripe; paid orders show under{" "}
        <Link href="/admin/orders">Orders</Link>.
      </p>
      <div className="admin-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/admin/shop/new">New product</Link>
        <Link className="button secondary" href="/admin/orders">Orders</Link>
        <Link className="button secondary" href="/shop">View shop</Link>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <div>{product.slug}</div>
                </td>
                <td>{formatPence(product.price_pence)}</td>
                <td>
                  <span className={`pill ${product.active ? "ok" : "draft"}`}>
                    {product.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <Link className="button secondary" href={`/admin/shop/${product.id}`}>Edit</Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button className="danger" type="submit">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
