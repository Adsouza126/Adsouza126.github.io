// ════════════════════════════════════════════════════════════════════════
// Rally — demo data seeder
//
// Creates realistic sample USERS, GAMES, memberships and chat for the
// University of Delaware sample campus. Reference data (colleges, sports,
// communities) must already exist — run supabase/schema.sql and
// supabase/seed.sql first.
//
// Usage:
//   1. Fill NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
//   2. npm run seed
//
// Safe to re-run: existing demo users are reused by email.
// ════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "✗ Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const COLLEGE = "University of Delaware";
const PASSWORD = "rally1234"; // demo password for all sample accounts

const availability = {
  Monday: ["Evening"],
  Wednesday: ["Afternoon", "Evening"],
  Friday: ["Evening"],
  Saturday: ["Morning", "Afternoon"],
  Sunday: ["Afternoon"],
};

// Demo players. `sports` references sport names seeded in seed.sql.
const USERS = [
  {
    full_name: "Sarah Johnson",
    email: "sarah.johnson@udel.edu",
    bio: "Sophomore. Point guard who loves a fast break. Always down for 5-on-5.",
    campus_area: "Main Campus",
    sports: [
      { name: "Basketball", skill: "Competitive", position: "Point Guard" },
      { name: "Volleyball", skill: "Intermediate", position: "Setter" },
    ],
  },
  {
    full_name: "Marcus Lee",
    email: "marcus.lee@udel.edu",
    bio: "Grad student. Played JV soccer in high school. Casual but competitive.",
    campus_area: "South Campus",
    sports: [
      { name: "Soccer", skill: "Intermediate", position: "Midfielder" },
      { name: "Basketball", skill: "Casual", position: "Small Forward" },
    ],
  },
  {
    full_name: "Priya Patel",
    email: "priya.patel@udel.edu",
    bio: "Tennis since I was 8. Looking for doubles partners on campus.",
    campus_area: "Main Campus",
    sports: [
      { name: "Tennis", skill: "Competitive", position: "Doubles" },
      { name: "Pickleball", skill: "Intermediate", position: "Doubles" },
    ],
  },
  {
    full_name: "Diego Ramirez",
    email: "diego.ramirez@udel.edu",
    bio: "Striker. Will run all 90 minutes. Let's get a game going.",
    campus_area: "The Green",
    sports: [
      { name: "Soccer", skill: "Competitive", position: "Forward" },
      { name: "Flag Football", skill: "Casual", position: "Receiver" },
    ],
  },
  {
    full_name: "Emily Chen",
    email: "emily.chen@udel.edu",
    bio: "New to volleyball but improving fast. Beginner-friendly games please!",
    campus_area: "Main Campus",
    sports: [
      { name: "Volleyball", skill: "Beginner", position: "Outside Hitter" },
      { name: "Basketball", skill: "Beginner", position: "Shooting Guard" },
    ],
  },
  {
    full_name: "Tyler Brooks",
    email: "tyler.brooks@udel.edu",
    bio: "Center. Rebounds and screens are my love language.",
    campus_area: "North Campus",
    sports: [
      { name: "Basketball", skill: "Intermediate", position: "Center" },
      { name: "Flag Football", skill: "Intermediate", position: "Rusher" },
    ],
  },
  {
    full_name: "Aisha Mohammed",
    email: "aisha.mohammed@udel.edu",
    bio: "Midfield engine. Also play pickup volleyball on weekends.",
    campus_area: "Main Campus",
    sports: [
      { name: "Soccer", skill: "Intermediate", position: "Midfielder" },
      { name: "Volleyball", skill: "Casual", position: "Libero" },
    ],
  },
  {
    full_name: "Jordan Smith",
    email: "jordan.smith@udel.edu",
    bio: "Defender who can play anywhere. Captain energy.",
    campus_area: "South Campus",
    sports: [
      { name: "Soccer", skill: "Casual", position: "Defender" },
      { name: "Basketball", skill: "Casual", position: "Power Forward" },
    ],
  },
];

const log = (m) => console.log(m);

async function findUserByEmail(email) {
  // listUsers is paginated; one page of 1000 is plenty for demo data.
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users?.find((u) => u.email === email) ?? null;
}

