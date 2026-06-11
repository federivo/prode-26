-- Prode Mundial 2026 — esquema inicial
-- Identidad global + membresía muchos-a-muchos. Partidos y pronósticos son globales.

-- ── Enums ─────────────────────────────────────────────────────────────────────
create type match_stage as enum (
  'GROUP', 'LAST_32', 'LAST_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'
);
create type match_status as enum ('SCHEDULED', 'IN_PLAY', 'FINISHED');
create type match_winner as enum ('HOME', 'AWAY', 'DRAW');
create type membership_role as enum ('admin', 'member');

-- ── Tablas ────────────────────────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  is_app_admin boolean not null default false,
  created_at   timestamptz not null default now()
);

create table leagues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,
  created_by  uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table memberships (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references profiles (id) on delete cascade,
  league_id uuid not null references leagues (id) on delete cascade,
  role      membership_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (user_id, league_id)
);
create index on memberships (league_id);
create index on memberships (user_id);

create table matches (
  id          uuid primary key default gen_random_uuid(),
  external_id bigint not null unique,
  stage       match_stage not null,
  home_team   text,
  away_team   text,
  kickoff     timestamptz not null,
  status      match_status not null default 'SCHEDULED',
  home_score  int,
  away_score  int,
  winner      match_winner,
  updated_at  timestamptz not null default now()
);
create index on matches (kickoff);

create table predictions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles (id) on delete cascade,
  match_id       uuid not null references matches (id) on delete cascade,
  home_score     int not null check (home_score >= 0 and home_score <= 99),
  away_score     int not null check (away_score >= 0 and away_score <= 99),
  points_awarded int,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, match_id)
);
create index on predictions (match_id);
create index on predictions (user_id);

-- Estado de sincronización (una sola fila).
create table sync_state (
  id             boolean primary key default true check (id),
  last_synced_at timestamptz
);
insert into sync_state (id, last_synced_at) values (true, null);

-- ── Trigger: crear profile al registrarse ─────────────────────────────────────
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- display_name arranca vacío: la app pide el nombre en el onboarding.
  insert into public.profiles (id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Funciones auxiliares (SECURITY DEFINER para evitar recursión de RLS) ───────
create function public.is_member(p_league uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships
    where league_id = p_league and user_id = auth.uid()
  );
$$;

create function public.shares_group(p_other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships m1
    join memberships m2 on m1.league_id = m2.league_id
    where m1.user_id = auth.uid() and m2.user_id = p_other
  );
$$;

-- ¿El partido ya arrancó? (bloquea edición de pronósticos)
create function public.match_started(p_match uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from matches
    where id = p_match and (kickoff <= now() or status <> 'SCHEDULED')
  );
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table profiles    enable row level security;
alter table leagues     enable row level security;
alter table memberships enable row level security;
alter table matches     enable row level security;
alter table predictions enable row level security;
alter table sync_state  enable row level security;

-- profiles: ves tu perfil y el de quienes comparten un grupo con vos.
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or shares_group(id));
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- leagues: ves los grupos donde sos miembro; podés crear grupos.
create policy leagues_select on leagues for select to authenticated
  using (created_by = auth.uid() or is_member(id));
create policy leagues_insert on leagues for insert to authenticated
  with check (created_by = auth.uid());
create policy leagues_update on leagues for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- memberships: ves las membresías de tus grupos; solo te sumás a vos mismo.
create policy memberships_select on memberships for select to authenticated
  using (user_id = auth.uid() or is_member(league_id));
create policy memberships_insert on memberships for insert to authenticated
  with check (user_id = auth.uid());
create policy memberships_delete on memberships for delete to authenticated
  using (user_id = auth.uid());

-- matches: cualquiera autenticado puede verlos. (Las escrituras van por service role.)
create policy matches_select on matches for select to authenticated
  using (true);

-- predictions:
--  - ves los tuyos siempre;
--  - los de otros solo si el partido ya arrancó y comparten grupo con vos.
create policy predictions_select on predictions for select to authenticated
  using (
    user_id = auth.uid()
    or (match_started(match_id) and shares_group(user_id))
  );
--  - solo creás/editás los tuyos y solo si el partido no arrancó (candado en DB).
create policy predictions_insert on predictions for insert to authenticated
  with check (user_id = auth.uid() and not match_started(match_id));
create policy predictions_update on predictions for update to authenticated
  using (user_id = auth.uid() and not match_started(match_id))
  with check (user_id = auth.uid() and not match_started(match_id));

-- sync_state: lectura para todos los autenticados; escritura solo service role.
create policy sync_state_select on sync_state for select to authenticated
  using (true);
