import { ShieldCheck } from "lucide-react";
import { reliabilityBadge } from "@/lib/constants";
import { Badge } from "@/components/ui";

/** Renders the reliability tier badge for a score (90+/70+/<70). */
export function ReliabilityBadge({
  score,
  showScore = true,
}: {
  score: number;
  showScore?: boolean;
}) {
  const { label, tone } = reliabilityBadge(score);
  return (
    <Badge tone={tone}>
      <ShieldCheck className="h-3.5 w-3.5" />
      {label}
      {showScore ? <span className="opacity-70">· {score}</span> : null}
    </Badge>
  );
}
