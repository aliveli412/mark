import { AdminShell } from "@/components/admin/AdminShell";
import { PostForm } from "@/components/admin/PostForm";
import { adminGate } from "@/lib/admin/gate";
import { getAdminNewsPost, listCategoryOptions, listTaxonomyTags } from "@/lib/news-content";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const { id } = await params;
  const post = getAdminNewsPost(decodeURIComponent(id));
  if (!post) {
    return (
      <AdminShell title="Post not found" email={gate.session.user.email}>
        <p>No news post with that id.</p>
      </AdminShell>
    );
  }
  return (
    <AdminShell title={`Edit: ${post.title}`} email={gate.session.user.email}>
      <PostForm
        post={post}
        categoryOptions={listCategoryOptions()}
        tagOptions={listTaxonomyTags()}
      />
    </AdminShell>
  );
}
