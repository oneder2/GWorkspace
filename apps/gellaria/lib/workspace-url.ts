export function workspaceUrl(path = "/") {
  if (/^https?:\/\//i.test(path) || path.startsWith("mailto:") || path.startsWith("tel:")) return path;
  const configured = process.env.NEXT_PUBLIC_GWORKSPACE_URL?.trim();
  const origin = configured || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:4173" : "https://www.gellaronline.cc");
  return new URL(path, origin).toString();
}
