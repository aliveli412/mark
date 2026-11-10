"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isActionOrigin =
    error.digest?.includes("E80") ||
    /invalid server actions request/i.test(error.message ?? "");

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Admin error</h1>
        {isActionOrigin ? (
          <p>
            Sign-in was blocked by a Server Action origin check on this host. Refresh and try again after the latest publish (allowedOrigins for apps.grok.bot).
          </p>
        ) : (
          <p>Something went wrong loading this admin page.</p>
        )}
        {error.digest ? <p className="error">Digest: {error.digest}</p> : null}
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
