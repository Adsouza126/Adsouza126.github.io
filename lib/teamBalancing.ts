// ──────────────────────────────────────────────────────────────────────────
// Team-balancing algorithm.
//
// Goal: split joined players into Team A and Team B that are as even as
// possible by skill, while spreading preferred positions across both teams.
// Ties are broken randomly so repeated runs can produce fresh line-ups.
// ──────────────────────────────────────────────────────────────────────────

import { SKILL_VALUE, type SkillLevel } from "./constants";

export type BalancePlayer = {
  user_id: string;
  name: string;
  skill_level: SkillLevel;
  preferred_position?: string | null;
};

export type BalancedTeams = {
  A: BalancePlayer[];
  B: BalancePlayer[];
  skillA: number;
  skillB: number;
};

/**
 * Greedy snake-style balancing:
 * 1. Sort players strongest → weakest (random tie-break).
 * 2. Assign each to whichever team currently has the lower total skill.
 *    On a tie, prefer the team that lacks the player's position, else random.
 */
export function balanceTeams(players: BalancePlayer[]): BalancedTeams {
  const shuffled = [...players]
    .map((p) => ({ p, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ p }) => p);

  const sorted = shuffled.sort(
    (a, b) => SKILL_VALUE[b.skill_level] - SKILL_VALUE[a.skill_level],
  );

  const A: BalancePlayer[] = [];
  const B: BalancePlayer[] = [];
  let skillA = 0;
  let skillB = 0;

  const hasPosition = (team: BalancePlayer[], pos?: string | null) =>
    !!pos && team.some((m) => m.preferred_position === pos);

  for (const player of sorted) {
    const value = SKILL_VALUE[player.skill_level];

    let target: "A" | "B";
    if (skillA < skillB) target = "A";
    else if (skillB < skillA) target = "B";
    else {
      // Equal skill → balance team sizes, then positions, then random.
      if (A.length !== B.length) {
        target = A.length < B.length ? "A" : "B";
      } else {
        const aHas = hasPosition(A, player.preferred_position);
        const bHas = hasPosition(B, player.preferred_position);
        if (aHas && !bHas) target = "B";
        else if (bHas && !aHas) target = "A";
        else target = Math.random() < 0.5 ? "A" : "B";
      }
    }

    if (target === "A") {
      A.push(player);
      skillA += value;
    } else {
      B.push(player);
      skillB += value;
    }
  }

  return { A, B, skillA, skillB };
}
