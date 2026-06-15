// ──────────────────────────────────────────────────────────────────────────
// Server-side data access. These run in Server Components / actions and use
// the cookie-aware Supabase client (so RLS applies as the current user).
// ──────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import type { GameWithMeta, Profile, Sport } from "@/lib/types";
import type { SkillLevel } from "@/lib/constants";
import type { UserContext } from "@/lib/recommendations";

/** Selection string that hydrates a game with sport, host and a join count. */
const GAME_SELECT = `
  *,
  sport:sports(*),
  host:profiles!games_host_id_fkey(id, full_name, avatar_url, reliability_score),
  game_participants(count)
`;

type RawGame = Record<string, unknown> & {
  sport: Sport;
  host: GameWithMeta["host"];
  game_participants: { count: number }[];
};

function toGameWithMeta(row: RawGame): GameWithMeta {
  const { game_participants, ...rest } = row;
  return {
    ...(rest as unknown as GameWithMeta),
    sport: row.sport,
    host: row.host,
    participant_count: game_participants?.[0]?.count ?? 0,
  };
}

export async function getSports(): Promise<Sport[]> {
  const supabase = createClient();
  const { data } = await supabase.from("sports").select("*").order("name");
  return (data as Sport[]) ?? [];
}

/** Map of the user's sport_id → skill level, for matchmaking + balancing. */
export async function getUserContext(profile: Profile): Promise<UserContext> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_sports")
    .select("sport_id, skill_level")
    .eq("user_id", profile.id);

  const skillBySport: Record<string, SkillLevel> = {};
  (data ?? []).forEach((r) => {
    skillBySport[r.sport_id as string] = r.skill_level as SkillLevel;
  });
  return { profile, skillBySport };
}

export type GameFilters = {
  sportId?: string;
  college?: string;
  skill?: string;
  competitive?: "casual" | "competitive";
  date?: string; // YYYY-MM-DD
  openOnly?: boolean;
};

/** Upcoming, scheduled, public games matching the given filters. */
export async function getDiscoverableGames(
  filters: GameFilters = {},
): Promise<GameWithMeta[]> {
  const supabase = createClient();
  let query = supabase
    .from("games")
    .select(GAME_SELECT)
    .eq("status", "scheduled")
    .eq("is_public", true)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (filters.sportId) query = query.eq("sport_id", filters.sportId);
  if (filters.college) query = query.eq("college", filters.college);
  if (filters.skill && filters.skill !== "Any")
    query = query.in("skill_target", [filters.skill, "Any"]);
  if (filters.competitive)
    query = query.eq("competitive", filters.competitive === "competitive");
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00`);
    const end = new Date(`${filters.date}T23:59:59`);
    query = query
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString());
  }

  const { data } = await query;
  let games = ((data as RawGame[]) ?? []).map(toGameWithMeta);

  if (filters.openOnly) {
    games = games.filter((g) => g.participant_count < g.max_players);
  }
  return games;
}

/** Games the user has joined or is hosting (any status), newest first. */
export async function getMyGames(userId: string): Promise<GameWithMeta[]> {
  const supabase = createClient();

  const { data: parts } = await supabase
    .from("game_participants")
    .select("game_id")
    .eq("user_id", userId);
  const ids = (parts ?? []).map((p) => p.game_id as string);

  // Build an OR that covers games I host or have joined.
  const orFilter = ids.length
    ? `host_id.eq.${userId},id.in.(${ids.join(",")})`
    : `host_id.eq.${userId}`;

  const { data } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .or(orFilter)
    .order("starts_at", { ascending: true });

  return ((data as RawGame[]) ?? []).map(toGameWithMeta);
}

export async function getGameById(id: string): Promise<GameWithMeta | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? toGameWithMeta(data as RawGame) : null;
}
