// ──────────────────────────────────────────────────────────────────────────
// Lightweight matchmaking / recommendation scoring.
//
// Given a user and a candidate game, produce a score. Higher = better match.
// Prioritises: same college, sport interest, similar skill, matching
// availability, and open spots.
// ──────────────────────────────────────────────────────────────────────────

import { SKILL_VALUE, type Availability, type SkillLevel } from "./constants";
import type { GameWithMeta, Profile } from "./types";

export type UserContext = {
  profile: Profile;
  /** sport_id → the user's skill level for that sport. */
  skillBySport: Record<string, SkillLevel>;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function timeSlot(hour: number): "Morning" | "Afternoon" | "Evening" {
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

/** Does the game's start time fall inside the user's stated availability? */
function matchesAvailability(availability: Availability, iso: string): boolean {
  const d = new Date(iso);
  const day = DAY_NAMES[d.getDay()];
  const slots = availability[day];
  if (!slots || slots.length === 0) return false;
  return slots.includes(timeSlot(d.getHours()));
}

export function scoreGame(ctx: UserContext, game: GameWithMeta): number {
  let score = 0;

  // Same college — the strongest signal for a campus app.
  if (game.college && game.college === ctx.profile.college) score += 40;

  // Sport the user actually plays.
  const userSkill = ctx.skillBySport[game.sport_id];
  if (userSkill) {
    score += 30;

    // Similar skill: closer to the game's target = better (max +15).
    if (game.skill_target !== "Any") {
      const diff = Math.abs(
        SKILL_VALUE[userSkill] - SKILL_VALUE[game.skill_target],
      );
      score += Math.max(0, 15 - diff * 5);
    } else {
      score += 8; // open to all skill levels
    }
  }

  // Availability overlap.
  if (matchesAvailability(ctx.profile.availability, game.starts_at)) {
    score += 12;
  }

  // Open spots — reward availability, exclude-ish if full.
  const open = game.max_players - game.participant_count;
  if (open > 0) score += 6;
  else score -= 50;

  // Slight preference for games happening sooner (within ~2 weeks).
  const days =
    (new Date(game.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days >= 0) score += Math.max(0, 6 - days / 3);

  return score;
}

/** Sorts upcoming games by match score, best first. */
export function recommendGames(
  ctx: UserContext,
  games: GameWithMeta[],
): GameWithMeta[] {
  return [...games]
    .map((g) => ({ g, s: scoreGame(ctx, g) }))
    .sort((a, b) => b.s - a.s)
    .map(({ g }) => g);
}
