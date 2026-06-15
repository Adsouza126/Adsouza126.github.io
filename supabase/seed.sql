-- ════════════════════════════════════════════════════════════════════════
-- Rally — reference seed data (colleges, sports, communities)
-- Run AFTER schema.sql. Safe to re-run (uses upserts on unique keys).
--
-- Demo USERS and GAMES are created separately by `npm run seed`, which needs
-- the service-role key to create auth users. See README.
-- ════════════════════════════════════════════════════════════════════════

-- Colleges -----------------------------------------------------------------
insert into public.colleges (name, slug, email_domain) values
  ('University of Delaware', 'university-of-delaware', 'udel.edu'),
  ('Penn State University',  'penn-state',             'psu.edu'),
  ('Rutgers University',     'rutgers',                'rutgers.edu'),
  ('Temple University',      'temple',                 'temple.edu')
on conflict (name) do nothing;

-- Sports -------------------------------------------------------------------
insert into public.sports (name, slug, icon, positions) values
  ('Basketball', 'basketball', '🏀', array['Point Guard','Shooting Guard','Small Forward','Power Forward','Center']),
  ('Soccer',     'soccer',     '⚽', array['Goalkeeper','Defender','Midfielder','Forward']),
  ('Tennis',     'tennis',     '🎾', array['Singles','Doubles']),
  ('Volleyball', 'volleyball', '🏐', array['Setter','Outside Hitter','Middle Blocker','Libero']),
  ('Flag Football','flag-football','🏈', array['Quarterback','Receiver','Rusher','Defense']),
  ('Pickleball', 'pickleball', '🥒', array['Singles','Doubles']),
  ('Badminton',  'badminton',  '🏸', array['Singles','Doubles']),
  ('Ultimate Frisbee','ultimate-frisbee','🥏', array['Handler','Cutter'])
on conflict (name) do nothing;

-- Communities — one per (college, sport) for the main sample campus ---------
-- University of Delaware gets the full set; others a couple each.
insert into public.communities (name, slug, college, sport_id, description)
select
  c.name || ' ' || s.name,
  c.slug || '-' || s.slug,
  c.name,
  s.id,
  'The home for ' || s.name || ' players at ' || c.name || '. Find pickup games, meet teammates, and organize sessions.'
from public.colleges c
join public.sports s on true
where
  (c.slug = 'university-of-delaware'
     and s.slug in ('basketball','soccer','tennis','volleyball','pickleball','flag-football'))
  or (c.slug = 'penn-state' and s.slug in ('basketball','soccer'))
  or (c.slug = 'rutgers'    and s.slug in ('soccer','volleyball'))
  or (c.slug = 'temple'     and s.slug in ('basketball','tennis'))
on conflict (college, sport_id) do nothing;
