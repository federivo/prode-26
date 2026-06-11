# Prode Mundial 2026 ⚽

Web app para jugar al prode del Mundial FIFA 2026 con amigos: cargás tus
pronósticos de cada partido y competís en una tabla que se actualiza sola.

- **Resultado exacto** → 3 puntos
- **Acertar ganador/empate** → 1 punto
- Los puntos valen **más en las fases finales** (×2 a ×4).
- Un solo set de pronósticos por persona, que suma en **todos** tus grupos.

## Stack (todo en capa gratuita — costo $0)

- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind v4
- **Supabase** — Postgres + Auth (magic link) + Row Level Security
- **Resend** — envío de mails del magic link (SMTP de Supabase)
- **football-data.org** — fixtures y resultados (competición `WC`)
- **Vercel Hobby** — deploy

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. Aplicá el esquema: pegá `supabase/migrations/0001_init.sql` en el **SQL Editor**
   y ejecutalo (o usá la CLI: `supabase db push`).
3. En **Authentication → Sign In / Providers**, dejá habilitado **Email** con
   "Email OTP / Magic Link".
4. **SMTP (Resend):** registrate gratis en [resend.com](https://resend.com)
   (100 mails/día), creá una API key, y en Supabase **Authentication → SMTP
   Settings** cargá el host `smtp.resend.com`, puerto `465`, usuario `resend`,
   password = tu API key. (Sin esto, el envío usa el mailer de Supabase, que
   está limitado y no sirve para producción.)
5. Personalizá el template del mail (**Authentication → Email Templates → Magic
   Link**) en español: "Tu acceso al Prode".

### 2. Variables de entorno

Copiá `.env.example` a `.env.local` y completá con los valores reales:

```
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # secreto, solo server
FOOTBALL_DATA_API_KEY=...           # football-data.org/client/register
CRON_SECRET=...                     # string random largo
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Correr local

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # tests del motor de puntajes
```

Entrá con tu mail, hacé clic en el link, elegí tu nombre, y creá un grupo.

### 4. Darte permisos de admin (para sincronizar partidos)

Después de entrar la primera vez, corré en el SQL Editor de Supabase:

```sql
update profiles set is_app_admin = true
where id = (select id from auth.users where email = 'TU-MAIL');
```

Vas a ver la pestaña **Admin** con el botón para sincronizar los partidos.

### 5. Deploy en Vercel

1. Subí el repo a GitHub e importalo en [vercel.com](https://vercel.com) (plan
   Hobby, gratis).
2. Cargá las mismas variables de entorno; poné `NEXT_PUBLIC_SITE_URL` con la URL
   de Vercel (`https://tu-app.vercel.app`).
3. En Supabase **Authentication → URL Configuration**, agregá esa URL a
   "Site URL" y "Redirect URLs" (`https://tu-app.vercel.app/auth/callback`).

## Sincronización de partidos

Los resultados se traen de football-data.org de tres formas (todas gratis):

1. **Perezosa (principal):** al abrir Partidos o una Tabla, si pasaron +15 min
   desde la última sync, se actualiza sola.
2. **Manual:** botón en la pestaña Admin.
3. **Pinger externo (opcional):** GitHub Action que pega cada 15 min al endpoint
   `/api/cron/sync`. Ver `.github/workflows/sync.yml`. Configurá los secrets
   `SYNC_URL` (`https://tu-app.vercel.app/api/cron/sync`) y `CRON_SECRET` en el
   repo de GitHub.

> No usamos Vercel Cron porque en el plan Hobby corre solo una vez por día.

## Tests

```bash
npm test
```

Cubren el motor de puntajes (`src/lib/scoring.ts`): resultado exacto, acierto de
resultado, fallo, multiplicadores por fase y eliminatorias por penales.
