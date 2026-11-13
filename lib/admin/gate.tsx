import { ClientRedirect } from "@/components/admin/ClientRedirect";
import { getAdminSession, type AdminSession } from "@/lib/admin/auth";

export async function adminGate(): Promise<
  { ok: true; session: AdminSession } | { ok: false; node: React.ReactNode }
> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      node: <ClientRedirect href="/admin/login?error=not_admin" />,
    };
  }
  return { ok: true, session };
}
