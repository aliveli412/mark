import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { FWB_LODGE_SLUG } from "@/lib/data/memberships";
import { markSites } from "@/lib/mark-sites";

export default async function AdminMembershipsIndexPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;

  const sites = [...markSites].sort((a, b) => {
    if (a.slug === FWB_LODGE_SLUG) return -1;
    if (b.slug === FWB_LODGE_SLUG) return 1;
    return a.menuLabel.localeCompare(b.menuLabel);
  });

  return (
    <AdminShell title="Lodge memberships" email={gate.session.user.email}>
      <p className="lede" style={{ marginTop: 0 }}>
        Pilot lodge is <strong>Freemasons Without Borders (FWB)</strong> with the full Excel roster
        (BrotherNo → Activity). Other lodges can use the same flow after their lists are loaded.
      </p>
      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Lodge site</th>
              <th>Slug</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => {
              const pilot = site.slug === FWB_LODGE_SLUG;
              return (
                <tr key={site.slug}>
                  <td>
                    <strong>{site.fullName}</strong>
                    {pilot ? <div><span className="pill ok">Pilot</span></div> : null}
                  </td>
                  <td>{site.slug}</td>
                  <td>
                    <div className="admin-actions">
                      <Link className="button" href={`/admin/memberships/${site.slug}`}>
                        Manage
                      </Link>
                      <Link className="button secondary" href={`/sites/${site.slug}/membership`}>
                        View page
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
