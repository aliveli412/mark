import { savePostAction } from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import { FeaturedImageField } from "@/components/admin/FeaturedImageField";
import { NewsEditor } from "@/components/admin/NewsEditor";
import type { NewsCategory, NewsPost, NewsTag } from "@/lib/news-content";

function toDateInput(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function PostForm({
  post,
  categoryOptions = [],
  tagOptions = [],
}: {
  post?: NewsPost | null;
  categoryOptions?: Array<NewsCategory & { label: string; depth: number }>;
  tagOptions?: NewsTag[];
}) {
  const selected = new Set((post?.categories || []).map((c) => c.slug));
  const tagsValue = (post?.tags || []).map((t) => t.name).join(", ");

  return (
    <AdminNavForm className="admin-form admin-card news-post-form" action={savePostAction}>
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <fieldset className="admin-fieldset">
        <legend>Article</legend>
        <label>
          Title
          <input name="title" required defaultValue={post?.title ?? ""} />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={post?.slug ?? ""} placeholder="auto from title if blank" />
        </label>
        <div>
          <span className="field-label">Featured image</span>
          <FeaturedImageField initialPath={post?.image ?? ""} />
        </div>
        <label>
          Published date
          <input name="published_at" type="date" defaultValue={toDateInput(post?.published_at)} />
        </label>
        <label>
          Excerpt
          <textarea name="excerpt" rows={3} defaultValue={post?.excerpt ?? ""} />
        </label>
        <div>
          <span className="field-label">Body</span>
          <NewsEditor initialHtml={post?.html ?? ""} />
          <span className="optional">WordPress-style editor. Use Add media to insert images from the library.</span>
        </div>
        <label className="check">
          <input name="published" type="checkbox" defaultChecked={post?.published ?? true} />
          Published
        </label>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Categories</legend>
        <p className="optional" style={{ marginTop: 0 }}>
          From the WordPress Mark News taxonomy ({categoryOptions.length} categories). Select one or more.
        </p>
        <div className="category-picker">
          {categoryOptions.length === 0 ? (
            <p className="muted">No categories loaded. Add content/news-taxonomy.json.</p>
          ) : (
            categoryOptions.map((cat) => (
              <label className="check category-option" key={cat.slug} style={{ paddingLeft: 8 + cat.depth * 14 }}>
                <input
                  type="checkbox"
                  name="categories"
                  value={cat.slug}
                  defaultChecked={selected.has(cat.slug)}
                />
                <span title={cat.label}>{cat.name}</span>
              </label>
            ))
          )}
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Tags</legend>
        <label>
          Tags (comma-separated)
          <input
            name="tags"
            defaultValue={tagsValue}
            list="news-tag-suggestions"
            placeholder="Mark, London, Benevolent…"
          />
          <span className="optional">Used for SEO keywords and article tagging.</span>
        </label>
        <datalist id="news-tag-suggestions">
          {tagOptions.map((tag) => (
            <option value={tag.name} key={tag.slug} />
          ))}
        </datalist>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>SEO</legend>
        <label>
          SEO title
          <input
            name="seo_title"
            defaultValue={post?.seo_title ?? ""}
            placeholder="Defaults to article title"
            maxLength={70}
          />
        </label>
        <label>
          Meta description
          <textarea
            name="seo_description"
            rows={3}
            defaultValue={post?.seo_description ?? ""}
            placeholder="Defaults to excerpt"
            maxLength={160}
          />
        </label>
        <label>
          Focus keywords
          <input
            name="seo_keywords"
            defaultValue={post?.seo_keywords ?? ""}
            placeholder="Comma-separated keywords"
          />
          <span className="optional">Shown as meta keywords; defaults to categories + tags when blank.</span>
        </label>
      </fieldset>

      <button type="submit">Save news</button>
      {post ? (
        <p className="note" style={{ marginTop: 12 }}>
          Public page:{" "}
          <a href={`/news/${post.slug}`} target="_blank" rel="noreferrer">
            /news/{post.slug}
          </a>
        </p>
      ) : null}
    </AdminNavForm>
  );
}
