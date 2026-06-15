// ──────────────────────────────────────────────────────────────────────────
// Database row types + the typed `Database` schema for the Supabase client.
// These mirror supabase/schema.sql.
// ──────────────────────────────────────────────────────────────────────────

import type { Availability, SkillLevel, SkillTarget } from "./constants";

/** Standard shape returned by server actions. */
export type ActionResult = { ok?: boolean; error?: string; id?: string };

export type College = {
  id: string;
  name: string;
  slug: string;
  email_domain: string | null;
  created_at: string;
};

export type Sport = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  positions: string[];
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  college: string | null;
  avatar_url: string | null;
  bio: string | null;
  campus_area: string | null;
  preferred_distance: number | null;
  availability: Availability;
  reliability_score: number;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type UserSport = {
  id: string;
  user_id: string;
  sport_id: string;
  skill_level: SkillLevel;
  preferred_position: string | null;
  created_at: string;
};

export type GameStatus = "scheduled" | "completed" | "cancelled";

export type Teams = { A: string[]; B: string[] } | null;

export type Game = {
  id: string;
  host_id: string;
  sport_id: string;
  title: string | null;
  starts_at: string;
  location: string;
  campus_area: string | null;
  college: string | null;
  max_players: number;
  skill_target: SkillTarget;
  competitive: boolean;
  is_public: boolean;
  description: string | null;
  auto_balance: boolean;
  teams: Teams;
  status: GameStatus;
  created_at: string;
};

export type GameParticipant = {
  id: string;
  game_id: string;
  user_id: string;
  team: "A" | "B" | null;
  joined_at: string;
};

export type Community = {
  id: string;
  name: string;
  slug: string;
  college: string;
  sport_id: string;
  description: string | null;
  created_at: string;
};

export type CommunityMember = {
  id: string;
  community_id: string;
  user_id: string;
  joined_at: string;
};

export type Message = {
  id: string;
  user_id: string;
  game_id: string | null;
  community_id: string | null;
  body: string;
  created_at: string;
};

export type Attendance = {
  id: string;
  game_id: string;
  user_id: string;
  status: "attended" | "no_show";
  recorded_by: string | null;
  created_at: string;
};

export type ReliabilityLog = {
  id: string;
  user_id: string;
  game_id: string | null;
  delta: number;
  reason: string;
  new_score: number;
  created_at: string;
};

// ── Composite shapes used by the UI ───────────────────────────────────────

export type GameWithMeta = Game & {
  sport: Sport;
  host: Pick<Profile, "id" | "full_name" | "avatar_url" | "reliability_score">;
  participant_count: number;
};

export type ParticipantWithProfile = GameParticipant & {
  profile: Profile;
  // The participant's skill level for this game's sport, if known.
  skill_level?: SkillLevel;
  preferred_position?: string | null;
};

// ──────────────────────────────────────────────────────────────────────────
// Minimal generic Database type for `createClient<Database>()`.
// Reads use the Row types above; writes accept partials.
// ──────────────────────────────────────────────────────────────────────────

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      colleges: Table<College>;
      sports: Table<Sport>;
      profiles: Table<Profile>;
      user_sports: Table<UserSport>;
      games: Table<Game>;
      game_participants: Table<GameParticipant>;
      communities: Table<Community>;
      community_members: Table<CommunityMember>;
      messages: Table<Message>;
      attendance: Table<Attendance>;
      reliability_logs: Table<ReliabilityLog>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
