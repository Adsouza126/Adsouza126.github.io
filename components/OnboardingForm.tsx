"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import {
  DAYS,
  TIME_SLOTS,
  SKILL_LEVELS,
  type Availability,
  type Day,
  type SkillLevel,
  type TimeSlot,
} from "@/lib/constants";
import { saveProfile, type SportSelection } from "@/app/actions/profile";
import type { Profile, Sport } from "@/lib/types";
import { cn } from "@/lib/utils";

type SportState = {
  selected: boolean;
  skill_level: SkillLevel;
  preferred_position: string;
};

export function OnboardingForm({
  profile,
  sports,
  colleges,
}: {
  profile: Profile;
  sports: Sport[];
  colleges: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [college, setCollege] = useState(profile.college ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [campusArea, setCampusArea] = useState(profile.campus_area ?? "");
  const [distance, setDistance] = useState(profile.preferred_distance ?? 5);
  const [availability, setAvailability] = useState<Availability>(
    profile.availability ?? {},
  );

  const [sportState, setSportState] = useState<Record<string, SportState>>(
    () =>
      Object.fromEntries(
        sports.map((s) => [
          s.id,
          { selected: false, skill_level: "Casual", preferred_position: "" },
        ]),
      ),
  );

  function toggleSlot(day: Day, slot: TimeSlot) {
    setAvailability((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot];
      return { ...prev, [day]: next };
    });
  }

  function updateSport(id: string, patch: Partial<SportState>) {
    setSportState((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const selectedSports: SportSelection[] = sports
      .filter((s) => sportState[s.id]?.selected)
      .map((s) => ({
        sport_id: s.id,
        skill_level: sportState[s.id].skill_level,
        preferred_position: sportState[s.id].preferred_position || null,
      }));

    if (selectedSports.length === 0) {
      setError("Pick at least one sport you play.");
      return;
    }

    startTransition(async () => {
      const res = await saveProfile({
        full_name: fullName,
        college,
        bio,
        avatar_url: avatarUrl || null,
        campus_area: campusArea,
        preferred_distance: Number(distance),
        availability,
        sports: selectedSports,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Basics */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-ink-900">About you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="college">College / University</Label>
              <Select
                id="college"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
              >
                <option value="" disabled>
                  Select your school
                </option>
                {colleges.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="avatar">Profile photo URL (optional)</Label>
            <Input
              id="avatar"
              placeholder="https://…"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="Sophomore, love a competitive game of 5-on-5…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Sports */}
      <Card>
        <CardBody className="space-y-3">
          <div>
            <h2 className="font-semibold text-ink-900">Your sports</h2>
            <p className="text-sm text-ink-500">
              Select the sports you play and set your skill level.
            </p>
          </div>
          <div className="space-y-3">
            {sports.map((sport) => {
              const st = sportState[sport.id];
              return (
                <div
                  key={sport.id}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    st.selected
                      ? "border-brand-400 bg-brand-50/50"
                      : "border-ink-200",
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-brand-600"
                      checked={st.selected}
                      onChange={(e) =>
                        updateSport(sport.id, { selected: e.target.checked })
                      }
                    />
                    <span className="text-lg">{sport.icon}</span>
                    <span className="font-medium text-ink-800">
                      {sport.name}
                    </span>
                  </label>
                  {st.selected ? (
                    <div className="mt-3 grid gap-3 pl-7 sm:grid-cols-2">
                      <div>
                        <Label>Skill level</Label>
                        <Select
                          value={st.skill_level}
                          onChange={(e) =>
                            updateSport(sport.id, {
                              skill_level: e.target.value as SkillLevel,
                            })
                          }
                        >
                          {SKILL_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </Select>
                      </div>
                      {sport.positions.length > 0 ? (
                        <div>
                          <Label>Preferred position (optional)</Label>
                          <Select
                            value={st.preferred_position}
                            onChange={(e) =>
                              updateSport(sport.id, {
                                preferred_position: e.target.value,
                              })
                            }
                          >
                            <option value="">No preference</option>
                            {sport.positions.map((pos) => (
                              <option key={pos} value={pos}>
                                {pos}
                              </option>
                            ))}
                          </Select>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Location */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-ink-900">Location</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="campus">Preferred campus area</Label>
              <Input
                id="campus"
                placeholder="e.g. Main Campus, The Green"
                value={campusArea}
                onChange={(e) => setCampusArea(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="distance">
                Max travel distance: {distance} mi
              </Label>
              <input
                id="distance"
                type="range"
                min={1}
                max={25}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="mt-3 w-full accent-brand-600"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Availability */}
      <Card>
        <CardBody className="space-y-3">
          <div>
            <h2 className="font-semibold text-ink-900">Availability</h2>
            <p className="text-sm text-ink-500">
              When are you usually free to play?
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-500">
                  <th className="py-2 text-left font-medium">Day</th>
                  {TIME_SLOTS.map((slot) => (
                    <th key={slot} className="py-2 font-medium">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border-t border-ink-100">
                    <td className="py-2 font-medium text-ink-700">{day}</td>
                    {TIME_SLOTS.map((slot) => {
                      const active = availability[day]?.includes(slot);
                      return (
                        <td key={slot} className="py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSlot(day, slot)}
                            className={cn(
                              "h-7 w-16 rounded-lg text-xs font-medium transition-colors",
                              active
                                ? "bg-brand-600 text-white"
                                : "bg-ink-100 text-ink-500 hover:bg-ink-200",
                            )}
                          >
                            {active ? "Free" : "—"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 pb-10">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Finish & enter Rally"}
        </Button>
      </div>
    </form>
  );
}
