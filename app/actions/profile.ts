"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Availability, SkillLevel } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

export type SportSelection = {
  sport_id: string;
  skill_level: SkillLevel;
  preferred_position: string | null;
};

export type ProfileInput = {
  full_name: string;
  college: string;
  bio: string;
  avatar_url: string | null;
  campus_area: string;
  preferred_distance: number;
  availability: Availability;
  sports: SportSelection[];
};

/** Saves the profile + selected sports, marking onboarding complete. */
export async function saveProfile(input: ProfileInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      college: input.college,
      bio: input.bio,
      avatar_url: input.avatar_url,
      campus_area: input.campus_area,
      preferred_distance: input.preferred_distance,
      availability: input.availability,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // Replace the user's sports with the current selection.
  await supabase.from("user_sports").delete().eq("user_id", user.id);
  if (input.sports.length) {
    const { error: sportsError } = await supabase.from("user_sports").insert(
      input.sports.map((s) => ({
        user_id: user.id,
        sport_id: s.sport_id,
        skill_level: s.skill_level,
        preferred_position: s.preferred_position,
      })),
    );
    if (sportsError) return { error: sportsError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { ok: true };
}
