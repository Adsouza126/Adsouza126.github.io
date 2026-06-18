import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Rally logo. Renders the uploaded brand logo (navy "R" with location pin +
 * orange "RALLY" wordmark). Height is controlled via `className` (defaults to
 * a navbar-friendly size).
 */
export function Logo({
  className,
  href = "/",
  imgClassName,
}: {
  className?: string;
  href?: string;
  imgClassName?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/rally-logo.jpg"
        alt="Rally"
        className={cn("h-9 w-auto select-none", imgClassName)}
      />
    </Link>
  );
}
