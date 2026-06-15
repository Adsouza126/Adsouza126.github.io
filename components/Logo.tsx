import Link from "next/link";
import { cn } from "@/lib/utils";

/** Rally wordmark with a small "racket" mark. */
export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M12 3a6 6 0 0 1 6 6c0 2.5-1.6 4.2-3 5.2L12 21l-3-6.8C7.6 13.2 6 11.5 6 9a6 6 0 0 1 6-6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9" r="2" fill="currentColor" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight text-ink-900">
        Rally
      </span>
    </Link>
  );
}
