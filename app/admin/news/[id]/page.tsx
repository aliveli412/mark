import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminPost } from "@/lib/data/catalog";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) notFound();
  return (
    <AdminShell title="Edit post" email={session.user.email}>
      <PostForm post={post} />
    </AdminShell>
  );
}
