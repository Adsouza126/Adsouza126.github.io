"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

async function requireUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user.id;
}

export async function joinCommunity(communityId: string): Promise<ActionResult> {
  const supabase = createClient();
  const userId = await requireUserId();
  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: userId });
  if (error) return { error: error.message };
  revalidatePath(`/communities/${communityId}`);
  revalidatePath("/communities");
  return { ok: true };
}

export async function leaveCommunity(communityId: string): Promise<ActionResult> {
  const supabase = createClient();
  const userId = await requireUserId();
  await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId);
  revalidatePath(`/communities/${communityId}`);
  revalidatePath("/communities");
  return { ok: true };
}

export async function postCommunityMessage(communityId: string, body: string): Promise<ActionResult> {
  const supabase = createClient();
  const userId = await requireUserId();
  const trimmed = body.trim();
  if (!trimmed) return { error: "Message is empty" };
  await supabase
    .from("messages")
    .insert({ community_id: communityId, user_id: userId, body: trimmed });
  revalidatePath(`/communities/${communityId}`);
  return { ok: true };
}
