"use client";

import { Fragment, useMemo, useState } from "react";
import { deleteRosterMemberAction } from "@/app/admin/actions";
import type { LodgeRosterMember } from "@/lib/types";

function show(value: string | null | undefined) {
  const text = (value ?? "").trim();
  return text || "—";
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="roster-detail-field">
      <dt>{label}</dt>
      <dd>{show(value)}</dd>
    </div>
  );
}

function MemberDetail({ member }: { member: LodgeRosterMember }) {
  return (
    <div className="roster-detail">
      <div className="roster-detail-grid">
        <section>
          <h4>Identity</h4>
          <dl>
            <Field label="BrotherNo" value={member.brother_no} />
            <Field label="Surname" value={member.surname} />
            <Field label="GivenNames" value={member.given_names} />
            <Field label="Prefix" value={member.prefix} />
            <Field label="Initials" value={member.initials} />
            <Field label="Title" value={member.title} />
            <Field label="Suffix" value={member.suffix} />
            <Field label="Full name" value={member.full_name} />
            <Field label="Activity" value={member.activity} />
            <Field label="Notes" value={member.notes} />
          </dl>
        </section>
        <section>
          <h4>Contact</h4>
          <dl>
            <Field label="Email" value={member.email} />
            <Field label="HomePhone" value={member.home_phone} />
            <Field label="Mobile" value={member.mobile} />
          </dl>
          <h4>Address</h4>
          <dl>
            <Field label="Address" value={member.address} />
            <Field label="Address2" value={member.address2} />
            <Field label="Address3" value={member.address3} />
            <Field label="City" value={member.city} />
            <Field label="County" value={member.county} />
            <Field label="PostCode" value={member.postcode} />
            <Field label="Country" value={member.country} />
          </dl>
        </section>
        <section>
          <h4>Dates</h4>
          <dl>
            <Field label="StartDate" value={member.start_date} />
            <Field label="EndDate" value={member.end_date} />
          </dl>
          <h4>Unit rank</h4>
          <dl>
            <Field label="UnitRank" value={member.unit_rank} />
            <Field label="UnitRankId" value={member.unit_rank_id} />
            <Field label="UnitPrefix" value={member.unit_prefix} />
            <Field label="UnitRankStart" value={member.unit_rank_start} />
          </dl>
        </section>
        <section>
          <h4>Provincial / Grand</h4>
          <dl>
            <Field label="ProvRank" value={member.prov_rank} />
            <Field label="ProvRankId" value={member.prov_rank_id} />
            <Field label="ProvPrefix" value={member.prov_prefix} />
            <Field label="ProvRankStart" value={member.prov_rank_start} />
            <Field label="GrandRank" value={member.grand_rank} />
            <Field label="GrandRankId" value={member.grand_rank_id} />
            <Field label="GrandPrefix" value={member.grand_prefix} />
            <Field label="GrandRankStart" value={member.grand_rank_start} />
          </dl>
        </section>
      </div>
    </div>
  );
}

export function RosterMembersTable({
  lodgeSlug,
  roster,
  emptyHint,
}: {
  lodgeSlug: string;
  roster: LodgeRosterMember[];
  emptyHint: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return roster;
    return roster.filter((member) =>
      [
        member.brother_no,
        member.full_name,
        member.surname,
        member.given_names,
        member.email,
        member.mobile,
        member.home_phone,
        member.city,
        member.country,
        member.activity,
        member.unit_rank,
        member.prov_rank,
        member.grand_rank,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [roster, query]);

  return (
    <div className="roster-table-wrap">
      <div className="roster-table-toolbar">
        <label>
          Search roster
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="BrotherNo, name, email, rank…"
          />
        </label>
        <p className="note" style={{ margin: 0 }}>
          Summary columns below. Click <strong>All fields</strong> to see every Excel column for that member.
        </p>
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>BrotherNo</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Address</th>
              <th>Ranks</th>
              <th>Dates / activity</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => {
              const address = [
                member.address,
                member.address2,
                member.address3,
                member.city,
                member.county,
                member.postcode,
                member.country,
              ]
                .filter(Boolean)
                .join(", ");
              const ranks = [
                member.unit_rank ? `Unit: ${member.unit_rank}` : null,
                member.prov_rank ? `Prov: ${member.prov_rank}` : null,
                member.grand_rank ? `Grand: ${member.grand_rank}` : null,
              ].filter(Boolean);
              const open = openId === member.id;
              return (
                <Fragment key={member.id}>
                  <tr>
                    <td>{member.brother_no || member.membership_no || "—"}</td>
                    <td>
                      <strong>{[member.prefix, member.full_name].filter(Boolean).join(" ")}</strong>
                      <div>{[member.title, member.initials, member.suffix].filter(Boolean).join(" · ") || "—"}</div>
                    </td>
                    <td>
                      <div>{member.email || "—"}</div>
                      <div>{member.mobile ? `M: ${member.mobile}` : "—"}</div>
                      <div>{member.home_phone ? `H: ${member.home_phone}` : ""}</div>
                    </td>
                    <td>{address || "—"}</td>
                    <td>{ranks.length ? ranks.map((line) => <div key={line}>{line}</div>) : "—"}</td>
                    <td>
                      <div>
                        {member.start_date || "—"}
                        {member.end_date ? ` → ${member.end_date}` : ""}
                      </div>
                      <div>{member.activity || "—"}</div>
                    </td>
                    <td>
                      <span className={`pill ${member.active ? "ok" : "draft"}`}>
                        {member.active ? "Active" : "Ended"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions" style={{ flexWrap: "nowrap" }}>
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => setOpenId(open ? null : member.id)}
                        >
                          {open ? "Hide" : "All fields"}
                        </button>
                        <form action={deleteRosterMemberAction}>
                          <input type="hidden" name="id" value={member.id} />
                          <input type="hidden" name="lodge_slug" value={lodgeSlug} />
                          <button className="danger" type="submit">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="roster-detail-row">
                      <td colSpan={8}>
                        <MemberDetail member={member} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>{roster.length === 0 ? emptyHint : "No members match that search."}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
