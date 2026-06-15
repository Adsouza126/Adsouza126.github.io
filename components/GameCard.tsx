import Link from "next/link";
import { MapPin, Users, Clock } from "lucide-react";
import { Card, CardBody, Badge } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { formatGameTime } from "@/lib/utils";
import type { GameWithMeta } from "@/lib/types";

/** Compact card used in discovery, dashboard and community lists. */
export function GameCard({ game }: { game: GameWithMeta }) {
  const open = game.max_players - game.participant_count;
  const full = open <= 0;

  return (
    <Link href={`/games/${game.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardBody className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{game.sport.icon}</span>
              <div>
                <h3 className="font-semibold leading-tight text-ink-900">
                  {game.title || `${game.sport.name} pickup`}
                </h3>
                <p className="text-xs text-ink-500">{game.sport.name}</p>
              </div>
            </div>
            <Badge tone={game.competitive ? "amber" : "brand"}>
              {game.competitive ? "Competitive" : "Casual"}
            </Badge>
          </div>

          <div className="mt-4 space-y-1.5 text-sm text-ink-600">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-400" />
              {formatGameTime(game.starts_at)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ink-400" />
              {game.location}
              {game.campus_area ? ` · ${game.campus_area}` : ""}
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 text-ink-400" />
              {game.participant_count}/{game.max_players} players
              {game.skill_target !== "Any" ? (
                <span className="text-ink-400">· {game.skill_target}</span>
              ) : null}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
            <div className="flex items-center gap-2">
              <Avatar
                name={game.host.full_name}
                url={game.host.avatar_url}
                size={24}
              />
              <span className="text-xs text-ink-500">
                {game.host.full_name?.split(" ")[0] ?? "Host"}
              </span>
            </div>
            <Badge tone={full ? "risky" : "great"}>
              {full ? "Full" : `${open} spot${open === 1 ? "" : "s"} left`}
            </Badge>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
