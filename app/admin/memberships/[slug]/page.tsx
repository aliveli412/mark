import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteRosterMemberAction,
  saveMembershipSettingsAction,
  saveRosterMemberAction,
  setMembershipStatusAction,
} from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminGate } from "@/lib/admin/gate";
import {
  getMembershipSettings,
  listMemberships,
  listRoster,
} from "@/lib/data/memberships";
import { formatPence } from "@/lib/format";
import { getMarkSite } from "@/lib/mark-sites";

export default async function AdminLodgeMembershipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const gate = await adminGate();
  if (!gate.ok) return gate.node;
  const { slug } = await params;
  const site = getMarkSite(slug);
  if (!site) notFound();

  const [settings, roster, memberships] = await Promise.all([
    getMembershipSettings(slug),
    listRoster(slug),
    listMemberships(slug),
  ]);

  return (
    <AdminShell title={`${site.brand} membership`} email={gate.session.user.email}>
      <div className="admin-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/admin/memberships">
          All lodges
        </Link>
        <Link className="button secondary" href={`/sites/${slug}/membership`}>
          Public membership page
        </Link>
      </div>

      <section className="admin-card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Dues plans</h2>
        <AdminNavForm className="admin-form" action={saveMembershipSettingsAction}>
          <input type="hidden" name="lodge_slug" value={slug} />
          <div className="row-2">
            <label>
              Monthly (£)
              <input name="monthly" type="number" min="0" step="0.01" defaultValue={(settings.monthly_pence / 100).toFixed(2)} required />
            </label>
            <label>
              Yearly (£)
              <input name="yearly" type="number" min="0" step="0.01" defaultValue={(settings.yearly_pence / 100).toFixed(2)} required />
            </label>
          </div>
          <label>
            Standing order monthly (£)
            <input
              name="standing_order"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(settings.standing_order_pence / 100).toFixed(2)}
              required
            />
          </label>
          <div className="row-2">
            <label>
              Bank name
              <input name="bank_name" defaultValue={settings.bank_name} />
            </label>
            <label>
              Account name
              <input name="bank_account_name" defaultValue={settings.bank_account_name} />
            </label>
          </div>
          <div className="row-2">
            <label>
              Sort code
              <input name="bank_sort_code" defaultValue={settings.bank_sort_code} />
            </label>
            <label>
              Account number
              <input name="bank_account_number" defaultValue={settings.bank_account_number} />
            </label>
          </div>
          <label>
            Standing-order reference hint
            <input name="bank_reference_hint" defaultValue={settings.bank_reference_hint} placeholder="Use membership no as reference" />
          </label>
          <label className="check">
            <input name="active" type="checkbox" defaultChecked={settings.active} />
            Membership payments active
          </label>
          <button type="submit">Save plans</button>
        </AdminNavForm>
      </section>

      <section className="admin-card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Member list (roster)</h2>
        <p>Only people on this list can match and activate paid membership.</p>
        <AdminNavForm className="admin-form" action={saveRosterMemberAction}>
          <input type="hidden" name="lodge_slug" value={slug} />
          <div className="row-2">
            <label>
              Full name
              <input name="full_name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" required />
            </label>
          </div>
          <div className="row-2">
            <label>
              Membership no.
              <input name="membership_no" />
            </label>
            <label>
              Notes
              <input name="notes" />
            </label>
          </div>
          <label className="check">
            <input name="active" type="checkbox" defaultChecked />
            Active on roster
          </label>
          <button type="submit">Add to roster</button>
        </AdminNavForm>

        <table className="admin-table" style={{ marginTop: 18 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>No.</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {roster.map((member) => (
              <tr key={member.id}>
                <td>{member.full_name}</td>
                <td>{member.email}</td>
                <td>{member.membership_no || "—"}</td>
                <td>
                  <span className={`pill ${member.active ? "ok" : "draft"}`}>
                    {member.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <form action={deleteRosterMemberAction}>
                    <input type="hidden" name="id" value={member.id} />
                    <input type="hidden" name="lodge_slug" value={slug} />
                    <button className="danger" type="submit">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {roster.length === 0 ? (
              <tr>
                <td colSpan={5}>No roster members yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 style={{ marginTop: 0 }}>Registrations</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Access code</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {memberships.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.full_name}</strong>
                  <div>{item.email}</div>
                </td>
                <td>{item.plan || "—"}</td>
                <td>
                  <span className={`pill ${item.status === "active" ? "ok" : "draft"}`}>{item.status}</span>
                </td>
                <td>
                  <code>{item.access_code}</code>
                </td>
                <td>
                  <div className="admin-actions">
                    {item.status === "pending_match" ? (
                      <form action={setMembershipStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="lodge_slug" value={slug} />
                        <input type="hidden" name="status" value="matched" />
                        <button type="submit">Mark matched</button>
                      </form>
                    ) : null}
                    {item.status !== "active" ? (
                      <form action={setMembershipStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="lodge_slug" value={slug} />
                        <input type="hidden" name="status" value="active" />
                        <button type="submit">Activate</button>
                      </form>
                    ) : null}
                    {item.status === "active" ? (
                      <form action={setMembershipStatusAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="lodge_slug" value={slug} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button className="danger" type="submit">
                          Cancel
                        </button>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={5}>No membership registrations yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <p style={{ marginBottom: 0, color: "#666" }}>
          Current dues: monthly {formatPence(settings.monthly_pence)} · yearly {formatPence(settings.yearly_pence)} ·
          standing order {formatPence(settings.standing_order_pence)}
        </p>
      </section>
    </AdminShell>
  );
}
