import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminGate } from "@/lib/admin/gate";
import { getAdminProduct } from "@/lib/data/catalog";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) {
    return (
      <AdminShell title="Product not found" email={gate.session.user.email}>
        <p>No product with that id.</p>
      </AdminShell>
    );
  }
  return (
    <AdminShell title="Edit product" email={gate.session.user.email}>
      <ProductForm product={product} />
    </AdminShell>
  );
}
