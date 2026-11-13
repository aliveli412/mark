import { cookies } from "next/headers";

const COOKIE = "mmm_lodge_member";

export type MemberSessionPayload = {
  lodgeSlug: string;
  membershipId: string;
  email: string;
  accessCode: string;
};

function encode(payload: MemberSessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decode(value: string): MemberSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as MemberSessionPayload;
    if (!parsed.lodgeSlug || !parsed.membershipId || !parsed.email || !parsed.accessCode) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setMemberSession(payload: MemberSessionPayload) {
  const jar = await cookies();
  jar.set(COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export async function clearMemberSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function readMemberSession(lodgeSlug?: string) {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const payload = decode(raw);
  if (!payload) return null;
  if (lodgeSlug && payload.lodgeSlug !== lodgeSlug) return null;
  return payload;
}
