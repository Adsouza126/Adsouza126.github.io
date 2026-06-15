import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui";
import { SKILL_VALUE } from "@/lib/constants";
import type { ParticipantView } from "./types";

function teamSkill(players: ParticipantView[]) {
  return players.reduce((sum, p) => sum + SKILL_VALUE[p.skill_level], 0);
}

function TeamColumn({
  label,
  tone,
  players,
}: {
  label: string;
  tone: "brand" | "amber";
  players: ParticipantView[];
}) {
  return (
    <div className="rounded-xl border border-ink-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-bold text-ink-900">{label}</h4>
        <Badge tone={tone}>Skill {teamSkill(players)}</Badge>
      </div>
      <ul className="space-y-2.5">
        {players.map((p) => (
          <li key={p.user_id} className="flex items-center gap-2.5">
            <Avatar name={p.name} url={p.avatar_url} size={28} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-800">
                {p.name}
              </p>
              <p className="text-xs text-ink-500">
                {p.skill_level}
                {p.preferred_position ? ` · ${p.preferred_position}` : ""}
              </p>
            </div>
          </li>
        ))}
        {players.length === 0 ? (
          <li className="text-sm text-ink-400">No players</li>
        ) : null}
      </ul>
    </div>
  );
}

/** Renders the balanced Team A vs. Team B line-ups. */
export function TeamDisplay({
  teamA,
  teamB,
}: {
  teamA: ParticipantView[];
  teamB: ParticipantView[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TeamColumn label="Team A" tone="brand" players={teamA} />
      <TeamColumn label="Team B" tone="amber" players={teamB} />
    </div>
  );
}
