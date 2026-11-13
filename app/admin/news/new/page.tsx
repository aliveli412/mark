import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { adminGate } from "@/lib/admin/gate";

export default async function NewPostPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  return (
    <AdminShell title="New post" email={gate.session.user.email}>
      <PostForm />
    </AdminShell>
  );
}
