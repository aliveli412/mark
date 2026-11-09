import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap page">
      <h1>Page not found</h1>
      <p>That address is not part of this portal.</p>
      <Link href="/">Back to the home page</Link>
    </div>
  );
}
