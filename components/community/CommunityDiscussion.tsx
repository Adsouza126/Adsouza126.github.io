"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button, Textarea } from "@/components/ui";
import { postCommunityMessage } from "@/app/actions/communities";
import { relativeTime } from "@/lib/utils";

export type DiscussionPost = {
  id: string;
  body: string;
  created_at: string;
  author: { full_name: string | null; avatar_url: string | null } | null;
};

/** Threaded-ish discussion feed for a community. */
export function CommunityDiscussion({
  communityId,
  posts,
  canPost,
}: {
  communityId: string;
  posts: DiscussionPost[];
  canPost: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    startTransition(async () => {
      await postCommunityMessage(communityId, body);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {canPost ? (
        <form onSubmit={send} className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Start a discussion or ask who's playing this week…"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending || !text.trim()}>
              <Send className="h-4 w-4" /> Post
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-500">
          Join the community to post in the discussion.
        </p>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-400">
            No posts yet. Be the first to say something!
          </p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="flex items-start gap-3">
              <Avatar
                name={p.author?.full_name}
                url={p.author?.avatar_url}
                size={36}
              />
              <div className="min-w-0 flex-1 rounded-xl bg-ink-50 px-3.5 py-2.5">
                <p className="text-xs text-ink-500">
                  <span className="font-semibold text-ink-700">
                    {p.author?.full_name ?? "Player"}
                  </span>{" "}
                  · {relativeTime(p.created_at)}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-800">
                  {p.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
