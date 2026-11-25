"use client";

import { useState } from "react";
import { NewsMediaLibrary } from "@/components/admin/NewsMediaLibrary";

export function FeaturedImageField({ initialPath = "" }: { initialPath?: string }) {
  const [path, setPath] = useState(initialPath);
  const [open, setOpen] = useState(false);

  return (
    <div className="featured-image-field">
      <input type="hidden" name="image" value={path} />
      <div className="featured-image-preview">
        {path ? <img src={path} alt="" /> : <div className="featured-image-empty">No featured image</div>}
      </div>
      <div className="admin-actions">
        <button type="button" className="button" onClick={() => setOpen(true)}>
          {path ? "Change image" : "Set featured image"}
        </button>
        {path ? (
          <button type="button" className="button secondary" onClick={() => setPath("")}>
            Remove
          </button>
        ) : null}
      </div>
      <span className="optional">Choose from the media library or upload a new image.</span>
      <NewsMediaLibrary
        open={open}
        title="Featured image"
        onClose={() => setOpen(false)}
        onSelect={(item) => {
          setPath(item.path);
          setOpen(false);
        }}
      />
    </div>
  );
}
