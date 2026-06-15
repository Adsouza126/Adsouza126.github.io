import Link from "next/link";
import { Users } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, Badge, SectionTitle } from "@/components/ui";
import type { Sport } from "@/lib/types";

type CommunityRow = {
  id: string;
  name: string;
  college: string;
  description: string | null;
  sport: Pick<Sport, "name" | "icon">;
  community_members: { count: number }[];
};

export default async function CommunitiesPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  const [{ data: communities }, { data: memberRows }] = await Promise.all([
    supabase
      .from("communities")
      .select(
        "id, name, college, description, sport:sports(name, icon), community_members(count)",
      )
      .order("college")
      .order("name"),
    supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", profile.id),
  ]);

  const joined = new Set(
    (memberRows ?? []).map((m) => m.community_id as string),
  );
  const rows = (communities ?? []) as unknown as CommunityRow[];

  const mine = rows.filter((c) => c.college === profile.college);
  const others = rows.filter((c) => c.college !== profile.college);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Communities</h1>
        <p className="text-sm text-ink-500">
          Sport-based groups at your campus. Join to find regulars and games.
        </p>
      </div>

      <section>
        <SectionTitle title={profile.college ?? "Your campus"} />
        {mine.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                isMember={joined.has(c.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-500">
            No communities at your campus yet.
          </p>
        )}
      </section>

      {others.length ? (
        <section>
          <SectionTitle title="Other campuses" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                isMember={joined.has(c.id)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CommunityCard({
  community,
  isMember,
}: {
  community: CommunityRow;
  isMember: boolean;
}) {
  const count = community.community_members?.[0]?.count ?? 0;
  return (
    <Link href={`/communities/${community.id}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardBody>
          <div className="flex items-start justify-between">
            <span className="text-3xl">{community.sport.icon}</span>
            {isMember ? <Badge tone="brand">Joined</Badge> : null}
          </div>
          <h3 className="mt-3 font-semibold text-ink-900">{community.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-500">
            {community.description}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
            <Users className="h-3.5 w-3.5" />
            {count} member{count === 1 ? "" : "s"}
          </p>
        </CardBody>
      </Card>
    </Link>
  );
}
