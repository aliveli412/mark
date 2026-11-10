"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { signInAction } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>;
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction] = useActionState(signInAction, null);

  useEffect(() => {
    if (state?.ok && state.next) {
      window.location.assign(state.next);
    }
  }, [state]);

  return (
    <form className="admin-form" action={formAction}>
      <input type="hidden" name="next" value={nextPath} />
      <label>
        Email
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {state?.error ? <p className="error">{state.error}</p> : null}
      {state?.ok ? <p>Signed in — opening admin…</p> : null}
      <SubmitButton />
    </form>
  );
}
