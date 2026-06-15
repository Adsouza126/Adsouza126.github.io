import { requireProfile } from "@/lib/auth";
import { getSports } from "@/lib/queries";
import { CreateGameForm } from "@/components/CreateGameForm";

export default async function NewGamePage() {
  await requireProfile();
  const sports = await getSports();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-ink-900">Create a game</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Set it up and let your campus find it.
      </p>
      <CreateGameForm sports={sports} />
    </div>
  );
}
