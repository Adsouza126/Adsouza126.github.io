import type { SkillLevel } from "@/lib/constants";

/** A participant as shown on the game detail page. */
export type ParticipantView = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  skill_level: SkillLevel;
  preferred_position: string | null;
  reliability_score: number;
  team: "A" | "B" | null;
};
