"use client";

import { useState } from "react";
import { signInAction } from "@/app/admin/actions";

export function LoginForm({ nextPath, sampleMode }: { nextPath: string; sampleMode: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="admin-form"
      action={async (formData) => {
        setPending(true);
        setError("");
        const result = await signInAction(formData);
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      }}
    >
      <input type="hidden" name="next" value={nextPath} />
      <label>
        Email
        <input name="email" type="email" required defaultValue={sampleMode ? "admin@example.com" : ""} />
      </label>
      <label>
        Password
        <input name="password" type="password" required defaultValue={sampleMode ? "sample" : ""} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
