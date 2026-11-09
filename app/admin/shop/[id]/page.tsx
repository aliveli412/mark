import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminProduct } from "@/lib/data/catalog";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();
  return (
    <AdminShell title="Edit product" email={session.user.email}>
      <ProductForm product={product} />
    </AdminShell>
  );
}
