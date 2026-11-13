import Link from "next/link";
import { deletePostAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { listAdminPosts } from "@/lib/data/catalog";

export default async function AdminNewsPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const posts = await listAdminPosts();

  return (
    <AdminShell title="News" email={gate.session.user.email}>
      <div className="admin-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/admin/news/new">New post</Link>
        <Link className="button secondary" href="/blog">View blog</Link>
      </div>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.slug}</td>
                <td>
                  <span className={`pill ${post.published ? "ok" : "draft"}`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="admin-actions">
                    <Link className="button secondary" href={`/admin/news/${post.id}`}>Edit</Link>
                    <form action={deletePostAction}>
                      <input type="hidden" name="id" value={post.id} />
                      <button className="danger" type="submit">Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
