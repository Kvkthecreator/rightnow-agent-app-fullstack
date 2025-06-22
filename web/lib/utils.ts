import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAuthError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("No access token");
}
