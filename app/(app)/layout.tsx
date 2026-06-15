import { Navbar } from "@/components/Navbar";
import { requireProfile } from "@/lib/auth";

/**
 * Shared shell for all signed-in pages. Enforces auth + completed onboarding
 * and renders the top navigation.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
