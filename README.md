# Icelandic Running Championships

Prototype for a public Icelandic running championship site. The race calendar and imported Puffin Run results can render from hosted Supabase; championship standings remain a generated prototype layer while scoring rules are finalized.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase
- Vercel

Read `AGENTS.md` before changing Next.js code. This repo uses a newer Next.js version with local docs in `node_modules/next/dist/docs/`.

## Local Development

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

Create `.env.local` from `.env.example` for Supabase-backed pages:

```sh
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

Useful checks:

```sh
npm run data:validate
npm run lint
npm run build
```

## Data Pipeline

See:

- `docs/import_pipeline.md`
- `docs/data_model_decisions.md`

Local Supabase import flow:

```sh
supabase start
supabase migration up
npm run import:schedule -- --target local
npm run import:timataka:db -- --target local --race-id 13
```

Hosted imports must be explicit and use shell-provided credentials:

```sh
SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." npm run import:schedule -- --target hosted
SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." npm run import:timataka:db -- --target hosted --race-id 13
```

Do not commit secrets. `.env.local` is ignored and should not be inspected or shared.

## Deployment

Vercel production and preview environments need these public runtime variables:

```sh
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

The website does not need a Supabase service-role key. Service-role credentials are only for one-off import commands run from a trusted shell.

After deployment, verify:

- Homepage shows `188 Supabase races`.
- Homepage links the featured race to `/races/schedule-2026-13-20-overall`.
- `/races/schedule-2026-13-20-overall` shows The Puffin Run, 425 finishers, and `timataka`.
