import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { adminGate } from "@/lib/admin/gate";
import { getAdminPost } from "@/lib/data/catalog";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const { id } = await params;
  const post = await getAdminPost(id);
  if (!post) {
    return (
      <AdminShell title="Post not found" email={gate.session.user.email}>
        <p>No post with that id.</p>
      </AdminShell>
    );
  }
  return (
    <AdminShell title="Edit post" email={gate.session.user.email}>
      <PostForm post={post} />
    </AdminShell>
  );
}
