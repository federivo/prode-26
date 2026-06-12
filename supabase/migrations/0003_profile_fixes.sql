-- 0003_profile_fixes.sql
-- Arregla el loop de /onboarding: algunos usuarios no tenían fila en profiles
-- (el trigger de alta no había corrido), así que guardar el nombre no hacía nada.

-- (a) Re-crear el trigger que crea el profile al registrarse (idempotente).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- (b) Backfill: crear el profile faltante para usuarios que ya existen.
insert into public.profiles (id)
select u.id from auth.users u
on conflict (id) do nothing;

-- (c) Permitir que el usuario cree su propio profile (para el upsert del nombre).
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- (d) El cliente nunca setea is_app_admin (ni en insert ni en update).
create or replace function public.lock_profile_admin()
returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      new.is_app_admin := false;
    else
      new.is_app_admin := old.is_app_admin;
    end if;
  end if;
  return new;
end;
$fn$;

drop trigger if exists t_lock_profile_admin on public.profiles;
create trigger t_lock_profile_admin
  before insert or update on public.profiles
  for each row execute function public.lock_profile_admin();
