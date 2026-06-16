import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { IS_DEMO, demo } from "@/lib/demo";
import type { Profile } from "@/lib/types";

/** Returns the current auth user or null (no redirect). */
export async function getUser() {
  if (IS_DEMO) return { id: demo.currentProfile().id };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Loads the current user's profile. Redirects to /login when signed out.
 * Set `requireOnboarded` to bounce un-onboarded users to /onboarding.
 */
export async function requireProfile(
  requireOnboarded = true,
): Promise<Profile> {
  // In demo mode we're always "signed in" as the sample user.
  if (IS_DEMO) return demo.currentProfile();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // The trigger creates the row on signup; guard just in case.
  if (!profile) redirect("/onboarding");

  if (requireOnboarded && !profile.onboarded) redirect("/onboarding");

  return profile as Profile;
}
