import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type StatusLevel = "good" | "warn" | "bad";

export function statusClasses(level: StatusLevel): string {
  switch (level) {
    case "good":
      return "border-green-200 bg-green-50 text-green-900";
    case "warn":
      return "border-yellow-200 bg-yellow-50 text-yellow-900";
    case "bad":
      return "border-red-200 bg-red-50 text-red-900";
  }
}

// navigator.clipboard requires a secure context (HTTPS, or localhost on desktop).
// Accessing the app over http://<lan-ip>: from a phone doesn't qualify, so it's
// undefined there and needs a execCommand fallback instead.
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const success = document.execCommand("copy");
  document.body.removeChild(textarea);
  return success;
}
