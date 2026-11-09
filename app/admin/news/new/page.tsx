import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewPostPage() {
  const session = await requireAdmin();
  return (
    <AdminShell title="New post" email={session.user.email}>
      <PostForm />
    </AdminShell>
  );
}
