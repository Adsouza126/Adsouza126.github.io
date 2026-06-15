"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui";
import { joinCommunity, leaveCommunity } from "@/app/actions/communities";

export function CommunityJoinButton({
  communityId,
  isMember,
}: {
  communityId: string;
  isMember: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (isMember) await leaveCommunity(communityId);
      else await joinCommunity(communityId);
      router.refresh();
    });
  }

  return (
    <Button
      variant={isMember ? "secondary" : "primary"}
      onClick={toggle}
      disabled={pending}
    >
      {isMember ? (
        <>
          <UserMinus className="h-4 w-4" /> Leave
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" /> Join community
        </>
      )}
    </Button>
  );
}
