import { Plus, SearchX } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSports, getDiscoverableGames, type GameFilters as GF } from "@/lib/queries";
import { GameFilters } from "@/components/GameFilters";
import { GameCard } from "@/components/GameCard";
import { ButtonLink, EmptyState } from "@/components/ui";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  await requireProfile();
  const supabase = createClient();

  const filters: GF = {
    sportId: searchParams.sport,
    college: searchParams.college,
    skill: searchParams.skill,
    competitive:
      searchParams.type === "casual" || searchParams.type === "competitive"
        ? searchParams.type
        : undefined,
    date: searchParams.date,
    openOnly: searchParams.open === "1",
  };

  const [sports, games, { data: colleges }] = await Promise.all([
    getSports(),
    getDiscoverableGames(filters),
    supabase.from("colleges").select("name").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Discover games</h1>
          <p className="text-sm text-ink-500">
            Find a pickup game that fits your schedule.
          </p>
        </div>
        <ButtonLink href="/games/new">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create a game</span>
        </ButtonLink>
      </div>

      <GameFilters
        sports={sports}
        colleges={(colleges ?? []).map((c) => c.name as string)}
      />

      {games.length ? (
        <>
          <p className="text-sm text-ink-500">
            {games.length} game{games.length === 1 ? "" : "s"} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<SearchX className="h-8 w-8" />}
          title="No games match your filters"
          description="Try widening your filters, or be the first to host one."
          action={
            <ButtonLink href="/games/new" size="sm">
              Create a game
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
