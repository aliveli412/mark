import { saveProductAction } from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import type { ProductRecord } from "@/lib/types";

export function ProductForm({ product }: { product?: ProductRecord | null }) {
  return (
    <AdminNavForm className="admin-form admin-card" action={saveProductAction}>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <label>
        Name
        <input name="name" required defaultValue={product?.name ?? ""} />
      </label>
      <label>
        Slug
        <input name="slug" defaultValue={product?.slug ?? ""} />
      </label>
      <label>
        Price (£)
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={product ? (product.price_pence / 100).toFixed(2) : "0.00"}
        />
      </label>
      <label>
        Image path
        <input name="image_path" defaultValue={product?.image_path ?? "/images/mug.jpg"} />
      </label>
      <label>
        Description
        <textarea name="description" rows={6} defaultValue={product?.description ?? ""} />
      </label>
      <label className="check">
        <input name="active" type="checkbox" defaultChecked={product?.active ?? true} />
        Active in shop
      </label>
      <button type="submit">Save product</button>
    </AdminNavForm>
  );
}
