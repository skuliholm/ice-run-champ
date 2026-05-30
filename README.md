# Icelandic Running Championships

Prototype for a public Icelandic running championship site. The app currently uses a generated JSON dataset for frontend pages while the Supabase import pipeline is being built and verified.

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

