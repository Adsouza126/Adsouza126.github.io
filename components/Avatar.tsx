import { avatarFor } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Round avatar with a deterministic fallback when no photo is set. */
export function Avatar({
  name,
  url,
  size = 40,
  className,
}: {
  name?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarFor(name ?? "Rally", url)}
      alt={name ?? "Player"}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("rounded-full bg-ink-100 object-cover", className)}
    />
  );
}
