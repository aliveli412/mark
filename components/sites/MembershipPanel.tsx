"use client";

import { useEffect, useState } from "react";
import { formatPence } from "@/lib/format";
import type { LodgeMembership, LodgeMembershipSettings, MembershipPlan } from "@/lib/types";

type RegisterResult = {
  error?: string;
  membership?: LodgeMembership;
  matched?: boolean;
};

export function MembershipPanel({
  lodgeSlug,
  settings,
  initialMembership = null,
}: {
  lodgeSlug: string;
  settings: LodgeMembershipSettings;
  initialMembership?: LodgeMembership | null;
}) {
  const [membership, setMembership] = useState<LodgeMembership | null>(initialMembership);
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
      setMessage(
        data.matched
          ? "Matched to the lodge member list. Choose a plan to activate."
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
      const data = (await response.json()) as { membership?: LodgeMembership; error?: string };
      if (!response.ok || !data.membership) {
        setError(data.error || "Access failed.");
        setPending(false);
        return;
      }
      setMembership(data.membership);
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

  const canPay = membership && (membership.status === "matched" || membership.status === "active" || membership.status === "past_due");
  const showBank =
    Boolean(settings.bank_account_number || settings.bank_sort_code) &&
    membership &&
    (membership.plan === "standing_order" || membership.status === "matched");

  return (
    <div className="membership-panel">
      {!membership ? (
        <div className="membership-grid">
          <section className="membership-card">
            <h2>Register / activate</h2>
            <p>If your name is on the lodge member list, we will match your email and let you activate dues.</p>
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
      ) : (
        <section className="membership-card">
          <h2>{membership.full_name}</h2>
          <p>
            Status: <strong>{membership.status.replace("_", " ")}</strong>
            {membership.plan ? ` · plan ${membership.plan.replace("_", " ")}` : ""}
          </p>
          <p>
            Access code: <code>{membership.access_code}</code> — keep this to return later.
          </p>
          {message ? <p className="membership-note">{message}</p> : null}

          {membership.status === "pending_match" ? (
            <p>Waiting for an admin to confirm you against the lodge roster.</p>
          ) : null}

          {canPay ? (
            <div className="membership-plans">
              <h3>Choose dues plan</h3>
              {stripeReady === false ? (
                <p className="error">Stripe is not configured yet for card/subscription payments.</p>
              ) : (
                <div className="membership-plan-actions">
                  <button className="btn" type="button" disabled={pending} onClick={() => pay("monthly")}>
                    Monthly · {formatPence(settings.monthly_pence)}
                  </button>
                  <button className="btn" type="button" disabled={pending} onClick={() => pay("yearly")}>
                    Yearly · {formatPence(settings.yearly_pence)}
                  </button>
                  <button className="btn" type="button" disabled={pending} onClick={() => pay("standing_order")}>
                    Standing order (card) · {formatPence(settings.standing_order_pence)}/mo
                  </button>
                </div>
              )}
              {settings.bank_account_number || settings.bank_sort_code ? (
                <button className="btn secondary" type="button" disabled={pending} onClick={requestStandingOrderBank}>
                  Prefer bank standing order
                </button>
              ) : null}
            </div>
          ) : null}

          {showBank ? (
            <div className="membership-bank">
              <h3>Bank standing order details</h3>
              {settings.bank_name ? <p>Bank: {settings.bank_name}</p> : null}
              {settings.bank_account_name ? <p>Account name: {settings.bank_account_name}</p> : null}
              {settings.bank_sort_code ? <p>Sort code: {settings.bank_sort_code}</p> : null}
              {settings.bank_account_number ? <p>Account number: {settings.bank_account_number}</p> : null}
              <p>Amount: {formatPence(settings.standing_order_pence)} monthly</p>
              <p>Reference: {settings.bank_reference_hint || membership.membership_no || membership.access_code}</p>
            </div>
          ) : null}
        </section>
      )}

      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
