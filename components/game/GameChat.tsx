"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Input, Button } from "@/components/ui";
import { postGameMessage } from "@/app/actions/games";
import { relativeTime } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: { full_name: string | null; avatar_url: string | null } | null;
};

/** Comment / chat thread for a game's players. */
export function GameChat({
  gameId,
  messages,
  currentUserId,
  canPost,
}: {
  gameId: string;
  messages: ChatMessage[];
  currentUserId: string;
  canPost: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    startTransition(async () => {
      await postGameMessage(gameId, body);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <div className="scroll-thin max-h-80 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            No messages yet — say hi to your teammates 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === currentUserId;
            return (
              <div key={m.id} className="flex items-start gap-2.5">
                <Avatar
                  name={m.author?.full_name}
                  url={m.author?.avatar_url}
                  size={32}
                />
                <div className="min-w-0">
                  <p className="text-xs text-ink-500">
                    <span className="font-semibold text-ink-700">
                      {mine ? "You" : m.author?.full_name ?? "Player"}
                    </span>{" "}
                    · {relativeTime(m.created_at)}
                  </p>
                  <p className="break-words text-sm text-ink-800">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {canPost ? (
        <form onSubmit={send} className="mt-3 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message the group…"
          />
          <Button type="submit" size="md" disabled={pending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-center text-xs text-ink-400">
          Join the game to chat with players.
        </p>
      )}
    </div>
  );
}
