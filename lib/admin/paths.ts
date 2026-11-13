/** Only allow in-app admin redirects after sign-in. */
export function safeAdminNextPath(raw: string | null | undefined) {
  const value = (raw ?? "").trim();
  if (!value.startsWith("/")) return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//") || value.includes("://") || value.includes("\\")) return "/admin";
  if (value.includes("?")) {
    const path = value.slice(0, value.indexOf("?"));
    if (!path.startsWith("/admin")) return "/admin";
  }
  return value || "/admin";
}
