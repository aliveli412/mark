import { savePostAction } from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import type { PostRecord } from "@/lib/types";

export function PostForm({ post }: { post?: PostRecord | null }) {
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
        Excerpt
        <textarea name="excerpt" rows={3} defaultValue={post?.excerpt ?? ""} />
      </label>
      <label>
        Body
        <textarea name="body" rows={12} defaultValue={post?.body ?? ""} />
      </label>
      <label className="check">
        <input name="published" type="checkbox" defaultChecked={post?.published ?? true} />
        Published
      </label>
      <button type="submit">Save news</button>
    </AdminNavForm>
  );
}
