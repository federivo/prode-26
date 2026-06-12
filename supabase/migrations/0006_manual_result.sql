-- 0006_manual_result.sql
-- Permite que el admin cargue el resultado a mano (antes de que llegue de la API).
-- La API sigue siendo la fuente de verdad: cuando la API tenga su propio
-- resultado FINISHED, pisa el manual. El flag evita que la sync borre el manual
-- mientras la API todavía no actualizó.
alter table matches
  add column if not exists manual_result boolean not null default false;
