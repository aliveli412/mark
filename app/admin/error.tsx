"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>Admin error</h1>
        <p>Something went wrong loading this admin page.</p>
        {error.digest ? <p className="error">Digest: {error.digest}</p> : null}
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
