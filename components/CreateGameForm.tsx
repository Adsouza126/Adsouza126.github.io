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
import { SKILL_TARGETS, type SkillTarget } from "@/lib/constants";
import { createGame } from "@/app/actions/games";
import type { Sport } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CreateGameForm({ sports }: { sports: Sport[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [campusArea, setCampusArea] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [skillTarget, setSkillTarget] = useState<SkillTarget>("Any");
  const [competitive, setCompetitive] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [autoBalance, setAutoBalance] = useState(true);
  const [description, setDescription] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date || !time) {
      setError("Pick a date and time.");
      return;
    }
    const startsAt = new Date(`${date}T${time}`);
    if (startsAt.getTime() < Date.now()) {
      setError("Pick a time in the future.");
      return;
    }

    startTransition(async () => {
      const res = await createGame({
        sport_id: sportId,
        title,
        starts_at: startsAt.toISOString(),
        location,
        campus_area: campusArea,
        max_players: Number(maxPlayers),
        skill_target: skillTarget,
        competitive,
        is_public: isPublic,
        description,
        auto_balance: autoBalance,
      });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      if ("id" in res) {
        router.push(`/games/${res.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sport">Sport</Label>
              <Select
                id="sport"
                value={sportId}
                onChange={(e) => setSportId(e.target.value)}
                required
              >
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="Friday night 5-on-5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Carpenter Sports Building, Court 2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="campus">Campus area (optional)</Label>
              <Input
                id="campus"
                placeholder="Main Campus"
                value={campusArea}
                onChange={(e) => setCampusArea(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="max">Max players</Label>
              <Input
                id="max"
                type="number"
                min={2}
                max={50}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="skill">Skill level target</Label>
              <Select
                id="skill"
                value={skillTarget}
                onChange={(e) => setSkillTarget(e.target.value as SkillTarget)}
              >
                {SKILL_TARGETS.map((s) => (
                  <option key={s} value={s}>
                    {s === "Any" ? "Any skill level" : s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              rows={3}
              placeholder="Bring a light & dark shirt. We'll split into teams."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Toggles */}
      <Card>
        <CardBody className="space-y-3">
          <Toggle
            label="Competitive"
            description="Keep score and play to win. Off = casual."
            checked={competitive}
            onChange={setCompetitive}
          />
          <Toggle
            label="Public game"
            description="Anyone on Rally can find and join. Off = invite only."
            checked={isPublic}
            onChange={setIsPublic}
          />
          <Toggle
            label="Auto team balancing"
            description="Allow balanced Team A / Team B to be generated."
            checked={autoBalance}
            onChange={setAutoBalance}
          />
        </CardBody>
      </Card>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create game"}
        </Button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block font-medium text-ink-800">{label}</span>
        <span className="block text-sm text-ink-500">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-ink-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
