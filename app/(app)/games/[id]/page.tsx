import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Target,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getGameById } from "@/lib/queries";
import { Card, CardBody, Badge } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { GameActionsBar } from "@/components/game/GameActionsBar";
import { HostPanel } from "@/components/game/HostPanel";
import { GameChat, type ChatMessage } from "@/components/game/GameChat";
import { TeamDisplay } from "@/components/game/TeamDisplay";
import type { ParticipantView } from "@/components/game/types";
import { formatGameTime } from "@/lib/utils";
import type { SkillLevel } from "@/lib/constants";

export default async function GameDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();
  const supabase = createClient();
  const game = await getGameById(params.id);
  if (!game) notFound();

  // Roster with profiles.
  const { data: participantRows } = await supabase
    .from("game_participants")
    .select(
      "user_id, team, profile:profiles!game_participants_user_id_fkey(id, full_name, avatar_url, reliability_score)",
    )
    .eq("game_id", game.id)
    .order("joined_at", { ascending: true });

  // Each player's skill for this sport.
  const userIds = (participantRows ?? []).map((p) => p.user_id as string);
  const { data: skillRows } = userIds.length
    ? await supabase
        .from("user_sports")
        .select("user_id, skill_level, preferred_position")
        .eq("sport_id", game.sport_id)
        .in("user_id", userIds)
    : { data: [] };

  const skillMap = new Map(
    (skillRows ?? []).map((s) => [
      s.user_id as string,
      {
        skill_level: s.skill_level as SkillLevel,
        preferred_position: s.preferred_position as string | null,
      },
    ]),
  );

  const participants: ParticipantView[] = (participantRows ?? []).map((p) => {
    const prof = p.profile as unknown as {
      full_name: string | null;
      avatar_url: string | null;
      reliability_score: number;
    } | null;
    const meta = skillMap.get(p.user_id as string);
    return {
      user_id: p.user_id as string,
      name: prof?.full_name ?? "Player",
      avatar_url: prof?.avatar_url ?? null,
      reliability_score: prof?.reliability_score ?? 100,
      skill_level: meta?.skill_level ?? "Casual",
      preferred_position: meta?.preferred_position ?? null,
      team: (p.team as "A" | "B" | null) ?? null,
    };
  });

  // Chat messages.
  const { data: messageRows } = await supabase
    .from("messages")
    .select(
      "id, body, created_at, user_id, author:profiles!messages_user_id_fkey(full_name, avatar_url)",
    )
    .eq("game_id", game.id)
    .order("created_at", { ascending: true });
  const messages = (messageRows ?? []) as unknown as ChatMessage[];

  const isHost = game.host_id === profile.id;
  const isParticipant = participants.some((p) => p.user_id === profile.id);
  const isFull = participants.length >= game.max_players;

  const byId = new Map(participants.map((p) => [p.user_id, p]));
  const teamA = (game.teams?.A ?? [])
    .map((id) => byId.get(id))
    .filter(Boolean) as ParticipantView[];
  const teamB = (game.teams?.B ?? [])
    .map((id) => byId.get(id))
    .filter(Boolean) as ParticipantView[];
  const hasTeams = teamA.length > 0 || teamB.length > 0;

  return (
    <div className="space-y-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to games
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{game.sport.icon}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-ink-900">
                      {game.title || `${game.sport.name} pickup`}
                    </h1>
                    <p className="text-sm text-ink-500">{game.sport.name}</p>
                  </div>
                </div>
                <Badge tone={game.competitive ? "amber" : "brand"}>
                  {game.competitive ? "Competitive" : "Casual"}
                </Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info icon={Clock} label={formatGameTime(game.starts_at)} />
                <Info
                  icon={MapPin}
                  label={`${game.location}${
                    game.campus_area ? ` · ${game.campus_area}` : ""
                  }`}
                />
                <Info
                  icon={Users}
                  label={`${participants.length}/${game.max_players} players`}
                />
                <Info
                  icon={Target}
                  label={
                    game.skill_target === "Any"
                      ? "All skill levels"
                      : `${game.skill_target} level`
                  }
                />
              </div>

              {game.description ? (
                <p className="mt-5 whitespace-pre-wrap text-sm text-ink-700">
                  {game.description}
                </p>
              ) : null}

              <div className="mt-5 border-t border-ink-100 pt-4">
                <GameActionsBar
                  gameId={game.id}
                  isHost={isHost}
                  isParticipant={isParticipant}
                  isFull={isFull}
                  status={game.status}
                />
              </div>
            </CardBody>
          </Card>

          {/* Teams */}
          {hasTeams ? (
            <Card>
              <CardBody>
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink-900">
                  <Trophy className="h-4 w-4 text-brand-600" />
                  Balanced teams
                </h3>
                <TeamDisplay teamA={teamA} teamB={teamB} />
              </CardBody>
            </Card>
          ) : null}

          {/* Host controls */}
          {isHost ? (
            <HostPanel
              gameId={game.id}
              participants={participants}
              hasTeams={hasTeams}
              status={game.status}
            />
          ) : null}

          {/* Chat */}
          <Card>
            <CardBody>
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink-900">
                <MessageSquare className="h-4 w-4 text-brand-600" />
                Game chat
              </h3>
              <GameChat
                gameId={game.id}
                messages={messages}
                currentUserId={profile.id}
                canPost={isParticipant || isHost}
              />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar: players */}
        <div className="space-y-6">
          <Card>
            <CardBody>
              <h3 className="mb-3 font-semibold text-ink-900">
                Players ({participants.length})
              </h3>
              <ul className="space-y-3">
                {participants.map((p) => (
                  <li key={p.user_id} className="flex items-center gap-3">
                    <Avatar name={p.name} url={p.avatar_url} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-800">
                        {p.name}
                        {p.user_id === game.host_id ? (
                          <span className="ml-1.5 text-xs font-normal text-brand-600">
                            Host
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-ink-500">{p.skill_level}</p>
                    </div>
                    <ReliabilityBadge
                      score={p.reliability_score}
                      showScore={false}
                    />
                  </li>
                ))}
                {participants.length === 0 ? (
                  <li className="text-sm text-ink-400">No players yet.</li>
                ) : null}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center gap-3">
              <Avatar
                name={game.host.full_name}
                url={game.host.avatar_url}
                size={44}
              />
              <div>
                <p className="text-xs text-ink-500">Hosted by</p>
                <p className="font-medium text-ink-800">
                  {game.host.full_name}
                </p>
                <div className="mt-1">
                  <ReliabilityBadge score={game.host.reliability_score} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <p className="flex items-center gap-2 text-sm text-ink-700">
      <Icon className="h-4 w-4 text-ink-400" />
      {label}
    </p>
  );
}
