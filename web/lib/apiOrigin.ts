export let API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "";
// Runtime fallback – works in browsers only (Next.js edge / node can’t use it).
if (!API_ORIGIN && typeof window !== "undefined") {
  API_ORIGIN = `${window.location.protocol}//${window.location.host}`;
}

export function withApiOrigin(path: string): string {
  if (!path.startsWith("/")) throw new Error("path must begin with /");
  // Only prefix FastAPI routes (our whole backend lives under /api/*).
  if (path.startsWith("/api")) return `${API_ORIGIN}${path}`;
  return path;
}
