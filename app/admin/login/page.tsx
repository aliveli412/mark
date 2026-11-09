import { LoginForm } from "@/components/admin/LoginForm";
import { usingSampleData } from "@/lib/data/catalog";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const sampleMode = usingSampleData();
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Mark Admin</h1>
        <p>
          {sampleMode
            ? "Supabase is not connected yet. Sign in with any email and password to explore the sample admin."
            : "Sign in with an admin account from Supabase Auth."}
        </p>
        <LoginForm nextPath={params.next || "/admin"} sampleMode={sampleMode} />
      </div>
    </div>
  );
}
