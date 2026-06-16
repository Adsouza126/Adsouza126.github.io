import { Pencil, MapPin, GraduationCap, History } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  getUserSportsDetailed,
  getReliabilityLogs,
} from "@/lib/queries";
import { Card, CardBody, Badge, ButtonLink, SectionTitle } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";
import { DAYS, type Day } from "@/lib/constants";
import { relativeTime } from "@/lib/utils";

export default async function ProfilePage() {
  const profile = await requireProfile();

  const [sports, logs] = await Promise.all([
    getUserSportsDetailed(profile.id),
    getReliabilityLogs(profile.id),
  ]);

  const availDays = DAYS.filter(
    (d) => (profile.availability?.[d as Day]?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile.full_name}
              url={profile.avatar_url}
              size={72}
            />
            <div>
              <h1 className="text-2xl font-bold text-ink-900">
                {profile.full_name}
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-ink-500">
                <GraduationCap className="h-4 w-4" />
                {profile.college}
              </p>
              {profile.campus_area ? (
                <p className="flex items-center gap-1.5 text-sm text-ink-500">
                  <MapPin className="h-4 w-4" />
                  {profile.campus_area} · within {profile.preferred_distance} mi
                </p>
              ) : null}
              <div className="mt-2">
                <ReliabilityBadge score={profile.reliability_score} />
              </div>
            </div>
          </div>
          <ButtonLink href="/onboarding" variant="secondary" size="sm">
            <Pencil className="h-4 w-4" /> Edit profile
          </ButtonLink>
        </CardBody>
      </Card>

      {profile.bio ? (
        <Card>
          <CardBody>
            <h2 className="mb-1 font-semibold text-ink-900">About</h2>
            <p className="whitespace-pre-wrap text-sm text-ink-700">
              {profile.bio}
            </p>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-3 font-semibold text-ink-900">Sports</h2>
            {sports.length ? (
              <ul className="space-y-2">
                {sports.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2 font-medium text-ink-800">
                      <span className="text-lg">{s.sport.icon}</span>
                      {s.sport.name}
                      {s.preferred_position ? (
                        <span className="text-sm font-normal text-ink-500">
                          · {s.preferred_position}
                        </span>
                      ) : null}
                    </span>
                    <Badge tone="brand">{s.skill_level}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">No sports added yet.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 font-semibold text-ink-900">Availability</h2>
            {availDays.length ? (
              <ul className="space-y-1.5">
                {availDays.map((d) => (
                  <li key={d} className="flex justify-between text-sm">
                    <span className="font-medium text-ink-700">{d}</span>
                    <span className="text-ink-500">
                      {profile.availability[d as Day]?.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">No availability set.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <section>
        <SectionTitle title="Reliability history" />
        <Card>
          <CardBody>
            {logs && logs.length ? (
              <ul className="divide-y divide-ink-100">
                {logs.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="text-ink-700">{l.reason}</span>
                    <span className="flex items-center gap-3">
                      <span
                        className={
                          l.delta >= 0 ? "text-emerald-600" : "text-red-600"
                        }
                      >
                        {l.delta >= 0 ? `+${l.delta}` : l.delta}
                      </span>
                      <span className="text-ink-400">
                        {relativeTime(l.created_at)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-1 py-6 text-center text-sm text-ink-400">
                <History className="h-6 w-6" />
                No reliability changes yet. Show up to games to build your
                score!
              </div>
            )}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
