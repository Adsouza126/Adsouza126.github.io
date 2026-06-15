"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, Input, Card, CardBody } from "@/components/ui";
import { SKILL_TARGETS } from "@/lib/constants";
import type { Sport } from "@/lib/types";

/** Filter bar for the game-discovery page. Writes selections to the URL. */
export function GameFilters({
  sports,
  colleges,
}: {
  sports: Sport[];
  colleges: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/games?${next.toString()}`);
  }

  return (
    <Card>
      <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Select
          value={params.get("sport") ?? ""}
          onChange={(e) => setParam("sport", e.target.value)}
        >
          <option value="">All sports</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name}
            </option>
          ))}
        </Select>

        <Select
          value={params.get("college") ?? ""}
          onChange={(e) => setParam("college", e.target.value)}
        >
          <option value="">All campuses</option>
          {colleges.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          value={params.get("skill") ?? ""}
          onChange={(e) => setParam("skill", e.target.value)}
        >
          <option value="">Any skill</option>
          {SKILL_TARGETS.filter((s) => s !== "Any").map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Select
          value={params.get("type") ?? ""}
          onChange={(e) => setParam("type", e.target.value)}
        >
          <option value="">Casual & competitive</option>
          <option value="casual">Casual</option>
          <option value="competitive">Competitive</option>
        </Select>

        <Input
          type="date"
          value={params.get("date") ?? ""}
          onChange={(e) => setParam("date", e.target.value)}
        />

        <label className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 text-sm text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-brand-600"
            checked={params.get("open") === "1"}
            onChange={(e) => setParam("open", e.target.checked ? "1" : "")}
          />
          Open spots only
        </label>
      </CardBody>
    </Card>
  );
}
