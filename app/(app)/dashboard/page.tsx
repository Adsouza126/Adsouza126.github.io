import Link from "next/link";
import { Plus, CalendarDays, Sparkles, Users, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getMyGames,
  getDiscoverableGames,
  getUserContext,
} from "@/lib/queries";
import { recommendGames } from "@/lib/recommendations";
import { GameCard } from "@/components/GameCard";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import {
  ButtonLink,
  Card,
  CardBody,
  EmptyState,
  SectionTitle,
} from "@/components/ui";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [myGames, allGames, ctx] = await Promise.all([
    getMyGames(profile.id),
    getDiscoverableGames(),
    getUserContext(profile),
  ]);

  const now = Date.now();
  const upcoming = myGames.filter(
    (g) => g.status === "scheduled" && new Date(g.starts_at).getTime() >= now,
  );
  const myGameIds = new Set(myGames.map((g) => g.id));

  const recommended = recommendGames(
    ctx,
    allGames.filter((g) => !myGameIds.has(g.id)),
  ).slice(0, 6);

  // Suggested communities at the user's college the user hasn't joined.
  const { data: memberRows } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", profile.id);
  const joinedCommunityIds = new Set(
    (memberRows ?? []).map((m) => m.community_id as string),
  );

  const { data: communities } = await supabase
    .from("communities")
    .select("id, name, slug, college, sport_id, description")
    .eq("college", profile.college ?? "")
    .limit(8);

  const suggestedCommunities = (communities ?? [])
    .filter((c) => !joinedCommunityIds.has(c.id))
    .slice(0, 3);

  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-ink-500">
            {profile.college ?? "Your campus"} · Here&apos;s what&apos;s
            happening.
          </p>
        </div>
        <ButtonLink href="/games/new">
          <Plus className="h-4 w-4" />
          Create a game
        </ButtonLink>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-500">Reliability</p>
              <p className="text-3xl font-bold text-ink-900">
                {profile.reliability_score}
              </p>
              <div className="mt-1">
                <ReliabilityBadge
                  score={profile.reliability_score}
                  showScore={false}
                />
              </div>
            </div>
            <Trophy className="h-9 w-9 text-brand-500" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-500">Upcoming games</p>
              <p className="text-3xl font-bold text-ink-900">
                {upcoming.length}
              </p>
              <p className="mt-1 text-xs text-ink-400">games you&apos;ve joined</p>
            </div>
            <CalendarDays className="h-9 w-9 text-brand-500" />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-500">Recommended</p>
              <p className="text-3xl font-bold text-ink-900">
                {recommended.length}
              </p>
              <p className="mt-1 text-xs text-ink-400">matches for you</p>
            </div>
            <Sparkles className="h-9 w-9 text-brand-500" />
          </CardBody>
        </Card>
      </div>

      {/* Upcoming games */}
      <section>
        <SectionTitle
          title="Your upcoming games"
          action={
            <Link href="/games" className="text-sm font-medium text-brand-700">
              Browse all
            </Link>
          }
        />
        {upcoming.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title="No games yet"
            description="Join a recommended game below or create your own."
            action={
              <ButtonLink href="/games" size="sm">
                Discover games
              </ButtonLink>
            }
          />
        )}
      </section>

      {/* Recommended */}
      <section>
        <SectionTitle title="Recommended for you" />
        {recommended.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="No matches right now"
            description="Check back soon, or create a game and invite your campus."
          />
        )}
      </section>

      {/* Suggested communities */}
      <section>
        <SectionTitle
          title="Communities to join"
          action={
            <Link
              href="/communities"
              className="text-sm font-medium text-brand-700"
            >
              See all
            </Link>
          }
        />
        {suggestedCommunities.length ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {suggestedCommunities.map((c) => (
              <Link key={c.id} href={`/communities/${c.id}`}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardBody>
                    <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-ink-900">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-500">
                      {c.description}
                    </p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="You're all caught up"
            description="You've joined the communities at your campus."
          />
        )}
      </section>
    </div>
  );
}
