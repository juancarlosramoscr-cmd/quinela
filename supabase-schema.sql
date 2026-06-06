-- ═══════════════════════════════════════════════════════════════════════════
-- QUINIELA MUNDIAL 2026 — Schema completo de Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- ── TABLA: users ─────────────────────────────────────────────────────────────
create table public.users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  nickname    text,
  avatar_icon text not null default '⚽',
  color       text not null default '#C9A84C',
  created_at  timestamptz not null default now()
);

-- ── TABLA: teams ─────────────────────────────────────────────────────────────
create table public.teams (
  id        text primary key,    -- ej: 'arg', 'bra'
  name      text not null,       -- ej: 'Argentina'
  flag      text not null,       -- ej: '🇦🇷'
  flag_code text not null,       -- ej: 'ar' (para flagcdn.com)
  group_id  text not null,       -- 'A' … 'L'
  fifa_code text not null        -- ej: 'ARG'
);

-- ── TABLA: matches ────────────────────────────────────────────────────────────
create table public.matches (
  id               uuid primary key default uuid_generate_v4(),
  group_id         text not null,
  home_team_id     text not null references public.teams(id),
  away_team_id     text not null references public.teams(id),
  match_date       timestamptz not null,
  home_score       int,
  away_score       int,
  status           text not null default 'pending'  -- 'pending' | 'live' | 'final'
                   check (status in ('pending', 'live', 'final')),
  external_api_id  int unique     -- ID en API-Football
);

-- ── TABLA: predictions ───────────────────────────────────────────────────────
create table public.predictions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  match_id       uuid not null references public.matches(id) on delete cascade,
  predicted_home int not null check (predicted_home >= 0),
  predicted_away int not null check (predicted_away >= 0),
  points         int,             -- null hasta que el partido termine
  locked         boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, match_id)
);

-- ── ÍNDICES ───────────────────────────────────────────────────────────────────
create index idx_predictions_user   on public.predictions(user_id);
create index idx_predictions_match  on public.predictions(match_id);
create index idx_matches_status     on public.matches(status);
create index idx_matches_group      on public.matches(group_id);
create index idx_matches_date       on public.matches(match_date);

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
-- Nota: para app familiar simple, dejamos RLS permisivo.
-- En producción con auth real, ajustar políticas.

alter table public.users       enable row level security;
alter table public.teams       enable row level security;
alter table public.matches     enable row level security;
alter table public.predictions enable row level security;

-- Políticas: lectura pública, escritura anon permitida (ajustar con auth real)
create policy "Public read users"       on public.users       for select using (true);
create policy "Public insert users"     on public.users       for insert with check (true);

create policy "Public read teams"       on public.teams       for select using (true);

create policy "Public read matches"     on public.matches     for select using (true);

create policy "Public read predictions"    on public.predictions for select using (true);
create policy "Public insert predictions"  on public.predictions for insert with check (true);
create policy "Public update predictions"  on public.predictions for update using (true);

-- Service role puede hacer todo (para el cron de sync)
create policy "Service role all on matches"     on public.matches     for all using (auth.role() = 'service_role');
create policy "Service role all on predictions" on public.predictions for all using (auth.role() = 'service_role');

-- ── VISTA: leaderboard ────────────────────────────────────────────────────────
-- Vista calculada en tiempo real (no materializada para simplificar)
create or replace view public.leaderboard as
select
  u.id           as user_id,
  u.name,
  u.nickname,
  u.avatar_icon,
  u.color,
  coalesce(sum(p.points), 0)                              as total_points,
  count(*) filter (where p.points = 3)                   as exact_count,
  count(*) filter (where p.points = 1)                   as correct_count,
  count(*) filter (where p.points is not null)           as played_count
from public.users u
left join public.predictions p on p.user_id = u.id and p.locked = true
left join public.matches m     on m.id = p.match_id and m.status = 'final'
group by u.id, u.name, u.nickname, u.avatar_icon, u.color
order by total_points desc, exact_count desc;

-- ── FUNCIÓN: auto-update updated_at ──────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger predictions_updated_at
  before update on public.predictions
  for each row execute procedure public.handle_updated_at();
