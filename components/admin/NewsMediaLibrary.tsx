"use client";

import { useCallback, useEffect, useState } from "react";

export type NewsMediaItem = {
  path: string;
  name: string;
  size: number;
  modified_at: string;
};

export function NewsMediaLibrary({
  open,
  onClose,
  onSelect,
  title = "Media library",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: NewsMediaItem) => void;
  title?: string;
}) {
  const [items, setItems] = useState<NewsMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/news/media", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load media.");
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function onUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/news/media", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setItems((prev) => [data.item, ...prev.filter((i) => i.path !== data.item.path)]);
      onSelect(data.item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="media-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="media-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="media-modal-top">
          <h2>{title}</h2>
          <button type="button" className="btn-admin secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="media-modal-toolbar">
          <label className="btn-admin media-upload-btn">
            {uploading ? "Uploading…" : "Upload media"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              hidden
              disabled={uploading}
              onChange={(e) => {
                void onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <button type="button" className="btn-admin secondary" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
          <span className="muted">{items.length} files in /news/media</span>
        </div>

        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading media…</p> : null}

        <div className="media-grid">
          {items.map((item) => (
            <button
              type="button"
              className="media-grid-item"
              key={item.path}
              onClick={() => onSelect(item)}
              title={item.name}
            >
              <img src={item.path} alt="" />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
