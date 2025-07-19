// web/lib/auth/getRedirectPath.ts

export function getRedirectPath(): string {
  if (typeof window === "undefined") return "/home";

  const path = localStorage.getItem("redirectPath") ?? "/home";
  localStorage.removeItem("redirectPath");
  sessionStorage.removeItem("redirectPath");
  return path;
}
