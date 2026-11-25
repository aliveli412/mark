import Link from "next/link";
import { deletePostAction } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { formatNewsDate, listAdminNewsPosts, newsDisplayDate } from "@/lib/news-content";

export default async function AdminNewsPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const posts = listAdminNewsPosts();

  return (
    <AdminShell title="News" email={gate.session.user.email}>
      <div className="admin-actions" style={{ marginBottom: 16 }}>
        <Link className="button" href="/admin/news/new">
          New post
        </Link>
        <Link className="button secondary" href="/news">
          View news
        </Link>
      </div>
      <p className="note" style={{ marginTop: 0 }}>
        Mark main-site news from the live import. Add, edit or unpublish articles here — changes update{" "}
        <code>content/news.json</code> and the public <Link href="/news">/news</Link> pages.
      </p>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5}>No news posts yet. Import with <code>npm run import:news</code> or create one.</td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <strong>{post.title}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>
                      /news/{post.slug}
                    </div>
                  </td>
                  <td>{post.primary_category?.name || "—"}</td>
                  <td>{formatNewsDate(newsDisplayDate(post)) || "—"}</td>
                  <td>
                    <span className={`pill ${post.published ? "ok" : "draft"}`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <Link className="button secondary" href={`/admin/news/${post.id}`}>
                        Edit
                      </Link>
                      <form action={deletePostAction}>
                        <input type="hidden" name="id" value={post.id} />
                        <button className="danger" type="submit">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
