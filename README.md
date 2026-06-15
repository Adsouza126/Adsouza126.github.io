# 🏆 Rally

**Sports matchmaking for college students.** Find your next pickup game.

Rally helps college students create accounts, set their sports & skill levels,
and join or organize balanced, reliable pickup games on campus — basketball,
soccer, tennis, volleyball and more. It reduces ghosting with reliability
scores, builds fair teams automatically, and connects players through
sport-based campus communities.

> This is the first-version MVP. It focuses **only** on students finding and
> organizing games with each other — there is intentionally no facility
> integration, booking, payments, coupons, or business dashboards.

---

## ✨ Features

| Area | What it does |
| --- | --- |
| **Landing page** | Clean marketing homepage with Get Started / Log In. |
| **Auth** | Email + password sign up / log in / log out (college email encouraged). |
| **Onboarding & profile** | Name, college, photo, sports, per-sport skill level & position, availability grid, campus area & distance, bio. Reliability starts at 100. |
| **Dashboard** | Upcoming games, recommended games, reliability score, suggested communities, quick create. |
| **Create game** | Sport, date/time, location, max players, skill target, casual/competitive, public/private, description, auto-balance toggle. |
| **Discovery** | Browse & filter games by sport, campus, skill, casual/competitive, date, and open spots. |
| **Game detail** | Full info, roster, join/leave, host controls, player chat, balanced-teams generator. |
| **Team balancing** | Greedy skill + position algorithm splits players into even Team A / Team B. |
| **Reliability** | Hosts mark attended / no-show after a game; scores adjust and earn a badge (Highly Reliable / Reliable / Risky). |
| **Communities** | Sport-based groups per college (e.g. *University of Delaware Basketball*) with members, upcoming games & discussion. |
| **Matchmaking** | Recommendations prioritize same college, sport interests, similar skill, matching availability, and open spots. |

---

## 🧱 Tech stack

- **[Next.js 14](https://nextjs.org/)** (App Router) + **React 18**
- **TypeScript** (strict)
- **Tailwind CSS** — mobile-first, modern card UI
- **Supabase** — Postgres database + email/password auth (`@supabase/ssr`)
- **lucide-react** icons, **date-fns** for dates

---

## 📁 Project structure

```
.
├── app/
│   ├── (app)/                 # Authenticated, onboarded area (shared navbar)
│   │   ├── dashboard/
│   │   ├── games/             # discovery, /new, /[id] detail
│   │   ├── communities/       # list + /[id] detail
│   │   ├── profile/
│   │   └── layout.tsx         # auth + onboarding guard
│   ├── actions/               # Server Actions (games, communities, profile)
│   ├── auth/callback/         # email confirmation handler
│   ├── login/  signup/        # auth pages
│   ├── onboarding/            # profile setup
│   ├── page.tsx               # landing page
│   └── layout.tsx globals.css
├── components/                # UI primitives + feature components
│   ├── ui.tsx                 # Button, Card, Badge, inputs…
│   ├── game/                  # game detail sub-components
│   └── community/
├── lib/
│   ├── supabase/              # browser / server / middleware clients
│   ├── constants.ts           # skill levels, availability, reliability rules
│   ├── types.ts               # domain types
│   ├── teamBalancing.ts       # team-balancing algorithm
│   ├── recommendations.ts     # matchmaking scoring
│   ├── queries.ts             # server-side data access
│   └── auth.ts utils.ts
├── supabase/
│   ├── schema.sql             # tables, RLS, triggers
│   ├── seed.sql               # colleges, sports, communities
│   └── seed.mjs               # demo users + games (service role)
├── middleware.ts              # session refresh + route protection
└── .env.example
```

---

## 🚀 Run it locally

### 1. Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env.local
```
Fill in the values from **Supabase → Project Settings → API**:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # only used by the seed script
```

### 4. Set up the database
In the **Supabase SQL Editor**, run the two files in order:
1. `supabase/schema.sql` — creates tables, row-level security, and the
   profile-on-signup trigger.
2. `supabase/seed.sql` — inserts colleges, sports, and communities
   (University of Delaware is the main sample campus).

> **Tip:** For the smoothest demo, disable "Confirm email" under
> **Supabase → Authentication → Providers → Email** so new sign-ups log in
> immediately.

### 5. (Optional) Seed demo users & games
Creates 8 realistic UD players, sample games, chat, and community memberships:
```bash
npm run seed
```
Then log in with any demo account, e.g.:
```
sarah.johnson@udel.edu  /  rally1234
```

### 6. Start the app
```bash
npm run dev
```
Open **http://localhost:3000**.

---

## 🧮 How the algorithms work

**Team balancing** (`lib/teamBalancing.ts`)
Each skill level maps to a value (Beginner 1 → Competitive 4). Players are
sorted strongest→weakest and assigned to whichever team has the lower running
skill total; ties prefer spreading positions, then break randomly — so you can
re-balance for fresh line-ups.

**Recommendations** (`lib/recommendations.ts`)
Each candidate game is scored: same college (+40), plays the sport (+30),
similar skill to the game's target (up to +15), availability overlap (+12),
open spots (+6), and a small recency boost. Top matches surface on the
dashboard.

**Reliability** (`lib/constants.ts`)
Everyone starts at 100. After a game the host marks attendance: attended
+2 (capped at 100), no-show −15. Badges: 90–100 Highly Reliable, 70–89
Reliable, below 70 Risky. Every change is written to an audit log.

---

## 🔐 Security notes
- Row-Level Security is enabled on every table; writes are restricted to the
  owning user (or game host) via policies in `schema.sql`.
- The **service role key** is only ever used by the local seed script — never
  ship it to the browser.

---

## 📜 Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run seed` | Seed demo users & games (needs service role key) |

---

Built as a startup-quality first version of Rally. 🟢
