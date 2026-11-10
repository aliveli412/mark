import { LoginForm } from "@/components/admin/LoginForm";
import { usingSampleData } from "@/lib/data/catalog";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const needsSupabase = usingSampleData();
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Mark Admin</h1>
        {needsSupabase ? (
          <>
            <p>
              Admin access needs a connected Supabase project. Public pages can still use sample content, but nobody can open the admin panel until Auth is configured.
            </p>
            <ol style={{ paddingLeft: 18, color: "#444" }}>
              <li>Add the Supabase secrets in Cursor.</li>
              <li>Run <code>supabase/schema.sql</code> in the SQL editor.</li>
              <li>Create an Auth user and set <code>profiles.role</code> to <code>super_admin</code>.</li>
            </ol>
          </>
        ) : (
          <>
            <p>Sign in with an admin account from Supabase Auth.</p>
            <LoginForm nextPath={params.next || "/admin"} sampleMode={false} />
          </>
        )}
      </div>
    </div>
  );
}
