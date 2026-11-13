import { getMembershipById } from "@/lib/data/memberships";
import { readMemberSession } from "@/lib/member-session";
import type { LodgeMembership } from "@/lib/types";

/** Resolve the signed-in lodge membership for file downloads. */
export async function getDownloadMembership(lodgeSlug: string): Promise<LodgeMembership | null> {
  const session = await readMemberSession(lodgeSlug);
  if (!session) return null;
  const membership = await getMembershipById(session.membershipId);
  if (!membership || membership.lodge_slug !== lodgeSlug) return null;
  if (membership.email.toLowerCase() !== session.email.toLowerCase()) return null;
  return membership;
}
