import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSports } from "@/lib/queries";
import { Logo } from "@/components/Logo";
import { OnboardingForm } from "@/components/OnboardingForm";
import type { Profile } from "@/lib/types";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, sports, { data: colleges }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getSports(),
    supabase.from("colleges").select("name").order("name"),
  ]);

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-4">
        <Logo />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-ink-900">
          Set up your player profile
        </h1>
        <p className="mb-6 mt-1 text-sm text-ink-500">
          Tell us how you play so we can match you with the right games.
        </p>
        <OnboardingForm
          profile={profile as Profile}
          sports={sports}
          colleges={(colleges ?? []).map((c) => c.name as string)}
        />
      </main>
    </div>
  );
}
