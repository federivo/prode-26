# Prode Mundial 2026 ⚽

Web app para jugar al prode del Mundial FIFA 2026 con amigos: cargás tus
pronósticos de cada partido y competís en una tabla que se actualiza sola.

**Puntajes:**

- Resultado exacto → **10**
- Acierta ganador/empate **+** los goles de un equipo → **7**
- Acierta ganador o empate → **5**
- Acierta solo los goles de un equipo → **2**
- No acierta nada / sin pronóstico → **0**

Un solo set de pronósticos por persona, que suma en **todos** tus grupos.

## Stack (todo en capa gratuita — costo $0)

- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind v4
- **Supabase** — Postgres + Auth (magic link) + Storage (avatares) + RLS
- **Resend** — envío de los mails del magic link (SMTP de Supabase, solo prod)
- **football-data.org** — fixtures y resultados (competición `WC`)
- **Vercel Hobby** — deploy

## Requisitos

- **Node.js 22+** y npm (el repo usa Node 22).
- Para el entorno 100% local (Opción A): **Docker** + **Supabase CLI**
  (`brew install supabase/tap/supabase`, o usar `npx supabase ...`).
- Una **API key de football-data.org** (gratis): registrate en
  [football-data.org/client/register](https://www.football-data.org/client/register).
  Sin ella la app corre igual, pero no hay partidos hasta sincronizar.

---

## Desarrollo local

Hay dos formas de levantar el backend. La **Opción A** es totalmente local (no
necesitás cuenta de Supabase ni servicio de mail). La **Opción B** apunta a un
proyecto de Supabase en la nube.

### Opción A — Supabase local con la CLI (recomendada)

Levanta Postgres + Auth + Storage + Studio + un buzón de mails local (Inbucket),
todo en Docker. Los magic links caen en Inbucket, así que **no hace falta SMTP**.

```bash
# 1. Dependencias del front
npm install

# 2. Inicializar Supabase (crea supabase/config.toml; las migraciones ya están)
npx supabase init        # respondé "N" si pregunta por sobrescribir algo

# 3. Levantar el stack local (tarda la primera vez: baja imágenes de Docker)
npx supabase start       # imprime las URLs y las KEYS locales — copialas

# 4. Aplicar TODAS las migraciones + seed al Postgres local
npx supabase db reset
```

`supabase start` imprime algo así (los valores son fijos para local):

```
API URL:        http://127.0.0.1:54321
Studio URL:     http://127.0.0.1:54323   (panel tipo dashboard)
Inbucket URL:   http://127.0.0.1:54324   (acá llegan los mails)
anon key:       eyJ...
service_role:   eyJ...
```

Creá `.env.local` (copialo de `.env.example`) con los valores **locales**:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key que imprimió supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key que imprimió supabase start>
FOOTBALL_DATA_API_KEY=<tu key de football-data.org>
CRON_SECRET=cualquier-string-random
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> En `supabase/config.toml`, asegurate de que `[auth]` tenga
> `site_url = "http://localhost:3000"` y que `additional_redirect_urls`
> incluya `"http://localhost:3000"`, así el link del mail vuelve a la app.

Arrancá la app:

```bash
npm run dev          # http://localhost:3000
```

**Entrar:** poné tu mail → abrí **Inbucket** (http://127.0.0.1:54324), vas a ver
el mail con el link → tocalo → elegí tu nombre. Listo.

Para frenar todo: `npx supabase stop`.

### Opción B — Proyecto Supabase en la nube

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. **Aplicá las migraciones en orden** (`supabase/migrations/0001…0006`):
   pegá cada archivo en el **SQL Editor** y ejecutalo, o con la CLI:
   `npx supabase link --project-ref <ref>` y `npx supabase db push`.
3. **Auth:** en **Authentication → Sign In / Providers**, dejá **Email**
   habilitado (magic link). Para mandarles mails a otros (no a vos), configurá
   SMTP con **Resend** en **Authentication → SMTP Settings** (host
   `smtp.resend.com`, puerto `465`, usuario `resend`, password = tu API key).
   Para probar solo con tu propio mail, el mailer interno de Supabase alcanza.
4. **URLs:** en **Authentication → URL Configuration**, poné `Site URL` y
   agregá a `Redirect URLs` la URL que uses (`http://localhost:3000` en local).
5. `.env.local`: tomá `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY` y
   `SERVICE_ROLE_KEY` de **Settings → API**; `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
6. `npm install && npm run dev`.

---

## Variables de entorno

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto/instancia Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública, va al browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (**secreta**, solo server: sync, avatares, admin) |
| `FOOTBALL_DATA_API_KEY` | Key de football-data.org |
| `CRON_SECRET` | String random para proteger `/api/cron/sync` |
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio, **sin barra final** |

## Migraciones

Están en `supabase/migrations/`, numeradas y pensadas para aplicarse **en orden**:

| Archivo | Qué agrega |
|---|---|
| `0001_init.sql` | Tablas, enums, funciones y políticas RLS base |
| `0002_security.sql` | Triggers anti-trampa (puntos e `is_app_admin`) |
| `0003_profile_fixes.sql` | Trigger de alta de profile + backfill + insert policy |
| `0004_avatars.sql` | Columna `avatar_url` + bucket de Storage `avatars` |
| `0005_predictions_open.sql` | Abrir un partido para cargar pronósticos tarde |
| `0006_manual_result.sql` | Cargar el resultado de un partido a mano |

En local con la CLI se aplican solas con `npx supabase db reset`.

## Permisos de admin (ojo con el trigger)

Por seguridad, el trigger `t_lock_profile_admin` (de `0002`/`0003`) **revierte**
cualquier cambio a `is_app_admin` que no venga del *service role*. El SQL Editor
**no** es service role, así que un `update profiles set is_app_admin = true` ahí
se deshace solo (sin error).

Dos formas correctas de dar admin:

- **Recomendado:** desde la app, **Admin → Usuarios**, tildá **Admin** y guardá
  (va por service role, el trigger lo permite).
- **Por SQL:** deshabilitá el trigger alrededor del update:

  ```sql
  alter table profiles disable trigger t_lock_profile_admin;
  update profiles set is_app_admin = true
  where id = (select id from auth.users where email = 'TU-MAIL');
  alter table profiles enable trigger t_lock_profile_admin;
  ```

El primer admin (cuando todavía no hay ninguno) se hace siempre por SQL.

## Sincronización de partidos

Los resultados se traen de football-data.org de tres formas (todas gratis):

1. **Perezosa (principal):** al abrir Partidos o una Tabla, si pasaron +15 min
   desde la última sync, se actualiza sola.
2. **Manual:** botón en la pestaña Admin (necesitás permisos de admin).
3. **Pinger externo (opcional):** GitHub Action que pega cada 15 min a
   `/api/cron/sync`. Ver `.github/workflows/sync.yml`; configurá los secrets
   `SYNC_URL` y `CRON_SECRET` en el repo de GitHub.

> No usamos Vercel Cron porque en el plan Hobby corre solo una vez por día.

## Deploy en Vercel

1. Subí el repo a GitHub e importalo en [vercel.com](https://vercel.com) (Hobby).
2. Cargá las mismas variables de entorno; `NEXT_PUBLIC_SITE_URL` = la URL de
   Vercel (sin barra final). Cada push a `main` deploya solo.
3. En Supabase **Authentication → URL Configuration**, poné esa URL como
   `Site URL` y agregá `…/auth/callback` a `Redirect URLs`.

## Tests

```bash
npm run test     # motor de puntajes (Vitest)
npm run lint     # ESLint
npm run build    # build de producción
```

Los tests cubren `src/lib/scoring.ts`: exacto, ganador/empate con y sin goles de
un lado, solo un lado, fallo, y eliminatorias definidas por penales.
