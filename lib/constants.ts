// ──────────────────────────────────────────────────────────────────────────
// Domain constants shared across the app.
// ──────────────────────────────────────────────────────────────────────────

/** Skill levels, ordered from least to most experienced. */
export const SKILL_LEVELS = [
  "Beginner",
  "Casual",
  "Intermediate",
  "Competitive",
] as const;

export type SkillLevel = (typeof SKILL_LEVELS)[number];

/**
 * Numeric weight for each skill level. Used by the team-balancing algorithm
 * and to compare a player's level against a game's target.
 */
export const SKILL_VALUE: Record<SkillLevel, number> = {
  Beginner: 1,
  Casual: 2,
  Intermediate: 3,
  Competitive: 4,
};

/** Skill target options for a game — includes "Any" so hosts can stay open. */
export const SKILL_TARGETS = ["Any", ...SKILL_LEVELS] as const;
export type SkillTarget = (typeof SKILL_TARGETS)[number];

/** Days of the week used for availability and scheduling. */
export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export type Day = (typeof DAYS)[number];

/** Coarse time-of-day buckets for availability. */
export const TIME_SLOTS = ["Morning", "Afternoon", "Evening"] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

/** Availability is a map of day → selected time slots. */
export type Availability = Partial<Record<Day, TimeSlot[]>>;

/**
 * Reliability badge thresholds.
 * 90–100 Highly Reliable · 70–89 Reliable · <70 Risky
 */
export function reliabilityBadge(score: number): {
  label: string;
  tone: "great" | "good" | "risky";
} {
  if (score >= 90) return { label: "Highly Reliable", tone: "great" };
  if (score >= 70) return { label: "Reliable", tone: "good" };
  return { label: "Risky", tone: "risky" };
}

/** How reliability shifts after a game. */
export const RELIABILITY = {
  ATTENDED_DELTA: 2, // small bump, capped at 100
  NO_SHOW_DELTA: -15,
  MAX: 100,
  MIN: 0,
} as const;
