import {
  Trophy,
  Users,
  CalendarPlus,
  ShieldCheck,
  Scale,
  MapPin,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink, Card, CardBody, Badge } from "@/components/ui";

const FEATURES = [
  {
    icon: Trophy,
    title: "Skill-based matches",
    desc: "Get matched with players at your level — Beginner to Competitive — so every game feels fair and fun.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable players",
    desc: "Reliability scores and attendance tracking mean fewer no-shows and more games that actually happen.",
  },
  {
    icon: CalendarPlus,
    title: "Easy game creation",
    desc: "Spin up a pickup game in seconds — pick a sport, time, and spot, and let teammates find you.",
  },
  {
    icon: Users,
    title: "Campus communities",
    desc: "Join sport-based communities at your school to meet regulars and never play alone again.",
  },
  {
    icon: Scale,
    title: "Auto team balancing",
    desc: "One tap splits everyone into even Team A vs. Team B using skill levels and positions.",
  },
  {
    icon: MapPin,
    title: "Right on campus",
    desc: "Discover games near you, filtered by campus area, sport, time, and open spots.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log In
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Get Started
          </ButtonLink>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <Badge tone="brand" className="mx-auto mb-5">
            🏆 Sports matchmaking for college students
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-ink-900 sm:text-6xl">
            Find your next{" "}
            <span className="text-brand-600">pickup game.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-600">
            Rally connects you with students at your school for balanced,
            reliable pickup games — basketball, soccer, tennis and more.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg" className="w-full sm:w-auto">
              Get Started
            </ButtonLink>
            <ButtonLink
              href="/login"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Log In
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-ink-400">
            Free for students · Use your college email
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-ink-900">
            Everything you need to just play
          </h2>
          <p className="mt-2 text-ink-600">
            Less ghosting, more games. Here&apos;s how Rally helps.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="animate-fade-in">
              <CardBody>
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-1 text-sm text-ink-600">{f.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-white">
            Ready to rally your campus?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-ink-300">
            Create your profile, set your sports and skill level, and find a
            game happening near you today.
          </p>
          <ButtonLink href="/signup" size="lg" className="mt-7">
            Create your free account
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-ink-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-ink-400">
            © {new Date().getFullYear()} Rally. Built for college athletes.
          </p>
        </div>
      </footer>
    </div>
  );
}
