import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { adminGate } from "@/lib/admin/gate";
import { listCategoryOptions, listTaxonomyTags } from "@/lib/news-content";

export default async function NewPostPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  return (
    <AdminShell title="New news post" email={gate.session.user.email}>
      <PostForm categoryOptions={listCategoryOptions()} tagOptions={listTaxonomyTags()} />
    </AdminShell>
  );
}