async function main() {
  log("→ Loading reference data…");
  const [{ data: sports }, { data: communities }] = await Promise.all([
    admin.from("sports").select("id, name"),
    admin.from("communities").select("id, sport_id, college"),
  ]);

  if (!sports?.length) {
    console.error(
      "✗ No sports found. Run supabase/schema.sql and supabase/seed.sql first.",
    );
    process.exit(1);
  }
  const sportByName = Object.fromEntries(sports.map((s) => [s.name, s.id]));

  // ── Create / fetch users ────────────────────────────────────────────────
  log("→ Creating demo users…");
  const userIds = {};
  for (const u of USERS) {
    let existing = await findUserByEmail(u.email);
    if (!existing) {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, college: COLLEGE },
      });
      if (error) {
        console.error(`  ✗ ${u.email}: ${error.message}`);
        continue;
      }
      existing = data.user;
      log(`  ✓ created ${u.email}`);
    } else {
      log(`  • reusing ${u.email}`);
    }
    userIds[u.email] = existing.id;

    // Fill out the profile (the signup trigger created the base row).
    await admin
      .from("profiles")
      .update({
        full_name: u.full_name,
        college: COLLEGE,
        bio: u.bio,
        campus_area: u.campus_area,
        preferred_distance: 5,
        availability,
        onboarded: true,
      })
      .eq("id", existing.id);

    // Replace this user's sports.
    await admin.from("user_sports").delete().eq("user_id", existing.id);
    await admin.from("user_sports").insert(
      u.sports.map((s) => ({
        user_id: existing.id,
        sport_id: sportByName[s.name],
        skill_level: s.skill,
        preferred_position: s.position,
      })),
    );

    // Join matching UD communities.
    for (const s of u.sports) {
      const community = communities?.find(
        (c) => c.sport_id === sportByName[s.name] && c.college === COLLEGE,
      );
      if (community) {
        await admin
          .from("community_members")
          .upsert(
            { community_id: community.id, user_id: existing.id },
            { onConflict: "community_id,user_id" },
          );
      }
    }
  }

  // ── Create games ──────────────────────────────────────────────────────────
  log("→ Creating demo games…");
  const day = (n, hour) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };

  const GAMES = [
    {
      host: "Sarah Johnson",
      sport: "Basketball",
      title: "Friday night 5-on-5",
      starts_at: day(3, 19),
      location: "Carpenter Sports Building, Court 2",
      campus_area: "Main Campus",
      max_players: 10,
      skill_target: "Intermediate",
      competitive: true,
      description: "Bring a light & dark shirt. We'll auto-balance teams.",
      players: ["Marcus Lee", "Tyler Brooks", "Emily Chen", "Jordan Smith"],
      messages: [
        ["Sarah Johnson", "Got the court booked for 7! See everyone there."],
        ["Tyler Brooks", "I'll bring an extra ball 🏀"],
      ],
    },
    {
      host: "Diego Ramirez",
      sport: "Soccer",
      title: "Sunday pickup soccer",
      starts_at: day(5, 15),
      location: "The Green (intramural fields)",
      campus_area: "The Green",
      max_players: 14,
      skill_target: "Any",
      competitive: false,
      description: "All levels welcome. Pinnies provided.",
      players: ["Marcus Lee", "Aisha Mohammed", "Jordan Smith"],
      messages: [
        ["Diego Ramirez", "Weather looks great for Sunday ☀️"],
        ["Aisha Mohammed", "Count me in!"],
      ],
    },
    {
      host: "Priya Patel",
      sport: "Tennis",
      title: "Doubles round-robin",
      starts_at: day(2, 17),
      location: "UD Tennis Courts",
      campus_area: "Main Campus",
      max_players: 4,
      skill_target: "Intermediate",
      competitive: true,
      description: "Rotating doubles. Bring water!",
      players: ["Sarah Johnson"],
      messages: [["Priya Patel", "Need 2 more for doubles — who's in?"]],
    },
    {
      host: "Emily Chen",
      sport: "Volleyball",
      title: "Beginner-friendly volleyball",
      starts_at: day(4, 18),
      location: "Little Bob Gym",
      campus_area: "Main Campus",
      max_players: 12,
      skill_target: "Beginner",
      competitive: false,
      description: "Super chill, learning-focused. New players encouraged!",
      players: ["Sarah Johnson", "Aisha Mohammed"],
      messages: [["Emily Chen", "First time playing? Perfect, so are most of us 😄"]],
    },
  ];

  for (const g of GAMES) {
    const hostId = userIds[g.host];
    if (!hostId) continue;

    // Avoid duplicating a host's game with the same title.
    const { data: dupe } = await admin
      .from("games")
      .select("id")
      .eq("host_id", hostId)
      .eq("title", g.title)
      .maybeSingle();
    if (dupe) {
      log(`  • game exists: ${g.title}`);
      continue;
    }

    const { data: game, error } = await admin
      .from("games")
      .insert({
        host_id: hostId,
        sport_id: sportByName[g.sport],
        title: g.title,
        starts_at: g.starts_at,
        location: g.location,
        campus_area: g.campus_area,
        college: COLLEGE,
        max_players: g.max_players,
        skill_target: g.skill_target,
        competitive: g.competitive,
        is_public: true,
        description: g.description,
        auto_balance: true,
      })
      .select("id")
      .single();
    if (error) {
      console.error(`  ✗ ${g.title}: ${error.message}`);
      continue;
    }

    const roster = [g.host, ...g.players]
      .map((name) => USERS.find((u) => u.full_name === name)?.email)
      .map((email) => userIds[email])
      .filter(Boolean);

    await admin.from("game_participants").upsert(
      roster.map((uid) => ({ game_id: game.id, user_id: uid })),
      { onConflict: "game_id,user_id" },
    );

    for (const [author, body] of g.messages) {
      await admin.from("messages").insert({
        game_id: game.id,
        user_id: userIds[USERS.find((u) => u.full_name === author)?.email],
        body,
      });
    }
    log(`  ✓ ${g.title} (${roster.length} players)`);
  }

  log("\n✅ Seed complete!");
  log(`   Demo login: sarah.johnson@udel.edu / ${PASSWORD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
