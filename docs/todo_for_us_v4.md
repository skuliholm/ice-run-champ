# Things For Us To Build Together

## Planning

- [x] Draft V1 planning document
- [x] Define championship vs Elo split
- [x] Decide championship standings are placing-based
- [x] Decide Elo is a separate power-ranking layer
- [x] Define Hlaupadagskrá as calendar metadata source
- [x] Define Timataka as primary results source
- [x] Define Corsa as later/manual exception source
- [x] Create initial master race document
- [x] Add Icelandic championship flag to master race document
- [x] Adjust race tier balance to be somewhat road-heavy
- [ ] Finalize championship structure
- [ ] Finalize Elo structure
- [ ] Finalize race-tier system
- [ ] Finalize scoring logic
- [ ] Decide treatment of cross-country races later

---

## Database Design

- [x] Create initial database schema
- [x] Create Supabase SQL migration
- [x] Push initial migration to Supabase
- [x] Review schema against master race document columns
- [x] Confirm support for race rank/tier
- [x] Confirm support for Icelandic championship flag
- [x] Confirm support for timing provider
- [x] Confirm support for import status
- [x] Add/adjust indexes
- [x] Add/adjust relationships
- [x] Add public read policies
- [x] Keep writes private/service-role only
- [x] Add durable athlete alias identity fields
- [x] Push latest schema migrations to hosted Supabase

Initial tables:
- [x] athletes
- [x] athlete_aliases
- [x] clubs
- [x] events
- [x] races
- [x] raw_results / results equivalent
- [x] cleaned_results / results equivalent
- [x] championship_scores / race_scores equivalent
- [x] elo_ratings

---

## Master Race Document Import

- [x] Add master race CSV to repo as `schedule_results.csv`
- [x] Create importer for master race CSV
- [x] Validate required columns:
  - [x] `date`
  - [x] `id`
  - [x] `run`
  - [x] `km`
  - [x] `type`
  - [x] `rank`
  - [x] `is_icelandic_championship`
  - [x] `results`
- [x] Normalize race type values enough for V1 storage
- [x] Normalize rank values enough for V1 storage
- [x] Convert championship flag to boolean
- [x] Store race metadata in Supabase
- [x] Preserve original CSV values where useful
- [ ] Decide long-term source file location/name

---

## Race Calendar System

- [ ] Build Hlaupadagskrá scraper/importer later
- [x] Use master race document as V1 calendar seed
- [x] Extract/store:
  - [x] race names
  - [x] dates
  - [x] distances
  - [x] categories/types
  - [x] rankings/tiers
  - [x] championship flags
  - [x] results links
- [x] Store event metadata separately from results
- [x] Add calendar import status tracking
- [x] Import calendar into hosted Supabase

---

## Results Import System

- [x] Build Timataka importer
- [x] Import first real race locally
- [x] Normalize results
- [x] Parse names/times/ranks/clubs
- [x] Store raw imported rows
- [x] Store cleaned results separately
- [x] Preserve source URLs
- [x] Add import batch tracking
- [x] Add explicit local/hosted import target guards
- [x] Import first real race into hosted Supabase
- [ ] Add broader multi-race import loop
- [ ] Add better athlete matching/review workflow

---

## Corsa Support

- [ ] Design schema support for Corsa
- [x] Add `timing_provider` field if not already included
- [x] Add `import_status` field if not already included
- [ ] Postpone full Corsa importer until later

---

## Mock Data Generation

- [ ] Generate realistic athlete pool
- [ ] Generate realistic results for races in the master race document
- [ ] Generate recurring athletes across races
- [ ] Generate realistic finish times by distance/type
- [ ] Create enough data for meaningful rankings
- [ ] Clearly mark mock data as mock/test data

---

## Championship System

- [ ] Implement placing-based scoring
- [ ] Implement race-tier weighting
- [ ] Implement best-X-results logic
- [ ] Implement eligibility requirements
- [ ] Implement club scoring
- [ ] Add age groups later
- [ ] Treat official Icelandic championship flag as separate from race tier
- [ ] Decide if championship-flagged races receive any special display/badge

---

## Elo System

- [ ] Build multiplayer Elo system
- [ ] Implement pairwise comparisons
- [ ] Implement field-strength through opponent ratings
- [ ] Implement race-tier K-factors if needed
- [ ] Optionally add time-gap adjustments
- [ ] Store Elo history
- [ ] Keep Elo separate from championship standings

---

## Frontend

- [x] Replace default Next.js starter page
- [x] Create homepage
- [ ] Create championship rankings pages
- [ ] Create Elo/power ranking pages
- [ ] Create athlete pages
- [x] Create race pages
- [x] Create methodology page
- [x] Create race calendar page from master race document
- [x] Add championship-race badge/display
- [ ] Add category filters
- [ ] Make tables mobile-friendly

---

## Deployment

- [x] Connect frontend to Vercel
- [x] Verify basic production deployment
- [x] Connect frontend to Supabase
- [ ] Add final production environment variables
- [ ] Verify Supabase-backed production pages
- [x] Add deployment workflow/checklist

---

## Immediate Next Build Step

- [x] Ask Codex to review current repo, docs, and master race CSV
- [x] Ask Codex to create a master race CSV importer
- [x] Ask Codex to verify the database schema supports the master race document
- [x] Ask Codex to add missing schema fields via migration if needed
- [x] Ask Codex to seed local Supabase with the master race document
- [x] Push schema migrations to hosted Supabase
- [x] Seed hosted Supabase with the master race document
- [x] Import Puffin Run into hosted Supabase
- [ ] Commit and push the importer + schema changes
- [ ] Confirm Vercel redeploys automatically after frontend changes

---

## Future V2/V3 Ideas

- [ ] Automated Hlaupadagskrá imports
- [ ] Better athlete matching
- [ ] Historical seasons
- [ ] Rolling rankings
- [ ] Prediction engine
- [ ] GPX/course-fit analysis
- [ ] Win probability models
- [ ] Race simulations
