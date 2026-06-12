-- 0002_security.sql
-- Corrige dos problemas críticos: como el cliente tiene la anon key + sesión,
-- puede escribir en las tablas vía PostgREST salteando los server actions. RLS
-- es por fila (no por columna), así que agregamos triggers que impiden que el
-- cliente toque columnas sensibles. El service role (scoring/sync) sí puede.

-- ── 1) El cliente nunca controla points_awarded (solo el scoring) ─────────────
create or replace function public.lock_prediction_points()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      new.points_awarded := null;
    else
      new.points_awarded := old.points_awarded;
    end if;
  end if;
  return new;
end;
$fn$;

drop trigger if exists t_lock_prediction_points on public.predictions;
create trigger t_lock_prediction_points
  before insert or update on public.predictions
  for each row execute function public.lock_prediction_points();

-- ── 2) El cliente nunca cambia is_app_admin (solo el service role) ────────────
create or replace function public.lock_profile_admin()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if auth.role() is distinct from 'service_role' then
    new.is_app_admin := old.is_app_admin;
  end if;
  return new;
end;
$fn$;

drop trigger if exists t_lock_profile_admin on public.profiles;
create trigger t_lock_profile_admin
  before update on public.profiles
  for each row execute function public.lock_profile_admin();
