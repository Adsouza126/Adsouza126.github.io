"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO, demo } from "@/lib/demo";
import { balanceTeams, type BalancePlayer } from "@/lib/teamBalancing";
import { RELIABILITY, type SkillLevel, type SkillTarget } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

async function requireUserId() {
  if (IS_DEMO) return demo.currentProfile().id;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

export type CreateGameInput = {
  sport_id: string;
  title: string;
  starts_at: string; // ISO
  location: string;
  campus_area: string;
  max_players: number;
  skill_target: SkillTarget;
  competitive: boolean;
  is_public: boolean;
  description: string;
  auto_balance: boolean;
};

/** Creates a game (hosted by the current user) and auto-joins the host. */
export async function createGame(input: CreateGameInput): Promise<ActionResult> {
  const userId = await requireUserId();

  if (IS_DEMO) {
    const id = demo.createGame({
      host_id: userId,
      sport_id: input.sport_id,
      title: input.title || null,
      starts_at: input.starts_at,
      location: input.location,
      campus_area: input.campus_area || null,
      college: demo.currentProfile().college,
      max_players: input.max_players,
      skill_target: input.skill_target,
      competitive: input.competitive,
      is_public: input.is_public,
      description: input.description || null,
      auto_balance: input.auto_balance,
    });
    revalidatePath("/games");
    revalidatePath("/dashboard");
    return { id };
  }

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("college")
    .eq("id", userId)
    .single();

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      host_id: userId,
      sport_id: input.sport_id,
      title: input.title || null,
      starts_at: input.starts_at,
      location: input.location,
      campus_area: input.campus_area || null,
      college: profile?.college ?? null,
      max_players: input.max_players,
      skill_target: input.skill_target,
      competitive: input.competitive,
      is_public: input.is_public,
      description: input.description || null,
      auto_balance: input.auto_balance,
    })
    .select("id")
    .single();

  if (error || !game) return { error: error?.message ?? "Could not create game" };

  // Host joins their own game.
  await supabase
    .from("game_participants")
    .insert({ game_id: game.id, user_id: userId });

  revalidatePath("/games");
  revalidatePath("/dashboard");
  return { id: game.id as string };
}

export async function joinGame(gameId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (IS_DEMO) {
    demo.joinGame(gameId, userId);
    revalidatePath(`/games/${gameId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("game_participants")
    .insert({ game_id: gameId, user_id: userId });
  if (error) return { error: error.message };
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function leaveGame(gameId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (IS_DEMO) {
    demo.leaveGame(gameId, userId);
    revalidatePath(`/games/${gameId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const supabase = createClient();
  await supabase
    .from("game_participants")
    .delete()
    .eq("game_id", gameId)
    .eq("user_id", userId);
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function cancelGame(gameId: string): Promise<ActionResult> {
  await requireUserId();
  if (IS_DEMO) {
    demo.cancelGame(gameId);
    revalidatePath(`/games/${gameId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const supabase = createClient();
  await supabase
    .from("games")
    .update({ status: "cancelled" })
    .eq("id", gameId);
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function postGameMessage(gameId: string, body: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = body.trim();
  if (!trimmed) return { error: "Message is empty" };
  if (IS_DEMO) {
    demo.postGameMessage(gameId, userId, trimmed);
    revalidatePath(`/games/${gameId}`);
    return { ok: true };
  }
  const supabase = createClient();
  await supabase
    .from("messages")
    .insert({ game_id: gameId, user_id: userId, body: trimmed });
  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

/**
 * Builds balanced Team A / Team B from the current roster using each player's
 * skill level for this game's sport, then persists the assignment.
 */
export async function generateTeams(gameId: string): Promise<ActionResult> {
  await requireUserId();

  if (IS_DEMO) {
    if (demo.gameParticipants(gameId).length < 2)
      return { error: "Need at least 2 players to balance teams." };
    demo.generateTeams(gameId);
    revalidatePath(`/games/${gameId}`);
    return { ok: true };
  }

  const supabase = createClient();
  const { data: game } = await supabase
    .from("games")
    .select("sport_id")
    .eq("id", gameId)
    .single();
  if (!game) return { error: "Game not found" };

  const { data: participants } = await supabase
    .from("game_participants")
    .select("user_id, profile:profiles!game_participants_user_id_fkey(full_name)")
    .eq("game_id", gameId);

  if (!participants || participants.length < 2)
    return { error: "Need at least 2 players to balance teams." };

  // Pull each player's skill + position for this sport.
  const userIds = participants.map((p) => p.user_id as string);
  const { data: skills } = await supabase
    .from("user_sports")
    .select("user_id, skill_level, preferred_position")
    .eq("sport_id", game.sport_id)
    .in("user_id", userIds);

  const skillMap = new Map(
    (skills ?? []).map((s) => [
      s.user_id as string,
      {
        skill_level: s.skill_level as SkillLevel,
        preferred_position: s.preferred_position as string | null,
      },
    ]),
  );

  const players: BalancePlayer[] = participants.map((p) => {
    const meta = skillMap.get(p.user_id as string);
    const profile = p.profile as unknown as { full_name: string | null } | null;
    return {
      user_id: p.user_id as string,
      name: profile?.full_name ?? "Player",
      skill_level: meta?.skill_level ?? "Casual",
      preferred_position: meta?.preferred_position ?? null,
    };
  });

  const teams = balanceTeams(players);

  // Persist team labels on each participant + a snapshot on the game.
  await Promise.all([
    ...teams.A.map((p) =>
      supabase
        .from("game_participants")
        .update({ team: "A" })
        .eq("game_id", gameId)
        .eq("user_id", p.user_id),
    ),
    ...teams.B.map((p) =>
      supabase
        .from("game_participants")
        .update({ team: "B" })
        .eq("game_id", gameId)
        .eq("user_id", p.user_id),
    ),
  ]);

  await supabase
    .from("games")
    .update({
      teams: {
        A: teams.A.map((p) => p.user_id),
        B: teams.B.map((p) => p.user_id),
      },
    })
    .eq("id", gameId);

  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

/**
 * Host marks attendance for each player after a game, which adjusts
 * reliability scores and writes an audit log. Marks the game completed.
 */
export async function recordAttendance(
  gameId: string,
  results: { userId: string; status: "attended" | "no_show" }[],
): Promise<ActionResult> {
  const hostId = await requireUserId();

  if (IS_DEMO) {
    demo.recordAttendance(gameId, results);
    revalidatePath(`/games/${gameId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  }

  const supabase = createClient();
  for (const r of results) {
    await supabase.from("attendance").upsert(
      {
        game_id: gameId,
        user_id: r.userId,
        status: r.status,
        recorded_by: hostId,
      },
      { onConflict: "game_id,user_id" },
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("reliability_score")
      .eq("id", r.userId)
      .single();
    if (!profile) continue;

    const delta =
      r.status === "attended"
        ? RELIABILITY.ATTENDED_DELTA
        : RELIABILITY.NO_SHOW_DELTA;
    const newScore = Math.max(
      RELIABILITY.MIN,
      Math.min(RELIABILITY.MAX, profile.reliability_score + delta),
    );

    await supabase
      .from("profiles")
      .update({ reliability_score: newScore })
      .eq("id", r.userId);

    await supabase.from("reliability_logs").insert({
      user_id: r.userId,
      game_id: gameId,
      delta,
      reason: r.status === "attended" ? "Attended game" : "No-show",
      new_score: newScore,
    });
  }

  await supabase.from("games").update({ status: "completed" }).eq("id", gameId);

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
