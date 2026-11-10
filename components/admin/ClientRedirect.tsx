"use client";

import { useEffect } from "react";

/** Hard navigation — avoids next/navigation redirect() digests on some hosts. */
export function ClientRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return <p className="admin-redirecting">Redirecting…</p>;
}
