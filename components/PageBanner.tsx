import Link from "next/link";

export function PageBanner({
  title,
  current,
}: {
  title: string;
  current?: string;
}) {
  return (
    <div className="banner">
      <div className="wrap">
        <h1>{title}</h1>
        <div className="crumbs">
          <Link href="/">Home</Link>
          <span> / {current ?? title}</span>
        </div>
      </div>
    </div>
  );
}
