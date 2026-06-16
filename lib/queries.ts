// ──────────────────────────────────────────────────────────────────────────
// Server-side data access. These run in Server Components / actions.
//
// Each function has two implementations:
//   • Supabase  — when a project is configured (real auth + Postgres).
//   • Demo      — in-memory sample data when no env is set (see lib/demo.ts).
// ──────────────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { IS_DEMO, demo } from "@/lib/demo";
import type { Community, GameWithMeta, Profile, Sport } from "@/lib/types";
import type { SkillLevel } from "@/lib/constants";
import type { UserContext } from "@/lib/recommendations";
import type { ParticipantView } from "@/components/game/types";

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
  if (IS_DEMO) return demo.sports();
  const supabase = createClient();
  const { data } = await supabase.from("sports").select("*").order("name");
  return (data as Sport[]) ?? [];
}

export async function getColleges(): Promise<string[]> {
  if (IS_DEMO) return demo.colleges();
  const supabase = createClient();
  const { data } = await supabase.from("colleges").select("name").order("name");
  return (data ?? []).map((c) => c.name as string);
}

/** Map of the user's sport_id → skill level, for matchmaking + balancing. */
export async function getUserContext(profile: Profile): Promise<UserContext> {
  if (IS_DEMO) return { profile, skillBySport: demo.skillBySport(profile.id) };
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
  if (IS_DEMO) return demo.discoverableGames(filters);

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
  if (IS_DEMO) return demo.myGames(userId);

  const supabase = createClient();
  const { data: parts } = await supabase
    .from("game_participants")
    .select("game_id")
    .eq("user_id", userId);
  const ids = (parts ?? []).map((p) => p.game_id as string);

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
  if (IS_DEMO) return demo.gameById(id);
  const supabase = createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_SELECT)
    .eq("id", id)
    .maybeSingle();
  return data ? toGameWithMeta(data as RawGame) : null;
}

/** Roster for a game with each player's skill/position for the game's sport. */
export async function getGameParticipants(
  game: GameWithMeta,
): Promise<ParticipantView[]> {
  if (IS_DEMO) return demo.gameParticipants(game.id);

  const supabase = createClient();
  const { data: rows } = await supabase
    .from("game_participants")
    .select(
      "user_id, team, profile:profiles!game_participants_user_id_fkey(id, full_name, avatar_url, reliability_score)",
    )
    .eq("game_id", game.id)
    .order("joined_at", { ascending: true });

  const userIds = (rows ?? []).map((p) => p.user_id as string);
  const { data: skills } = userIds.length
    ? await supabase
        .from("user_sports")
        .select("user_id, skill_level, preferred_position")
        .eq("sport_id", game.sport_id)
        .in("user_id", userIds)
    : { data: [] };

  const skillMap = new Map(
    (skills ?? []).map((s) => [
      s.user_id as string,
      {
        skill_level: s.skill_level as SkillLevel,
        preferred_position: s.preferred_position as string | null,
      },
    ]),
  );

  return (rows ?? []).map((p) => {
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
}

export type ChatMsg = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: { full_name: string | null; avatar_url: string | null } | null;
};

export async function getGameMessages(gameId: string): Promise<ChatMsg[]> {
  if (IS_DEMO) return demo.gameMessages(gameId) as ChatMsg[];
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select(
      "id, body, created_at, user_id, author:profiles!messages_user_id_fkey(full_name, avatar_url)",
    )
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as ChatMsg[];
}

// ── Communities ─────────────────────────────────────────────────────────────

export type CommunityCardData = {
  id: string;
  name: string;
  college: string;
  description: string | null;
  sport: { name: string; icon: string | null };
  memberCount: number;
};

export async function getCommunitiesWithMeta(): Promise<CommunityCardData[]> {
  if (IS_DEMO) return demo.communitiesWithMeta();
  const supabase = createClient();
  const { data } = await supabase
    .from("communities")
    .select(
      "id, name, college, description, sport:sports(name, icon), community_members(count)",
    )
    .order("college")
    .order("name");
  return ((data ?? []) as unknown as {
    id: string;
    name: string;
    college: string;
    description: string | null;
    sport: { name: string; icon: string | null };
    community_members: { count: number }[];
  }[]).map((c) => ({
    id: c.id,
    name: c.name,
    college: c.college,
    description: c.description,
    sport: c.sport,
    memberCount: c.community_members?.[0]?.count ?? 0,
  }));
}

export async function getMyCommunityIds(userId: string): Promise<string[]> {
  if (IS_DEMO) return demo.myCommunityIds(userId);
  const supabase = createClient();
  const { data } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId);
  return (data ?? []).map((m) => m.community_id as string);
}

export async function getCommunitiesByCollege(college: string) {
  if (IS_DEMO) return demo.communitiesByCollege(college);
  const supabase = createClient();
  const { data } = await supabase
    .from("communities")
    .select("id, name, slug, college, sport_id, description")
    .eq("college", college)
    .limit(8);
  return data ?? [];
}

export async function getCommunityById(
  id: string,
): Promise<(Community & { sport: Sport }) | null> {
  if (IS_DEMO) return demo.communityById(id);
  const supabase = createClient();
  const { data } = await supabase
    .from("communities")
    .select("*, sport:sports(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as (Community & { sport: Sport }) | null) ?? null;
}

export async function getCommunityMembers(communityId: string) {
  if (IS_DEMO) return demo.communityMembers(communityId);
  const supabase = createClient();
  const { data } = await supabase
    .from("community_members")
    .select(
      "user_id, profile:profiles!community_members_user_id_fkey(id, full_name, avatar_url, reliability_score)",
    )
    .eq("community_id", communityId);
  return (data ?? []).map((m) => {
    const p = m.profile as unknown as {
      full_name: string | null;
      avatar_url: string | null;
      reliability_score: number;
    };
    return {
      user_id: m.user_id as string,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      reliability_score: p.reliability_score,
    };
  });
}

export async function getCommunityMessages(communityId: string) {
  if (IS_DEMO) return demo.communityMessages(communityId);
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select(
      "id, body, created_at, author:profiles!messages_user_id_fkey(full_name, avatar_url)",
    )
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    author: { full_name: string | null; avatar_url: string | null } | null;
  }[];
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function getUserSportsDetailed(userId: string) {
  if (IS_DEMO) return demo.userSportsDetailed(userId);
  const supabase = createClient();
  const { data } = await supabase
    .from("user_sports")
    .select("skill_level, preferred_position, sport:sports(name, icon)")
    .eq("user_id", userId);
  return (data ?? []) as unknown as {
    skill_level: string;
    preferred_position: string | null;
    sport: { name: string; icon: string | null };
  }[];
}

export async function getReliabilityLogs(userId: string) {
  if (IS_DEMO) return demo.reliabilityLogs(userId);
  const supabase = createClient();
  const { data } = await supabase
    .from("reliability_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(6);
  return (data ?? []) as {
    id: string;
    reason: string;
    delta: number;
    created_at: string;
  }[];
}
