"use client";

import { useState } from "react";

type ActionResult = { error?: string; next?: string } | void;

export function AdminNavForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: React.ReactNode;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className={className}
      action={async (formData) => {
        setPending(true);
        setError("");
        try {
          const result = await action(formData);
          if (result?.error) {
            setError(result.error);
            setPending(false);
            return;
          }
          if (result?.next) {
            window.location.assign(result.next);
            return;
          }
          setPending(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending} style={{ border: 0, margin: 0, padding: 0 }}>
        {children}
      </fieldset>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
