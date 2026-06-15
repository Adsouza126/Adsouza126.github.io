"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Ban } from "lucide-react";
import { Button } from "@/components/ui";
import { joinGame, leaveGame, cancelGame } from "@/app/actions/games";

/** Join / leave / cancel controls for a game. */
export function GameActionsBar({
  gameId,
  isHost,
  isParticipant,
  isFull,
  status,
}: {
  gameId: string;
  isHost: boolean;
  isParticipant: boolean;
  isFull: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  if (status !== "scheduled") {
    return (
      <p className="text-sm font-medium text-ink-500">
        This game is {status}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!isParticipant ? (
          <Button
            onClick={() => run(() => joinGame(gameId))}
            disabled={pending || isFull}
          >
            <LogIn className="h-4 w-4" />
            {isFull ? "Game full" : "Join game"}
          </Button>
        ) : (
          !isHost && (
            <Button
              variant="secondary"
              onClick={() => run(() => leaveGame(gameId))}
              disabled={pending}
            >
              <LogOut className="h-4 w-4" />
              Leave game
            </Button>
          )
        )}
        {isHost ? (
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Cancel this game for everyone?"))
                run(() => cancelGame(gameId));
            }}
            disabled={pending}
          >
            <Ban className="h-4 w-4" />
            Cancel game
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
