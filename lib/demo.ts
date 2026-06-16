// ════════════════════════════════════════════════════════════════════════
// Demo mode — lets Rally run with NO database and NO environment variables.
//
// When `NEXT_PUBLIC_SUPABASE_URL` is not set, the app uses this in-memory
// store seeded with realistic University of Delaware sample data. This makes
// the deployed/local app work instantly for demos. Data lives in memory, so
// mutations persist only for the life of the server process (they reset on
// redeploy / cold start) — which is fine for a showcase.
// ════════════════════════════════════════════════════════════════════════

import type {
  Availability,
  SkillLevel,
} from "@/lib/constants";
import type {
  Community,
  GameWithMeta,
  Message,
  Profile,
  ReliabilityLog,
  Sport,
} from "@/lib/types";
import type { ParticipantView } from "@/components/game/types";
import { balanceTeams, type BalancePlayer } from "@/lib/teamBalancing";

/** True when no Supabase project is configured → run on demo data. */
export const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL;

const COLLEGE = "University of Delaware";

const availability: Availability = {
  Monday: ["Evening"],
  Wednesday: ["Afternoon", "Evening"],
  Friday: ["Evening"],
  Saturday: ["Morning", "Afternoon"],
  Sunday: ["Afternoon"],
};

// ── Reference data ──────────────────────────────────────────────────────────
const sports: Sport[] = [
  { id: "sp-bball", name: "Basketball", slug: "basketball", icon: "🏀", positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"], created_at: "" },
  { id: "sp-soccer", name: "Soccer", slug: "soccer", icon: "⚽", positions: ["Goalkeeper", "Defender", "Midfielder", "Forward"], created_at: "" },
  { id: "sp-tennis", name: "Tennis", slug: "tennis", icon: "🎾", positions: ["Singles", "Doubles"], created_at: "" },
  { id: "sp-volley", name: "Volleyball", slug: "volleyball", icon: "🏐", positions: ["Setter", "Outside Hitter", "Middle Blocker", "Libero"], created_at: "" },
  { id: "sp-flag", name: "Flag Football", slug: "flag-football", icon: "🏈", positions: ["Quarterback", "Receiver", "Rusher", "Defense"], created_at: "" },
  { id: "sp-pickle", name: "Pickleball", slug: "pickleball", icon: "🥒", positions: ["Singles", "Doubles"], created_at: "" },
];

const colleges = [COLLEGE, "Penn State University", "Rutgers University", "Temple University"];

function mkProfile(
  id: string,
  full_name: string,
  bio: string,
  campus_area: string,
  reliability_score = 100,
): Profile {
  return {
    id,
    full_name,
    email: `${id.replace("u-", "")}@udel.edu`,
    college: COLLEGE,
    avatar_url: null,
    bio,
    campus_area,
    preferred_distance: 5,
    availability,
    reliability_score,
    onboarded: true,
    created_at: "",
    updated_at: "",
  };
}

// ── Mutable demo state ──────────────────────────────────────────────────────
type UserSportRow = {
  user_id: string;
  sport_id: string;
  skill_level: SkillLevel;
  preferred_position: string | null;
};

type ParticipantRow = { game_id: string; user_id: string; team: "A" | "B" | null };

type State = {
  profiles: Profile[];
  userSports: UserSportRow[];
  communities: Community[];
  communityMembers: { community_id: string; user_id: string }[];
  games: Omit<GameWithMeta, "sport" | "host" | "participant_count">[];
  participants: ParticipantRow[];
  messages: Message[];
  reliabilityLogs: ReliabilityLog[];
};

/** The signed-in demo user. */
export const DEMO_USER_ID = "u-sarah";

function iso(daysFromNow: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function seed(): State {
  const profiles = [
    mkProfile("u-sarah", "Sarah Johnson", "Sophomore. Point guard who loves a fast break.", "Main Campus", 100),
    mkProfile("u-marcus", "Marcus Lee", "Grad student. Casual but competitive.", "South Campus", 92),
    mkProfile("u-priya", "Priya Patel", "Tennis since I was 8. Looking for doubles partners.", "Main Campus", 98),
    mkProfile("u-diego", "Diego Ramirez", "Striker. Will run all 90 minutes.", "The Green", 85),
    mkProfile("u-emily", "Emily Chen", "New to volleyball but improving fast.", "Main Campus", 100),
    mkProfile("u-tyler", "Tyler Brooks", "Center. Rebounds and screens are my love language.", "North Campus", 74),
    mkProfile("u-aisha", "Aisha Mohammed", "Midfield engine. Weekend volleyball too.", "Main Campus", 96),
    mkProfile("u-jordan", "Jordan Smith", "Defender who can play anywhere.", "South Campus", 68),
  ];

  const userSports: UserSportRow[] = [
    { user_id: "u-sarah", sport_id: "sp-bball", skill_level: "Competitive", preferred_position: "Point Guard" },
    { user_id: "u-sarah", sport_id: "sp-volley", skill_level: "Intermediate", preferred_position: "Setter" },
    { user_id: "u-marcus", sport_id: "sp-soccer", skill_level: "Intermediate", preferred_position: "Midfielder" },
    { user_id: "u-marcus", sport_id: "sp-bball", skill_level: "Casual", preferred_position: "Small Forward" },
    { user_id: "u-priya", sport_id: "sp-tennis", skill_level: "Competitive", preferred_position: "Doubles" },
    { user_id: "u-priya", sport_id: "sp-pickle", skill_level: "Intermediate", preferred_position: "Doubles" },
    { user_id: "u-diego", sport_id: "sp-soccer", skill_level: "Competitive", preferred_position: "Forward" },
    { user_id: "u-diego", sport_id: "sp-flag", skill_level: "Casual", preferred_position: "Receiver" },
    { user_id: "u-emily", sport_id: "sp-volley", skill_level: "Beginner", preferred_position: "Outside Hitter" },
    { user_id: "u-emily", sport_id: "sp-bball", skill_level: "Beginner", preferred_position: "Shooting Guard" },
    { user_id: "u-tyler", sport_id: "sp-bball", skill_level: "Intermediate", preferred_position: "Center" },
    { user_id: "u-tyler", sport_id: "sp-flag", skill_level: "Intermediate", preferred_position: "Rusher" },
    { user_id: "u-aisha", sport_id: "sp-soccer", skill_level: "Intermediate", preferred_position: "Midfielder" },
    { user_id: "u-aisha", sport_id: "sp-volley", skill_level: "Casual", preferred_position: "Libero" },
    { user_id: "u-jordan", sport_id: "sp-soccer", skill_level: "Casual", preferred_position: "Defender" },
    { user_id: "u-jordan", sport_id: "sp-bball", skill_level: "Casual", preferred_position: "Power Forward" },
  ];

  const communities: Community[] = [
    { id: "co-bball", name: "University of Delaware Basketball", slug: "ud-basketball", college: COLLEGE, sport_id: "sp-bball", description: "The home for Basketball players at University of Delaware. Find pickup games and teammates.", created_at: "" },
    { id: "co-soccer", name: "University of Delaware Soccer", slug: "ud-soccer", college: COLLEGE, sport_id: "sp-soccer", description: "The home for Soccer players at University of Delaware. Find pickup games and teammates.", created_at: "" },
    { id: "co-tennis", name: "University of Delaware Tennis", slug: "ud-tennis", college: COLLEGE, sport_id: "sp-tennis", description: "The home for Tennis players at University of Delaware. Find pickup games and teammates.", created_at: "" },
    { id: "co-volley", name: "University of Delaware Volleyball", slug: "ud-volleyball", college: COLLEGE, sport_id: "sp-volley", description: "The home for Volleyball players at University of Delaware. Find pickup games and teammates.", created_at: "" },
  ];

  const communityMembers = [
    { community_id: "co-bball", user_id: "u-sarah" },
    { community_id: "co-bball", user_id: "u-marcus" },
    { community_id: "co-bball", user_id: "u-tyler" },
    { community_id: "co-bball", user_id: "u-emily" },
    { community_id: "co-bball", user_id: "u-jordan" },
    { community_id: "co-soccer", user_id: "u-diego" },
    { community_id: "co-soccer", user_id: "u-marcus" },
    { community_id: "co-soccer", user_id: "u-aisha" },
    { community_id: "co-soccer", user_id: "u-jordan" },
    { community_id: "co-tennis", user_id: "u-priya" },
    { community_id: "co-volley", user_id: "u-sarah" },
    { community_id: "co-volley", user_id: "u-emily" },
    { community_id: "co-volley", user_id: "u-aisha" },
  ];

  const games: State["games"] = [
    { id: "g1", host_id: "u-sarah", sport_id: "sp-bball", title: "Friday night 5-on-5", starts_at: iso(3, 19), location: "Carpenter Sports Building, Court 2", campus_area: "Main Campus", college: COLLEGE, max_players: 10, skill_target: "Intermediate", competitive: true, is_public: true, description: "Bring a light & dark shirt. We'll auto-balance teams.", auto_balance: true, teams: null, status: "scheduled", created_at: "" },
    { id: "g2", host_id: "u-diego", sport_id: "sp-soccer", title: "Sunday pickup soccer", starts_at: iso(5, 15), location: "The Green (intramural fields)", campus_area: "The Green", college: COLLEGE, max_players: 14, skill_target: "Any", competitive: false, is_public: true, description: "All levels welcome. Pinnies provided.", auto_balance: true, teams: null, status: "scheduled", created_at: "" },
    { id: "g3", host_id: "u-priya", sport_id: "sp-tennis", title: "Doubles round-robin", starts_at: iso(2, 17), location: "UD Tennis Courts", campus_area: "Main Campus", college: COLLEGE, max_players: 4, skill_target: "Intermediate", competitive: true, is_public: true, description: "Rotating doubles. Bring water!", auto_balance: false, teams: null, status: "scheduled", created_at: "" },
    { id: "g4", host_id: "u-emily", sport_id: "sp-volley", title: "Beginner-friendly volleyball", starts_at: iso(4, 18), location: "Little Bob Gym", campus_area: "Main Campus", college: COLLEGE, max_players: 12, skill_target: "Beginner", competitive: false, is_public: true, description: "Super chill, learning-focused. New players encouraged!", auto_balance: true, teams: null, status: "scheduled", created_at: "" },
  ];

  const participants: ParticipantRow[] = [
    { game_id: "g1", user_id: "u-sarah", team: null },
    { game_id: "g1", user_id: "u-marcus", team: null },
    { game_id: "g1", user_id: "u-tyler", team: null },
    { game_id: "g1", user_id: "u-emily", team: null },
    { game_id: "g1", user_id: "u-jordan", team: null },
    { game_id: "g2", user_id: "u-diego", team: null },
    { game_id: "g2", user_id: "u-marcus", team: null },
    { game_id: "g2", user_id: "u-aisha", team: null },
    { game_id: "g2", user_id: "u-jordan", team: null },
    { game_id: "g3", user_id: "u-priya", team: null },
    { game_id: "g4", user_id: "u-emily", team: null },
    { game_id: "g4", user_id: "u-aisha", team: null },
  ];

  const messages: Message[] = [
    { id: "m1", game_id: "g1", community_id: null, user_id: "u-sarah", body: "Got the court booked for 7! See everyone there.", created_at: iso(-1, 10) },
    { id: "m2", game_id: "g1", community_id: null, user_id: "u-tyler", body: "I'll bring an extra ball 🏀", created_at: iso(-1, 11) },
    { id: "m3", game_id: "g2", community_id: null, user_id: "u-diego", body: "Weather looks great for Sunday ☀️", created_at: iso(-1, 9) },
    { id: "m4", community_id: "co-bball", game_id: null, user_id: "u-marcus", body: "Anyone want to run a tournament next month?", created_at: iso(-2, 14) },
    { id: "m5", community_id: "co-bball", game_id: null, user_id: "u-sarah", body: "I'm in! Let's organize it.", created_at: iso(-2, 15) },
  ];

  return {
    profiles,
    userSports,
    communities,
    communityMembers,
    games,
    participants,
    messages,
    reliabilityLogs: [],
  };
}

// Single shared state for the process lifetime.
const db: State = seed();

// ── Helpers ───────────────────────────────────────────────────────────────
const sportById = (id: string) => sports.find((s) => s.id === id)!;
const profileById = (id: string) => db.profiles.find((p) => p.id === id);

function hydrateGame(
  g: State["games"][number],
): GameWithMeta {
  const host = profileById(g.host_id)!;
  return {
    ...g,
    sport: sportById(g.sport_id),
    host: { id: host.id, full_name: host.full_name, avatar_url: host.avatar_url, reliability_score: host.reliability_score },
    participant_count: db.participants.filter((p) => p.game_id === g.id).length,
  };
}

// ── Public demo API (mirrors lib/queries.ts) ────────────────────────────────
export const demo = {
  currentProfile: () => profileById(DEMO_USER_ID)!,
  sports: () => sports,
  colleges: () => colleges,

  skillBySport(userId: string): Record<string, SkillLevel> {
    const map: Record<string, SkillLevel> = {};
    db.userSports.filter((u) => u.user_id === userId).forEach((u) => {
      map[u.sport_id] = u.skill_level;
    });
    return map;
  },

  discoverableGames(filters: {
    sportId?: string;
    college?: string;
    skill?: string;
    competitive?: "casual" | "competitive";
    date?: string;
    openOnly?: boolean;
  } = {}): GameWithMeta[] {
    const now = Date.now();
    let games = db.games
      .filter((g) => g.status === "scheduled" && g.is_public && new Date(g.starts_at).getTime() >= now)
      .map(hydrateGame);

    if (filters.sportId) games = games.filter((g) => g.sport_id === filters.sportId);
    if (filters.college) games = games.filter((g) => g.college === filters.college);
    if (filters.skill && filters.skill !== "Any")
      games = games.filter((g) => g.skill_target === filters.skill || g.skill_target === "Any");
    if (filters.competitive)
      games = games.filter((g) => g.competitive === (filters.competitive === "competitive"));
    if (filters.date)
      games = games.filter((g) => g.starts_at.slice(0, 10) === filters.date);
    if (filters.openOnly) games = games.filter((g) => g.participant_count < g.max_players);

    return games.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  },

  myGames(userId: string): GameWithMeta[] {
    const ids = new Set(
      db.participants.filter((p) => p.user_id === userId).map((p) => p.game_id),
    );
    return db.games
      .filter((g) => g.host_id === userId || ids.has(g.id))
      .map(hydrateGame)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  },

  gameById(id: string): GameWithMeta | null {
    const g = db.games.find((x) => x.id === id);
    return g ? hydrateGame(g) : null;
  },

  gameParticipants(gameId: string): ParticipantView[] {
    return db.participants
      .filter((p) => p.game_id === gameId)
      .map((p) => {
        const prof = profileById(p.user_id)!;
        const game = db.games.find((g) => g.id === gameId)!;
        const skill = db.userSports.find(
          (u) => u.user_id === p.user_id && u.sport_id === game.sport_id,
        );
        return {
          user_id: p.user_id,
          name: prof.full_name ?? "Player",
          avatar_url: prof.avatar_url,
          reliability_score: prof.reliability_score,
          skill_level: skill?.skill_level ?? "Casual",
          preferred_position: skill?.preferred_position ?? null,
          team: p.team,
        };
      });
  },

  gameMessages(gameId: string) {
    return db.messages
      .filter((m) => m.game_id === gameId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((m) => ({ ...m, author: authorOf(m.user_id) }));
  },

  communitiesWithMeta() {
    return db.communities.map((c) => ({
      ...c,
      sport: { name: sportById(c.sport_id).name, icon: sportById(c.sport_id).icon },
      memberCount: db.communityMembers.filter((m) => m.community_id === c.id).length,
    }));
  },

  myCommunityIds(userId: string) {
    return db.communityMembers.filter((m) => m.user_id === userId).map((m) => m.community_id);
  },

  communitiesByCollege(college: string) {
    return db.communities.filter((c) => c.college === college);
  },

  communityById(id: string) {
    const c = db.communities.find((x) => x.id === id);
    if (!c) return null;
    return { ...c, sport: sportById(c.sport_id) };
  },

  communityMembers(communityId: string) {
    return db.communityMembers
      .filter((m) => m.community_id === communityId)
      .map((m) => {
        const p = profileById(m.user_id)!;
        return { user_id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, reliability_score: p.reliability_score };
      });
  },

  communityMessages(communityId: string) {
    return db.messages
      .filter((m) => m.community_id === communityId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((m) => ({ ...m, author: authorOf(m.user_id) }));
  },

  userSportsDetailed(userId: string) {
    return db.userSports
      .filter((u) => u.user_id === userId)
      .map((u) => ({
        skill_level: u.skill_level,
        preferred_position: u.preferred_position,
        sport: { name: sportById(u.sport_id).name, icon: sportById(u.sport_id).icon },
      }));
  },

  reliabilityLogs(userId: string) {
    return db.reliabilityLogs
      .filter((l) => l.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6);
  },

  // ── Mutations ─────────────────────────────────────────────────────────────
  joinGame(gameId: string, userId: string) {
    if (!db.participants.some((p) => p.game_id === gameId && p.user_id === userId))
      db.participants.push({ game_id: gameId, user_id: userId, team: null });
  },
  leaveGame(gameId: string, userId: string) {
    db.participants = db.participants.filter(
      (p) => !(p.game_id === gameId && p.user_id === userId),
    );
  },
  cancelGame(gameId: string) {
    const g = db.games.find((x) => x.id === gameId);
    if (g) g.status = "cancelled";
  },
  createGame(input: Omit<State["games"][number], "id" | "teams" | "status" | "created_at" | "college"> & { college: string | null }) {
    const id = `g-${Date.now()}`;
    db.games.push({ ...input, id, teams: null, status: "scheduled", created_at: new Date().toISOString() });
    db.participants.push({ game_id: id, user_id: input.host_id, team: null });
    return id;
  },
  postGameMessage(gameId: string, userId: string, body: string) {
    db.messages.push({ id: `m-${Date.now()}`, game_id: gameId, community_id: null, user_id: userId, body, created_at: new Date().toISOString() });
  },
  postCommunityMessage(communityId: string, userId: string, body: string) {
    db.messages.push({ id: `m-${Date.now()}`, game_id: null, community_id: communityId, user_id: userId, body, created_at: new Date().toISOString() });
  },
  joinCommunity(communityId: string, userId: string) {
    if (!db.communityMembers.some((m) => m.community_id === communityId && m.user_id === userId))
      db.communityMembers.push({ community_id: communityId, user_id: userId });
  },
  leaveCommunity(communityId: string, userId: string) {
    db.communityMembers = db.communityMembers.filter(
      (m) => !(m.community_id === communityId && m.user_id === userId),
    );
  },
  generateTeams(gameId: string) {
    const game = db.games.find((g) => g.id === gameId);
    if (!game) return;
    const roster = db.participants.filter((p) => p.game_id === gameId);
    if (roster.length < 2) return;
    const players: BalancePlayer[] = roster.map((p) => {
      const prof = profileById(p.user_id)!;
      const skill = db.userSports.find((u) => u.user_id === p.user_id && u.sport_id === game.sport_id);
      return {
        user_id: p.user_id,
        name: prof.full_name ?? "Player",
        skill_level: skill?.skill_level ?? "Casual",
        preferred_position: skill?.preferred_position ?? null,
      };
    });
    const teams = balanceTeams(players);
    roster.forEach((p) => {
      p.team = teams.A.some((a) => a.user_id === p.user_id) ? "A" : "B";
    });
    game.teams = { A: teams.A.map((p) => p.user_id), B: teams.B.map((p) => p.user_id) };
  },
  recordAttendance(gameId: string, results: { userId: string; status: "attended" | "no_show" }[]) {
    for (const r of results) {
      const prof = profileById(r.userId);
      if (!prof) continue;
      const delta = r.status === "attended" ? 2 : -15;
      prof.reliability_score = Math.max(0, Math.min(100, prof.reliability_score + delta));
      db.reliabilityLogs.push({
        id: `rl-${Date.now()}-${r.userId}`,
        user_id: r.userId,
        game_id: gameId,
        delta,
        reason: r.status === "attended" ? "Attended game" : "No-show",
        new_score: prof.reliability_score,
        created_at: new Date().toISOString(),
      });
    }
    const g = db.games.find((x) => x.id === gameId);
    if (g) g.status = "completed";
  },
  saveProfile(input: Partial<Profile> & { sports?: UserSportRow[] }) {
    const p = profileById(DEMO_USER_ID)!;
    Object.assign(p, {
      full_name: input.full_name ?? p.full_name,
      college: input.college ?? p.college,
      bio: input.bio ?? p.bio,
      avatar_url: input.avatar_url ?? p.avatar_url,
      campus_area: input.campus_area ?? p.campus_area,
      preferred_distance: input.preferred_distance ?? p.preferred_distance,
      availability: input.availability ?? p.availability,
      onboarded: true,
    });
    if (input.sports) {
      db.userSports = db.userSports.filter((u) => u.user_id !== DEMO_USER_ID);
      db.userSports.push(...input.sports.map((s) => ({ ...s, user_id: DEMO_USER_ID })));
    }
  },
};

function authorOf(userId: string) {
  const p = profileById(userId);
  return p ? { full_name: p.full_name, avatar_url: p.avatar_url } : null;
}
