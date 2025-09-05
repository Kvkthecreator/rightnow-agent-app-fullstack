export const PUBLIC_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();

export function apiUrl(path: string): string {
  if (!PUBLIC_API_BASE_URL) return path;
  const base = PUBLIC_API_BASE_URL.endsWith('/')
    ? PUBLIC_API_BASE_URL.slice(0, -1)
    : PUBLIC_API_BASE_URL;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
