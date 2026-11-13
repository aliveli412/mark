import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { adminGate } from "@/lib/admin/gate";

export default async function NewProductPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  return (
    <AdminShell title="New product" email={gate.session.user.email}>
      <ProductForm />
    </AdminShell>
  );
}
