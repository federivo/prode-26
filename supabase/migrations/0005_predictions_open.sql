-- 0005_predictions_open.sql
-- Permite que el admin "abra" un partido para que los jugadores carguen/editen
-- su pronóstico aunque ya haya empezado/terminado (útil para migrar).

alter table matches
  add column if not exists predictions_open boolean not null default false;

-- ¿Puede el usuario cargar pronóstico para este partido?
--  - antes del kickoff (estado normal), o
--  - si el admin lo abrió manualmente (predictions_open).
create or replace function public.can_predict(p_match uuid)
returns boolean language sql security definer stable set search_path = public as $fn$
  select exists (
    select 1 from matches
    where id = p_match
      and ((status = 'SCHEDULED' and kickoff > now()) or predictions_open)
  );
$fn$;

-- Reemplaza el candado de kickoff por can_predict en las policies.
drop policy if exists predictions_insert on predictions;
create policy predictions_insert on predictions for insert to authenticated
  with check (user_id = auth.uid() and can_predict(match_id));

drop policy if exists predictions_update on predictions;
create policy predictions_update on predictions for update to authenticated
  using (user_id = auth.uid() and can_predict(match_id))
  with check (user_id = auth.uid() and can_predict(match_id));
