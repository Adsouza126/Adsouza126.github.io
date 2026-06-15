"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, ClipboardCheck } from "lucide-react";
import { Button, Card, CardBody } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { generateTeams, recordAttendance } from "@/app/actions/games";
import { cn } from "@/lib/utils";
import type { ParticipantView } from "./types";

/** Host-only controls: generate teams and record post-game attendance. */
export function HostPanel({
  gameId,
  participants,
  hasTeams,
  status,
}: {
  gameId: string;
  participants: ParticipantView[];
  hasTeams: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Attendance UI state — default everyone to "attended".
  const [attendance, setAttendance] = useState<
    Record<string, "attended" | "no_show">
  >(() => Object.fromEntries(participants.map((p) => [p.user_id, "attended"])));

  function doGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await generateTeams(gameId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  function doRecord() {
    setError(null);
    startTransition(async () => {
      const res = await recordAttendance(
        gameId,
        participants.map((p) => ({
          userId: p.user_id,
          status: attendance[p.user_id] ?? "attended",
        })),
      );
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <CardBody className="space-y-4">
        <h3 className="flex items-center gap-2 font-semibold text-ink-900">
          <ClipboardCheck className="h-4 w-4 text-brand-600" />
          Host controls
        </h3>

        {status === "scheduled" ? (
          <>
            <div>
              <Button
                variant="secondary"
                onClick={doGenerate}
                disabled={pending || participants.length < 2}
              >
                <Shuffle className="h-4 w-4" />
                {hasTeams ? "Re-balance teams" : "Auto-balance teams"}
              </Button>
              <p className="mt-1.5 text-xs text-ink-500">
                Splits joined players into even teams by skill & position.
              </p>
            </div>

            <div className="border-t border-brand-200 pt-4">
              <p className="mb-2 text-sm font-medium text-ink-700">
                After the game, record attendance:
              </p>
              <ul className="space-y-2">
                {participants.map((p) => {
                  const value = attendance[p.user_id] ?? "attended";
                  return (
                    <li
                      key={p.user_id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2"
                    >
                      <span className="flex items-center gap-2">
                        <Avatar name={p.name} url={p.avatar_url} size={24} />
                        <span className="text-sm font-medium text-ink-800">
                          {p.name}
                        </span>
                      </span>
                      <div className="flex gap-1">
                        {(["attended", "no_show"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setAttendance((prev) => ({
                                ...prev,
                                [p.user_id]: s,
                              }))
                            }
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                              value === s
                                ? s === "attended"
                                  ? "bg-emerald-600 text-white"
                                  : "bg-red-600 text-white"
                                : "bg-ink-100 text-ink-600 hover:bg-ink-200",
                            )}
                          >
                            {s === "attended" ? "Attended" : "No-show"}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Button
                className="mt-3"
                onClick={doRecord}
                disabled={pending || participants.length === 0}
              >
                Save attendance & complete game
              </Button>
              <p className="mt-1.5 text-xs text-ink-500">
                This updates each player&apos;s reliability score and marks the
                game completed.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-500">
            This game is {status}. Attendance has been recorded.
          </p>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </CardBody>
    </Card>
  );
}
