import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import { markSites } from "@/lib/mark-sites";

export default async function AdminMembershipsIndexPage() {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;

  return (
    <AdminShell title="Lodge memberships" email={gate.session.user.email}>
      <p className="lede" style={{ marginTop: 0 }}>
        Manage each Mark Site’s member roster, dues plans, and activation requests.
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
            {markSites.map((site) => (
              <tr key={site.slug}>
                <td>
                  <strong>{site.fullName}</strong>
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
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
