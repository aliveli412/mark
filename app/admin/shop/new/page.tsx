import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewProductPage() {
  const session = await requireAdmin();
  return (
    <AdminShell title="New product" email={session.user.email}>
      <ProductForm />
    </AdminShell>
  );
}
