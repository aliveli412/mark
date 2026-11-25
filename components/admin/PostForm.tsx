import { savePostAction } from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import type { NewsPost } from "@/lib/news-content";

function toDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function PostForm({ post }: { post?: NewsPost | null }) {
  const category = post?.primary_category?.name ?? "";
  return (
    <AdminNavForm className="admin-form admin-card" action={savePostAction}>
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <label>
        Title
        <input name="title" required defaultValue={post?.title ?? ""} />
      </label>
      <label>
        Slug
        <input name="slug" defaultValue={post?.slug ?? ""} placeholder="auto from title if blank" />
      </label>
      <label>
        Category
        <input name="category" defaultValue={category} placeholder="e.g. Benevolent" />
      </label>
      <label>
        Image path
        <input
          name="image"
          defaultValue={post?.image ?? ""}
          placeholder="/news/media/….jpg or /images/…"
        />
      </label>
      <label>
        Published date
        <input name="published_at" type="date" defaultValue={toDateInput(post?.published_at)} />
      </label>
      <label>
        Excerpt
        <textarea name="excerpt" rows={3} defaultValue={post?.excerpt ?? ""} />
      </label>
      <label>
        Body (HTML)
        <textarea name="body" rows={16} defaultValue={post?.html ?? ""} />
        <span className="optional">Supports HTML from the Mark News import. Images should use /news/media/… paths.</span>
      </label>
      <label className="check">
        <input name="published" type="checkbox" defaultChecked={post?.published ?? true} />
        Published
      </label>
      <button type="submit">Save news</button>
      {post ? (
        <p className="note" style={{ marginTop: 12 }}>
          Public page: <a href={`/news/${post.slug}`} target="_blank" rel="noreferrer">/news/{post.slug}</a>
        </p>
      ) : null}
    </AdminNavForm>
  );
}
