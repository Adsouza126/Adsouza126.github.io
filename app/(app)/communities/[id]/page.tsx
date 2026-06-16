import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users, CalendarDays, MessagesSquare } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  getDiscoverableGames,
  getCommunityById,
  getCommunityMembers,
  getCommunityMessages,
} from "@/lib/queries";
import { Card, CardBody, ButtonLink, SectionTitle, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { GameCard } from "@/components/GameCard";
import { CommunityJoinButton } from "@/components/community/CommunityJoinButton";
import {
  CommunityDiscussion,
  type DiscussionPost,
} from "@/components/community/CommunityDiscussion";
import type { Sport } from "@/lib/types";

export default async function CommunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireProfile();

  const community = await getCommunityById(params.id);
  if (!community) notFound();

  const sport = community.sport as Sport;

  const [members, postRows, games] = await Promise.all([
    getCommunityMembers(community.id as string),
    getCommunityMessages(community.id as string),
    getDiscoverableGames({
      sportId: community.sport_id as string,
      college: community.college as string,
    }),
  ]);

  const isMember = members.some((m) => m.user_id === profile.id);
  const posts = postRows as unknown as DiscussionPost[];

  return (
    <div className="space-y-6">
      <Link
        href="/communities"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-4 w-4" /> All communities
      </Link>

      {/* Header */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{sport.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">
                {community.name}
              </h1>
              <p className="text-sm text-ink-500">{community.description}</p>
            </div>
          </div>
          <CommunityJoinButton communityId={community.id} isMember={isMember} />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Upcoming games */}
          <section>
            <SectionTitle
              title="Upcoming games"
              action={
                <ButtonLink href="/games/new" size="sm">
                  <Plus className="h-4 w-4" /> Create
                </ButtonLink>
              }
            />
            {games.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {games.map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-8 w-8" />}
                title="No upcoming games"
                description={`Be the first to host a ${sport.name} game here.`}
                action={
                  <ButtonLink href="/games/new" size="sm">
                    Create a game
                  </ButtonLink>
                }
              />
            )}
          </section>

          {/* Discussion */}
          <section>
            <SectionTitle title="Discussion" />
            <Card>
              <CardBody>
                <CommunityDiscussion
                  communityId={community.id}
                  posts={posts}
                  canPost={isMember}
                />
              </CardBody>
            </Card>
          </section>
        </div>

        {/* Members */}
        <div>
          <Card>
            <CardBody>
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink-900">
                <Users className="h-4 w-4 text-brand-600" />
                Members ({members.length})
              </h3>
              <ul className="space-y-3">
                {members.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-3">
                    <Avatar name={m.full_name} url={m.avatar_url} size={36} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">
                      {m.full_name}
                    </span>
                    <ReliabilityBadge
                      score={m.reliability_score}
                      showScore={false}
                    />
                  </li>
                ))}
                {members.length === 0 ? (
                  <li className="flex flex-col items-center gap-1 py-4 text-center text-sm text-ink-400">
                    <MessagesSquare className="h-6 w-6" />
                    No members yet — join to get started.
                  </li>
                ) : null}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
