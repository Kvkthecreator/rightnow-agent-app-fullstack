// web/lib/auth/getRedirectPath.ts

export function getRedirectPath(): string {
  if (typeof window === "undefined") return "/dashboard/home";

  const path = localStorage.getItem("redirectPath") ?? "/dashboard/home";
  localStorage.removeItem("redirectPath");
  sessionStorage.removeItem("redirectPath");
  return path;
}
