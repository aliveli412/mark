"use client";

import { useEffect, useState } from "react";
import { formatPence } from "@/lib/format";
import type {
  LodgeMembership,
  LodgeMembershipSettings,
  LodgeRosterMember,
  MembershipPlan,
} from "@/lib/types";

type RegisterResult = {
  error?: string;
  membership?: LodgeMembership;
  roster?: LodgeRosterMember | null;
  matched?: boolean;
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

function addressLines(roster: LodgeRosterMember) {
  return [roster.address, roster.address2, roster.address3, [roster.city, roster.county].filter(Boolean).join(", "), roster.postcode, roster.country]
    .map((line) => line.trim())
    .filter(Boolean);
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="member-profile-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function MemberDashboard({
  membership,
  roster,
  settings,
  message,
  pending,
  stripeReady,
  error,
  onPay,
  onStandingOrder,
  onSignOut,
}: {
  membership: LodgeMembership;
  roster: LodgeRosterMember | null;
  settings: LodgeMembershipSettings;
  message: string;
  pending: boolean;
  stripeReady: boolean | null;
  error: string;
  onPay: (plan: MembershipPlan) => void;
  onStandingOrder: () => void;
  onSignOut: () => void;
}) {
  const canPay =
    membership.status === "matched" || membership.status === "active" || membership.status === "past_due";
  const showBank =
    Boolean(settings.bank_account_number || settings.bank_sort_code) &&
    (membership.plan === "standing_order" || membership.status === "matched");

  const title = roster
    ? [roster.prefix, roster.full_name].filter(Boolean).join(" ")
    : membership.full_name;
  const brotherNo = roster?.brother_no || membership.membership_no;

  return (
    <div className="member-dashboard">
      <header className="member-dash-hero">
        <div>
          <p className="member-dash-kicker">Your membership</p>
          <h2>{title}</h2>
          <p className="member-dash-meta">
            {brotherNo ? <span>BrotherNo {brotherNo}</span> : null}
            {roster?.activity ? <span>{roster.activity}</span> : null}
            {roster?.title ? <span>{roster.title}</span> : null}
          </p>
        </div>
        <div className="member-dash-status">
          <span className={`member-status-pill status-${membership.status}`}>{membership.status.replaceAll("_", " ")}</span>
          {membership.plan ? <span className="member-plan-pill">{membership.plan.replaceAll("_", " ")}</span> : null}
          <button className="member-signout" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {message ? <p className="membership-note">{message}</p> : null}

      {membership.status === "pending_match" ? (
        <p className="membership-note">Waiting for an admin to confirm you against the lodge roster.</p>
      ) : null}

      {roster ? (
        <div className="member-profile-grid">
          <section className="member-profile-block">
            <h3>Identity</h3>
            <dl>
              <ProfileRow label="Given names" value={display(roster.given_names)} />
              <ProfileRow label="Surname" value={display(roster.surname)} />
              <ProfileRow label="Prefix" value={display(roster.prefix)} />
              <ProfileRow label="Initials" value={display(roster.initials)} />
              <ProfileRow label="Title" value={display(roster.title)} />
              <ProfileRow label="Suffix" value={display(roster.suffix)} />
              <ProfileRow label="BrotherNo" value={display(roster.brother_no)} />
              <ProfileRow label="Activity" value={display(roster.activity)} />
              <ProfileRow label="Start date" value={formatDate(roster.start_date)} />
              <ProfileRow label="End date" value={formatDate(roster.end_date)} />
            </dl>
          </section>

          <section className="member-profile-block">
            <h3>Contact</h3>
            <dl>
              <ProfileRow label="Email" value={display(roster.email || membership.email)} />
              <ProfileRow label="Mobile" value={display(roster.mobile)} />
              <ProfileRow label="Home phone" value={display(roster.home_phone)} />
            </dl>
            <h3 className="member-profile-subhead">Address</h3>
            {addressLines(roster).length ? (
              <address className="member-address">
                {addressLines(roster).map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
            ) : (
              <p className="member-empty">No address on file.</p>
            )}
          </section>

          <section className="member-profile-block member-ranks">
            <h3>Ranks</h3>
            <div className="member-rank-grid">
              <div>
                <h4>Unit</h4>
                <p className="member-rank-value">{display(roster.unit_rank)}</p>
                <p className="member-rank-detail">Prefix {display(roster.unit_prefix)}</p>
                <p className="member-rank-detail">Id {display(roster.unit_rank_id)}</p>
                <p className="member-rank-detail">Since {formatDate(roster.unit_rank_start)}</p>
              </div>
              <div>
                <h4>Provincial</h4>
                <p className="member-rank-value">{display(roster.prov_rank)}</p>
                <p className="member-rank-detail">Prefix {display(roster.prov_prefix)}</p>
                <p className="member-rank-detail">Id {display(roster.prov_rank_id)}</p>
                <p className="member-rank-detail">Since {formatDate(roster.prov_rank_start)}</p>
              </div>
              <div>
                <h4>Grand</h4>
                <p className="member-rank-value">{display(roster.grand_rank)}</p>
                <p className="member-rank-detail">Prefix {display(roster.grand_prefix)}</p>
                <p className="member-rank-detail">Id {display(roster.grand_rank_id)}</p>
                <p className="member-rank-detail">Since {formatDate(roster.grand_rank_start)}</p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <p className="membership-note">
          Registered as {membership.full_name} ({membership.email}). Lodge roster details will appear once matched.
        </p>
      )}

      <section className="member-dues">
        <div className="member-dues-copy">
          <h3>Dues</h3>
          <p>
            Access code <code>{membership.access_code}</code> — keep this to return later.
          </p>
        </div>

        {canPay ? (
          <div className="membership-plans">
            {stripeReady === false ? (
              <p className="error">Stripe is not configured yet for card/subscription payments.</p>
            ) : (
              <div className="membership-plan-actions">
                <button className="btn" type="button" disabled={pending} onClick={() => onPay("monthly")}>
                  Monthly · {formatPence(settings.monthly_pence)}
                </button>
                <button className="btn" type="button" disabled={pending} onClick={() => onPay("yearly")}>
                  Yearly · {formatPence(settings.yearly_pence)}
                </button>
                <button className="btn" type="button" disabled={pending} onClick={() => onPay("standing_order")}>
                  Standing order (card) · {formatPence(settings.standing_order_pence)}/mo
                </button>
              </div>
            )}
            {settings.bank_account_number || settings.bank_sort_code ? (
              <button className="btn secondary" type="button" disabled={pending} onClick={onStandingOrder}>
                Prefer bank standing order
              </button>
            ) : null}
          </div>
        ) : null}

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
}: {
  lodgeSlug: string;
  settings: LodgeMembershipSettings;
  initialMembership?: LodgeMembership | null;
  initialRoster?: LodgeRosterMember | null;
}) {
  const [membership, setMembership] = useState<LodgeMembership | null>(initialMembership);
  const [roster, setRoster] = useState<LodgeRosterMember | null>(initialRoster);
  const [fullName, setFullName] = useState(initialMembership?.full_name ?? "");
  const [email, setEmail] = useState(initialMembership?.email ?? "");
  const [membershipNo, setMembershipNo] = useState(initialMembership?.membership_no ?? "");
  const [accessEmail, setAccessEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/membership/checkout")
      .then((response) => response.json())
      .then((data: { stripeConfigured?: boolean }) => setStripeReady(Boolean(data.stripeConfigured)))
      .catch(() => setStripeReady(false));
  }, []);

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
      const data = (await response.json()) as RegisterResult;
      if (!response.ok || !data.membership) {
        setError(data.error || "Registration failed.");
        setPending(false);
        return;
      }
      setMembership(data.membership);
      setRoster(data.roster ?? null);
      setMessage(
        data.matched
          ? "Matched to the lodge member list. Your full record is below — choose a plan to activate."
          : "We could not match you automatically. An admin will review your request.",
      );
    } catch {
      setError("Could not reach the membership service.");
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
      const data = (await response.json()) as {
        membership?: LodgeMembership;
        roster?: LodgeRosterMember | null;
        error?: string;
      };
      if (!response.ok || !data.membership) {
        setError(data.error || "Access failed.");
        setPending(false);
        return;
      }
      setMembership(data.membership);
      setRoster(data.roster ?? null);
      setFullName(data.membership.full_name);
      setEmail(data.membership.email);
      setMembershipNo(data.membership.membership_no);
    } catch {
      setError("Could not resume membership access.");
    }
    setPending(false);
  }

  async function pay(plan: MembershipPlan) {
    if (!membership) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: membership.id, plan }),
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
    if (!membership) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/membership/standing-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: membership.id }),
      });
      const data = (await response.json()) as { membership?: LodgeMembership; error?: string };
      if (!response.ok || !data.membership) {
        setError(data.error || "Could not record standing order request.");
        setPending(false);
        return;
      }
      setMembership(data.membership);
      setMessage("Standing order requested. Use the bank details below; an admin will activate once funds arrive.");
    } catch {
      setError("Could not record standing order request.");
    }
    setPending(false);
  }

  if (membership) {
    return (
      <MemberDashboard
        membership={membership}
        roster={roster}
        settings={settings}
        message={message}
        pending={pending}
        stripeReady={stripeReady}
        error={error}
        onPay={pay}
        onStandingOrder={requestStandingOrderBank}
        onSignOut={() => {
          setMembership(null);
          setRoster(null);
          setMessage("");
          setError("");
        }}
      />
    );
  }

  return (
    <div className="membership-panel">
      <div className="membership-grid">
        <section className="membership-card">
          <h2>Register / activate</h2>
          <p>If your name is on the lodge member list, we will match BrotherNo / email and open your record.</p>
          <label>
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            BrotherNo / membership no. <span className="optional">(recommended)</span>
            <input
              value={membershipNo}
              onChange={(event) => setMembershipNo(event.target.value)}
              placeholder="From lodge records"
            />
          </label>
          <button className="btn" type="button" disabled={pending || !fullName || !email} onClick={register}>
            {pending ? "Checking…" : "Check membership list"}
          </button>
        </section>

        <section className="membership-card">
          <h2>Already registered?</h2>
          <p>Use the email and access code from your registration confirmation.</p>
          <label>
            Email
            <input type="email" value={accessEmail} onChange={(event) => setAccessEmail(event.target.value)} />
          </label>
          <label>
            Access code
            <input value={accessCode} onChange={(event) => setAccessCode(event.target.value)} />
          </label>
          <button className="btn" type="button" disabled={pending || !accessEmail || !accessCode} onClick={resumeAccess}>
            Open my membership
          </button>
        </section>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
