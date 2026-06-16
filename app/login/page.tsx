"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button, Card, CardBody, Input, Label } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // When no Supabase project is configured the app runs in demo mode —
  // any "log in" simply enters the sample experience.
  const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (demo) {
      router.push(next);
      router.refresh();
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {demo ? (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          🎬 <b>Demo mode</b> — just click <b>Log In</b> to explore Rally with
          sample data. No password needed.
        </p>
      ) : null}
      <div>
        <Label htmlFor="email">College email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required={!demo}
          placeholder="you@udel.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required={!demo}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Log In"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardBody className="p-7">
          <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-ink-500">
            Log in to find your next game.
          </p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardBody>
      </Card>
      <p className="mt-5 text-sm text-ink-500">
        New to Rally?{" "}
        <Link href="/signup" className="font-semibold text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
