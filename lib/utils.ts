import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNowStrict, isPast } from "date-fns";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Sat, Jun 21 · 3:30 PM" */
export function formatGameTime(iso: string): string {
  return format(new Date(iso), "EEE, MMM d · h:mm a");
}

/** "in 3 days" / "2 hours ago" */
export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const suffix = isPast(date) ? " ago" : "";
  const prefix = isPast(date) ? "" : "in ";
  return prefix + formatDistanceToNowStrict(date) + suffix;
}

/** Deterministic avatar fallback using DiceBear. */
export function avatarFor(seed: string, url?: string | null): string {
  if (url) return url;
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
    seed || "Rally",
  )}&backgroundType=gradientLinear`;
}

/** Turns "Sarah Johnson" → "SJ". */
export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
