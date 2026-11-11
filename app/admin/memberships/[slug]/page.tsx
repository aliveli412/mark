import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteRosterMemberAction,
  importFwbRosterAction,
  saveMembershipSettingsAction,
  saveRosterMemberAction,
  setMembershipStatusAction,
} from "@/app/admin/actions";
import { AdminNavForm } from "@/components/admin/AdminNavForm";
import { AdminShell } from "@/components/admin/AdminShell";
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
            <button type="submit">Re-import FWB Excel roster ({roster.length || 265})</button>
          </AdminNavForm>
        ) : null}
      </div>

      {isFwb ? (
        <p className="lede" style={{ marginTop: 0 }}>
          Pilot roster source: <code>As of 06-06-2022.xlsx</code> — BrotherNo, name, phones, full address,
          ranks and activity. Matching uses BrotherNo and/or email.
        </p>
      ) : null}

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

        <div style={{ overflowX: "auto", marginTop: 18 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>BrotherNo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>City</th>
                <th>Activity</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {roster.map((member) => {
                const address = [member.address, member.address2, member.postcode].filter(Boolean).join(", ");
                return (
                  <tr key={member.id}>
                    <td>{member.brother_no || member.membership_no || "—"}</td>
                    <td>
                      <strong>
                        {[member.prefix, member.full_name].filter(Boolean).join(" ")}
                      </strong>
                      {member.title || member.initials ? (
                        <div>
                          {[member.title, member.initials].filter(Boolean).join(" · ")}
                        </div>
                      ) : null}
                    </td>
                    <td>{member.email || "—"}</td>
                    <td>{member.mobile || member.home_phone || "—"}</td>
                    <td>{address || "—"}</td>
                    <td>
                      {[member.city, member.county, member.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td>{member.activity || "—"}</td>
                    <td>
                      <span className={`pill ${member.active ? "ok" : "draft"}`}>
                        {member.active ? "Active" : "Ended"}
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
                );
              })}
              {roster.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    {isFwb
                      ? "No roster loaded yet — click “Re-import FWB Excel roster”."
                      : "No roster members yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
