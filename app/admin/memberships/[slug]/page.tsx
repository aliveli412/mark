import Link from "next/link";
import { notFound } from "next/navigation";
import {
  importFwbRosterAction,
  importRosterExcelAction,
  saveMembershipSettingsAction,
  saveRosterMemberAction,
  setMembershipStatusAction,
} from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { RosterMembersTable } from "@/components/admin/RosterMembersTable";
import { adminGate } from "@/lib/admin/gate";
import {
  FWB_LODGE_SLUG,
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
  const isFwb = slug === FWB_LODGE_SLUG;

  return (
    <AdminShell title={`${site.brand} membership`} email={gate.session.user.email}>
      <div className="admin-actions" style={{ marginBottom: 16 }}>
        <Link className="button secondary" href="/admin/memberships">
          All lodges
        </Link>
        <Link className="button secondary" href={`/sites/${slug}/membership`}>
          Public membership page
        </Link>
        {isFwb ? (
          <AdminNavForm action={importFwbRosterAction}>
            <button type="submit">Re-import bundled FWB Excel ({roster.length || 265})</button>
          </AdminNavForm>
        ) : null}
      </div>

      <section className="admin-card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Import Excel roster</h2>
        <p>
          Imports every FWB column: BrotherNo, names, phones, full address, email, start/end dates, unit /
          provincial / grand ranks (ids, prefixes, start dates), and Activity.
          {settings.roster_source ? (
            <>
              {" "}
              Current source: <code>{settings.roster_source}</code> ({roster.length} members).
            </>
          ) : null}
        </p>
        <AdminNavForm className="admin-form" action={importRosterExcelAction}>
          <input type="hidden" name="lodge_slug" value={slug} />
          <label>
            Excel file (.xlsx)
            <input name="file" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required />
          </label>
          <button type="submit">Import / replace roster</button>
        </AdminNavForm>
        {isFwb ? (
          <p className="note" style={{ marginTop: 12 }}>
            Pilot lodge. Bundled file: <code>As of 06-06-2022.xlsx</code>. Matching uses BrotherNo and/or email.
          </p>
        ) : null}
      </section>

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
            <input name="bank_reference_hint" defaultValue={settings.bank_reference_hint} placeholder="Use BrotherNo as reference" />
          </label>
          <label className="check">
            <input name="active" type="checkbox" defaultChecked={settings.active} />
            Membership payments active
          </label>
          <button type="submit">Save plans</button>
        </AdminNavForm>
      </section>

      <section className="admin-card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Member list (roster) · {roster.length}</h2>
        <AdminNavForm className="admin-form" action={saveRosterMemberAction}>
          <input type="hidden" name="lodge_slug" value={slug} />
          <div className="row-2">
            <label>
              BrotherNo
              <input name="brother_no" />
            </label>
            <label>
              Prefix
              <input name="prefix" placeholder="Bro. / W.Bro." />
            </label>
          </div>
          <div className="row-2">
            <label>
              Given names
              <input name="given_names" />
            </label>
            <label>
              Surname
              <input name="surname" required />
            </label>
          </div>
          <div className="row-2">
            <label>
              Title
              <input name="title" placeholder="Mr" />
            </label>
            <label>
              Initials
              <input name="initials" />
            </label>
          </div>
          <div className="row-2">
            <label>
              Email
              <input name="email" type="email" />
            </label>
            <label>
              Mobile
              <input name="mobile" />
            </label>
          </div>
          <label>
            Home phone
            <input name="home_phone" />
          </label>
          <label>
            Address
            <input name="address" />
          </label>
          <div className="row-2">
            <label>
              Address 2
              <input name="address2" />
            </label>
            <label>
              Address 3
              <input name="address3" />
            </label>
          </div>
          <div className="row-2">
            <label>
              City
              <input name="city" />
            </label>
            <label>
              County
              <input name="county" />
            </label>
          </div>
          <div className="row-2">
            <label>
              Postcode
              <input name="postcode" />
            </label>
            <label>
              Country
              <input name="country" />
            </label>
          </div>
          <div className="row-2">
            <label>
              Activity
              <input name="activity" placeholder="Founder / Joined" />
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
          <button type="submit">Add member</button>
        </AdminNavForm>

        <div style={{ marginTop: 18 }}>
          <RosterMembersTable
            lodgeSlug={slug}
            roster={roster}
            emptyHint={
              isFwb
                ? "No roster loaded yet — click “Re-import bundled FWB Excel” or upload the lodge file."
                : "No roster members yet."
            }
          />
        </div>
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
                  {item.membership_no ? <div>No. {item.membership_no}</div> : null}
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
