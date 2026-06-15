"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Button, Card, CardBody, Input, Label, Select } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { College } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Load the list of colleges to populate the dropdown.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("colleges")
      .select("*")
      .order("name")
      .then(({ data }) => setColleges(data ?? []));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Soft college-email check — encourage .edu but never block.
    const domain = colleges.find((c) => c.name === college)?.email_domain;
    if (!email.endsWith(".edu") && !(domain && email.endsWith(domain))) {
      setNotice(
        "Tip: Rally is for students — a college (.edu) email is recommended.",
      );
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, college },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required there is no active session yet.
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setDone(true);
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4">
        <Logo className="mb-8" />
        <Card className="w-full max-w-md">
          <CardBody className="p-7 text-center">
            <h1 className="text-2xl font-bold text-ink-900">Check your email</h1>
            <p className="mt-2 text-sm text-ink-500">
              We sent a confirmation link to <b>{email}</b>. Click it to verify
              your account, then finish setting up your profile.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block font-semibold text-brand-700"
            >
              Back to log in
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardBody className="p-7">
          <h1 className="text-2xl font-bold text-ink-900">Create your account</h1>
          <p className="mt-1 mb-6 text-sm text-ink-500">
            Join your campus and start playing.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                placeholder="Sarah Johnson"
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
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="email">College email</Label>
              <Input
                id="email"
                type="email"
                required
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
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {notice ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {notice}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Get Started"}
            </Button>
          </form>
        </CardBody>
      </Card>
      <p className="mt-5 text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
