"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPence } from "@/lib/format";
import type {
  LodgeMembership,
  LodgeMembershipPayment,
  LodgeMembershipSettings,
  LodgeRosterMember,
  MembershipDuesSummary,
  MembershipPlan,
} from "@/lib/types";

/** Temporary shared local access code — keep in sync with lib/data/memberships.ts */
const LOCAL_ACCESS_CODE = "111111";

type DashboardPayload = {
  membership: LodgeMembership;
  roster: LodgeRosterMember | null;
  payments: LodgeMembershipPayment[];
  dues: MembershipDuesSummary;
};

type DashSection = "overview" | "record" | "dues";

function display(value: string | null | undefined) {
  const text = (value ?? "").trim();
  return text || "—";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function YearStatus({ status }: { status: string }) {
  return <span className={`member-year-status status-${status}`}>{statusLabel(status)}</span>;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="member-field">
      <dt>{label}</dt>
      <dd>{display(value)}</dd>
    </div>
  );
}

function MemberHome({
  data,
  settings,
  pending,
  stripeReady,
  error,
  message,
  onPay,
  onStandingOrder,
  onSignOut,
  onRefresh,
}: {
  data: DashboardPayload;
  settings: LodgeMembershipSettings;
  pending: boolean;
  stripeReady: boolean | null;
  error: string;
  message: string;
  onPay: (plan: MembershipPlan) => void;
  onStandingOrder: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
}) {
  const { membership, roster, payments, dues } = data;
  const [section, setSection] = useState<DashSection>("overview");
  const title = roster ? [roster.prefix, roster.full_name].filter(Boolean).join(" ") : membership.full_name;
  const brotherNo = roster?.brother_no || membership.membership_no;
  const current = dues.years.find((row) => row.year === dues.current_year) ?? dues.years[0];
  const canPay =
    membership.status === "matched" || membership.status === "active" || membership.status === "past_due";
  const showBank =
    Boolean(settings.bank_account_number || settings.bank_sort_code) &&
    (membership.plan === "standing_order" || dues.total_remaining_pence > 0);
  const initials = useMemo(() => {
    const parts = (roster?.full_name || membership.full_name).split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase() || "M";
  }, [roster, membership.full_name]);

  return (
    <div className="member-dash">
      <aside className="member-dash-side" aria-label="User dashboard">
        <div className="member-dash-user">
          <div className="member-dash-avatar" aria-hidden>
            {initials}
          </div>
          <div>
            <p className="member-dash-side-kicker">User dashboard</p>
            <strong>{title}</strong>
            <p>{brotherNo ? `BrotherNo ${brotherNo}` : membership.email}</p>
            <span className={`member-year-status status-${membership.status === "active" ? "paid" : membership.status === "matched" ? "partial" : "due"}`}>
              {statusLabel(membership.status)}
            </span>
          </div>
        </div>

        <nav className="member-dash-nav">
          <button type="button" className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}>
            Overview
          </button>
          <button type="button" className={section === "record" ? "active" : ""} onClick={() => setSection("record")}>
            My lodge record
          </button>
          <button type="button" className={section === "dues" ? "active" : ""} onClick={() => setSection("dues")}>
            Dues & payments
          </button>
        </nav>

        <div className="member-dash-side-meta">
          <p>
            Access code <code>{membership.access_code}</code>
          </p>
          <p>{membership.email}</p>
          <div className="member-dash-side-actions">
            <button type="button" className="member-text-btn" onClick={onRefresh}>
              Refresh
            </button>
            <button type="button" className="member-text-btn" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="member-dash-main">
        {message ? <p className="membership-note">{message}</p> : null}
        {membership.status === "pending_match" ? (
          <p className="membership-note">An admin still needs to match you to the lodge roster.</p>
        ) : null}

        {section === "overview" ? (
          <section className="member-dash-panel">
            <header className="member-dash-panel-head">
              <h2>Overview</h2>
              <p>Your dues balance and a snapshot of your lodge record.</p>
            </header>

            <div className="member-metrics" aria-label="Dues summary">
              <div>
                <p className="member-metric-label">Paid to date</p>
                <p className="member-metric-value">{formatPence(dues.total_paid_pence)}</p>
              </div>
              <div>
                <p className="member-metric-label">Outstanding</p>
                <p className={`member-metric-value ${dues.total_remaining_pence > 0 ? "is-due" : "is-ok"}`}>
                  {formatPence(dues.total_remaining_pence)}
                </p>
              </div>
              <div>
                <p className="member-metric-label">{dues.current_year} balance</p>
                <p className="member-metric-value">
                  {current ? `${formatPence(current.paid_pence)} / ${formatPence(current.due_pence)}` : "—"}
                </p>
                {current ? <YearStatus status={current.status} /> : null}
              </div>
            </div>

            <div className="member-overview-actions">
              <button type="button" className="btn" onClick={() => setSection("dues")}>
                Open dues & payments
              </button>
              <button type="button" className="btn secondary" onClick={() => setSection("record")}>
                View full lodge record
              </button>
            </div>

            {roster ? (
              <div className="member-overview-snap">
                <h3>Quick details</h3>
                <dl className="member-field-grid">
                  <Field label="Email" value={roster.email || membership.email} />
                  <Field label="Mobile" value={roster.mobile} />
                  <Field label="Home phone" value={roster.home_phone} />
                  <Field label="City" value={roster.city} />
                  <Field label="Country" value={roster.country} />
                  <Field label="Activity" value={roster.activity} />
                  <Field label="Unit rank" value={roster.unit_rank} />
                  <Field label="Prov rank" value={roster.prov_rank} />
                  <Field label="Grand rank" value={roster.grand_rank} />
                </dl>
              </div>
            ) : null}
          </section>
        ) : null}

        {section === "record" ? (
          <section className="member-dash-panel">
            <header className="member-dash-panel-head">
              <h2>My lodge record</h2>
              <p>Every field imported from the lodge Excel roster.</p>
            </header>

            {!roster ? (
              <p className="member-empty">Roster details appear once your membership is matched.</p>
            ) : (
              <div className="member-record-sections">
                <div>
                  <h3>Identity</h3>
                  <dl className="member-field-grid">
                    <Field label="BrotherNo" value={roster.brother_no} />
                    <Field label="Surname" value={roster.surname} />
                    <Field label="GivenNames" value={roster.given_names} />
                    <Field label="Prefix" value={roster.prefix} />
                    <Field label="Initials" value={roster.initials} />
                    <Field label="Title" value={roster.title} />
                    <Field label="Suffix" value={roster.suffix} />
                    <Field label="Full name" value={roster.full_name} />
                    <Field label="Activity" value={roster.activity} />
                    <Field label="Notes" value={roster.notes} />
                  </dl>
                </div>

                <div>
                  <h3>Contact</h3>
                  <dl className="member-field-grid">
                    <Field label="Email" value={roster.email || membership.email} />
                    <Field label="HomePhone" value={roster.home_phone} />
                    <Field label="Mobile" value={roster.mobile} />
                  </dl>
                </div>

                <div>
                  <h3>Address</h3>
                  <dl className="member-field-grid">
                    <Field label="Address" value={roster.address} />
                    <Field label="Address2" value={roster.address2} />
                    <Field label="Address3" value={roster.address3} />
                    <Field label="City" value={roster.city} />
                    <Field label="County" value={roster.county} />
                    <Field label="PostCode" value={roster.postcode} />
                    <Field label="Country" value={roster.country} />
                  </dl>
                </div>

                <div>
                  <h3>Dates</h3>
                  <dl className="member-field-grid">
                    <Field label="StartDate" value={formatDate(roster.start_date)} />
                    <Field label="EndDate" value={formatDate(roster.end_date)} />
                  </dl>
                </div>

                <div>
                  <h3>Unit rank</h3>
                  <dl className="member-field-grid">
                    <Field label="UnitRank" value={roster.unit_rank} />
                    <Field label="UnitRankId" value={roster.unit_rank_id} />
                    <Field label="UnitPrefix" value={roster.unit_prefix} />
                    <Field label="UnitRankStart" value={formatDate(roster.unit_rank_start)} />
                  </dl>
                </div>

                <div>
                  <h3>Provincial rank</h3>
                  <dl className="member-field-grid">
                    <Field label="ProvRank" value={roster.prov_rank} />
                    <Field label="ProvRankId" value={roster.prov_rank_id} />
                    <Field label="ProvPrefix" value={roster.prov_prefix} />
                    <Field label="ProvRankStart" value={formatDate(roster.prov_rank_start)} />
                  </dl>
                </div>

                <div>
                  <h3>Grand rank</h3>
                  <dl className="member-field-grid">
                    <Field label="GrandRank" value={roster.grand_rank} />
                    <Field label="GrandRankId" value={roster.grand_rank_id} />
                    <Field label="GrandPrefix" value={roster.grand_prefix} />
                    <Field label="GrandRankStart" value={formatDate(roster.grand_rank_start)} />
                  </dl>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {section === "dues" ? (
          <section className="member-dash-panel">
            <header className="member-dash-panel-head">
              <h2>Dues & payments</h2>
              <p>
                Annual lodge dues are {formatPence(dues.annual_due_pence)}. Pay by card, or ask an admin to record bank /
                cash history for earlier years.
              </p>
            </header>

            <div className="member-metrics" aria-label="Dues summary">
              <div>
                <p className="member-metric-label">Paid to date</p>
                <p className="member-metric-value">{formatPence(dues.total_paid_pence)}</p>
              </div>
              <div>
                <p className="member-metric-label">Outstanding</p>
                <p className={`member-metric-value ${dues.total_remaining_pence > 0 ? "is-due" : "is-ok"}`}>
                  {formatPence(dues.total_remaining_pence)}
                </p>
              </div>
              <div>
                <p className="member-metric-label">{dues.current_year} balance</p>
                <p className="member-metric-value">
                  {current ? `${formatPence(current.paid_pence)} / ${formatPence(current.due_pence)}` : "—"}
                </p>
                {current ? <YearStatus status={current.status} /> : null}
              </div>
            </div>

            {canPay && dues.total_remaining_pence > 0 ? (
              <div className="membership-plan-actions">
                {stripeReady === false ? (
                  <p className="error">Card payments are not configured yet.</p>
                ) : (
                  <>
                    <button className="btn" type="button" disabled={pending} onClick={() => onPay("yearly")}>
                      Pay year · {formatPence(settings.yearly_pence)}
                    </button>
                    <button className="btn secondary" type="button" disabled={pending} onClick={() => onPay("monthly")}>
                      Monthly · {formatPence(settings.monthly_pence)}
                    </button>
                    <button className="btn secondary" type="button" disabled={pending} onClick={() => onPay("standing_order")}>
                      Standing order · {formatPence(settings.standing_order_pence)}/mo
                    </button>
                  </>
                )}
              </div>
            ) : null}
            {settings.bank_account_number || settings.bank_sort_code ? (
              <button className="btn secondary" type="button" disabled={pending} onClick={onStandingOrder}>
                Prefer bank standing order
              </button>
            ) : null}

            <div className="member-year-table-wrap">
              <table className="member-year-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Due</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.years.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
                      <td>{formatPence(row.due_pence)}</td>
                      <td>{formatPence(row.paid_pence)}</td>
                      <td>{formatPence(row.remaining_pence)}</td>
                      <td>
                        <YearStatus status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payments.length ? (
              <div className="member-payment-list">
                <h3>Payment history</h3>
                <ul>
                  {payments.map((payment) => (
                    <li key={payment.id}>
                      <strong>{payment.year}</strong>
                      <span>{formatPence(payment.amount_pence)}</span>
                      <span className="capitalize">{payment.method.replaceAll("_", " ")}</span>
                      <span>{formatDate(payment.paid_on)}</span>
                      {payment.note ? <em>{payment.note}</em> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="member-empty">No payments recorded yet.</p>
            )}

            {showBank ? (
              <div className="membership-bank">
                <h3>Bank standing order</h3>
                {settings.bank_name ? <p>Bank: {settings.bank_name}</p> : null}
                {settings.bank_account_name ? <p>Account name: {settings.bank_account_name}</p> : null}
                {settings.bank_sort_code ? <p>Sort code: {settings.bank_sort_code}</p> : null}
                {settings.bank_account_number ? <p>Account number: {settings.bank_account_number}</p> : null}
                <p>Amount: {formatPence(settings.standing_order_pence)} monthly</p>
                <p>Reference: {settings.bank_reference_hint || membership.membership_no || membership.access_code}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
      </div>
    </div>
  );
}

export function MembershipPanel({
  lodgeSlug,
  settings,
  initialMembership = null,
  initialRoster = null,
  initialPayments = [],
  initialDues = null,
}: {
  lodgeSlug: string;
  settings: LodgeMembershipSettings;
  initialMembership?: LodgeMembership | null;
  initialRoster?: LodgeRosterMember | null;
  initialPayments?: LodgeMembershipPayment[];
  initialDues?: MembershipDuesSummary | null;
}) {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(
    initialMembership && initialDues
      ? {
          membership: initialMembership,
          roster: initialRoster,
          payments: initialPayments,
          dues: initialDues,
        }
      : null,
  );
  const [fullName, setFullName] = useState(initialMembership?.full_name ?? "");
  const [email, setEmail] = useState(initialMembership?.email ?? "");
  const [membershipNo, setMembershipNo] = useState(initialMembership?.membership_no ?? "");
  const [accessEmail, setAccessEmail] = useState("");
  const [accessCode, setAccessCode] = useState(LOCAL_ACCESS_CODE);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"signin" | "register">("signin");

  useEffect(() => {
    fetch("/api/membership/checkout")
      .then((response) => response.json())
      .then((data: { stripeConfigured?: boolean }) => setStripeReady(Boolean(data.stripeConfigured)))
      .catch(() => setStripeReady(false));
  }, []);

  async function loadDashboard(membershipId: string) {
    const response = await fetch(`/api/membership/dashboard?membershipId=${encodeURIComponent(membershipId)}`);
    const data = (await response.json()) as DashboardPayload & { error?: string };
    if (!response.ok || !data.membership || !data.dues) {
      throw new Error(data.error || "Could not load dashboard.");
    }
    setDashboard({
      membership: data.membership,
      roster: data.roster ?? null,
      payments: data.payments ?? [],
      dues: data.dues,
    });
  }

  async function register() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/membership/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lodge_slug: lodgeSlug,
          full_name: fullName,
          email,
          membership_no: membershipNo,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        membership?: LodgeMembership;
        matched?: boolean;
      };
      if (!response.ok || !data.membership) {
        setError(data.error || "Registration failed.");
        setPending(false);
        return;
      }
      await loadDashboard(data.membership.id);
      setMessage(
        data.matched
          ? "Matched to the lodge list. Your dues balance is below."
          : "Registered. An admin will match you to the lodge list.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the membership service.");
    }
    setPending(false);
  }

  async function resumeAccess() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/membership/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lodge_slug: lodgeSlug, email: accessEmail, access_code: accessCode }),
      });
      const data = (await response.json()) as { membership?: LodgeMembership; error?: string };
      if (!response.ok || !data.membership) {
        setError(data.error || "Access failed.");
        setPending(false);
        return;
      }
      await loadDashboard(data.membership.id);
      setFullName(data.membership.full_name);
      setEmail(data.membership.email);
      setMembershipNo(data.membership.membership_no);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resume membership access.");
    }
    setPending(false);
  }

  async function pay(plan: MembershipPlan) {
    if (!dashboard) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: dashboard.membership.id, plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error || "Checkout failed.");
        setPending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not start Stripe checkout.");
      setPending(false);
    }
  }

  async function requestStandingOrderBank() {
    if (!dashboard) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/membership/standing-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: dashboard.membership.id }),
      });
      const data = (await response.json()) as { membership?: LodgeMembership; error?: string };
      if (!response.ok || !data.membership) {
        setError(data.error || "Could not record standing order request.");
        setPending(false);
        return;
      }
      await loadDashboard(data.membership.id);
      setMessage("Standing order requested. Use the bank details below; an admin will record payment when funds arrive.");
    } catch {
      setError("Could not record standing order request.");
    }
    setPending(false);
  }

  async function signOut() {
    await fetch("/api/membership/session", { method: "DELETE" }).catch(() => null);
    setDashboard(null);
    setMessage("");
    setError("");
  }

  if (dashboard) {
    return (
      <MemberHome
        data={dashboard}
        settings={settings}
        pending={pending}
        stripeReady={stripeReady}
        error={error}
        message={message}
        onPay={pay}
        onStandingOrder={requestStandingOrderBank}
        onSignOut={signOut}
        onRefresh={() => loadDashboard(dashboard.membership.id)}
      />
    );
  }

  return (
    <div className="member-gate">
      <div className="member-gate-tabs" role="tablist">
        <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
          Sign in
        </button>
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
          First time
        </button>
      </div>

      {mode === "signin" ? (
        <section className="membership-card member-gate-card">
          <h2>Open your membership</h2>
          <p>
            Use your registered email. For local testing the access code is <code>{LOCAL_ACCESS_CODE}</code> for every
            member.
          </p>
          <label>
            Email
            <input type="email" value={accessEmail} onChange={(event) => setAccessEmail(event.target.value)} />
          </label>
          <label>
            Access code
            <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} autoComplete="one-time-code" />
          </label>
          <button className="btn" type="button" disabled={pending || !accessEmail || !accessCode} onClick={resumeAccess}>
            {pending ? "Opening…" : "Go to dashboard"}
          </button>
        </section>
      ) : (
        <section className="membership-card member-gate-card">
          <h2>Check the lodge list</h2>
          <p>Match with BrotherNo and/or email. You will get an access code for next time.</p>
          <label>
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            BrotherNo <span className="optional">(recommended)</span>
            <input
              value={membershipNo}
              onChange={(event) => setMembershipNo(event.target.value)}
              placeholder="From lodge records"
            />
          </label>
          <button className="btn" type="button" disabled={pending || !fullName || !email} onClick={register}>
            {pending ? "Checking…" : "Create membership access"}
          </button>
        </section>
      )}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
