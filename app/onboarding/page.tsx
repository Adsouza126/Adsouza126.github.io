import { requireProfile } from "@/lib/auth";
import { getSports, getColleges } from "@/lib/queries";
import { Logo } from "@/components/Logo";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  // Don't require completed onboarding — this IS the onboarding page.
  const [profile, sports, colleges] = await Promise.all([
    requireProfile(false),
    getSports(),
    getColleges(),
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
        <OnboardingForm profile={profile} sports={sports} colleges={colleges} />
      </main>
    </div>
  );
}
