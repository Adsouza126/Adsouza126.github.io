import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Returns the current auth user or null (no redirect). */
export async function getUser() {
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
