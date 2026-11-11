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
  const [showProfile, setShowProfile] = useState(false);
  const title = roster ? [roster.prefix, roster.full_name].filter(Boolean).join(" ") : membership.full_name;
  const brotherNo = roster?.brother_no || membership.membership_no;
  const current = dues.years.find((row) => row.year === dues.current_year) ?? dues.years[0];
  const canPay =
    membership.status === "matched" || membership.status === "active" || membership.status === "past_due";
  const showBank =
    Boolean(settings.bank_account_number || settings.bank_sort_code) &&
    (membership.plan === "standing_order" || dues.total_remaining_pence > 0);

  const address = useMemo(() => {
    if (!roster) return [];
    return [roster.address, roster.address2, roster.address3, [roster.city, roster.county].filter(Boolean).join(", "), roster.postcode, roster.country]
      .map((line) => line.trim())
      .filter(Boolean);
  }, [roster]);

  return (
    <div className="member-home">
      <header className="member-home-hero">
        <div>
          <p className="member-home-kicker">Member dashboard</p>
          <h2>{title}</h2>
          <p className="member-home-meta">
            {brotherNo ? <span>BrotherNo {brotherNo}</span> : null}
            {roster?.activity ? <span>{roster.activity}</span> : null}
            <span className="capitalize">{statusLabel(membership.status)}</span>
          </p>
        </div>
        <div className="member-home-tools">
          <button type="button" className="member-text-btn" onClick={onRefresh}>
            Refresh
          </button>
          <button type="button" className="member-text-btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {message ? <p className="membership-note">{message}</p> : null}
      {membership.status === "pending_match" ? (
        <p className="membership-note">An admin still needs to match you to the lodge roster.</p>
      ) : null}

      <section className="member-metrics" aria-label="Dues summary">
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
      </section>

      <section className="member-home-panel">
        <div className="member-panel-head">
          <div>
            <h3>Dues & payments</h3>
            <p>
              Annual lodge dues are {formatPence(dues.annual_due_pence)}. Pay by card, or ask an admin to record bank /
              cash history for earlier years.
            </p>
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
        </div>

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
            <h4>Payment history</h4>
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
            <h4>Bank standing order</h4>
            {settings.bank_name ? <p>Bank: {settings.bank_name}</p> : null}
            {settings.bank_account_name ? <p>Account name: {settings.bank_account_name}</p> : null}
            {settings.bank_sort_code ? <p>Sort code: {settings.bank_sort_code}</p> : null}
            {settings.bank_account_number ? <p>Account number: {settings.bank_account_number}</p> : null}
            <p>Amount: {formatPence(settings.standing_order_pence)} monthly</p>
            <p>Reference: {settings.bank_reference_hint || membership.membership_no || membership.access_code}</p>
          </div>
        ) : null}

        <p className="member-access-hint">
          Keep your access code <code>{membership.access_code}</code> to sign back in on another device.
        </p>
      </section>

      <section className="member-home-panel">
        <button type="button" className="member-profile-toggle" onClick={() => setShowProfile((value) => !value)}>
          {showProfile ? "Hide lodge record" : "View lodge record"}
        </button>
        {showProfile && roster ? (
          <div className="member-profile-grid compact">
            <div>
              <h4>Identity</h4>
              <dl>
                <div><dt>Given names</dt><dd>{display(roster.given_names)}</dd></div>
                <div><dt>Surname</dt><dd>{display(roster.surname)}</dd></div>
                <div><dt>Prefix / title</dt><dd>{display([roster.prefix, roster.title].filter(Boolean).join(" · "))}</dd></div>
                <div><dt>Initials</dt><dd>{display(roster.initials)}</dd></div>
                <div><dt>Start</dt><dd>{formatDate(roster.start_date)}</dd></div>
                <div><dt>Activity</dt><dd>{display(roster.activity)}</dd></div>
              </dl>
            </div>
            <div>
              <h4>Contact</h4>
              <dl>
                <div><dt>Email</dt><dd>{display(roster.email || membership.email)}</dd></div>
                <div><dt>Mobile</dt><dd>{display(roster.mobile)}</dd></div>
                <div><dt>Home</dt><dd>{display(roster.home_phone)}</dd></div>
              </dl>
              <h4>Address</h4>
              {address.length ? (
                <address className="member-address">
                  {address.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              ) : (
                <p className="member-empty">No address on file.</p>
              )}
            </div>
            <div className="member-ranks">
              <h4>Ranks</h4>
              <div className="member-rank-grid">
                <div>
                  <h5>Unit</h5>
                  <p>{display(roster.unit_rank)}</p>
                  <small>Prefix {display(roster.unit_prefix)} · Id {display(roster.unit_rank_id)}</small>
                </div>
                <div>
                  <h5>Provincial</h5>
                  <p>{display(roster.prov_rank)}</p>
                  <small>Prefix {display(roster.prov_prefix)} · Id {display(roster.prov_rank_id)}</small>
                </div>
                <div>
                  <h5>Grand</h5>
                  <p>{display(roster.grand_rank)}</p>
                  <small>Prefix {display(roster.grand_prefix)} · Id {display(roster.grand_rank_id)}</small>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {showProfile && !roster ? (
          <p className="member-empty">Roster details appear once your membership is matched.</p>
        ) : null}
      </section>

      {error ? <p className="error">{error}</p> : null}
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
