"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="wrap" style={{ padding: "48px 0" }}>
      <h1>Something went wrong</h1>
      <p style={{ color: "#555", maxWidth: "60ch" }}>{error.message || "Please try again."}</p>
      <button className="btn" type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
