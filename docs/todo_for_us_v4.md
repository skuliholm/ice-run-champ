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
- [ ] Review schema against master race document columns
- [ ] Confirm support for race rank/tier
- [ ] Confirm support for Icelandic championship flag
- [ ] Confirm support for timing provider
- [ ] Confirm support for import status
- [ ] Add/adjust indexes
- [ ] Add/adjust relationships
- [ ] Add public read policies
- [ ] Keep writes private/service-role only

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

- [ ] Add master race CSV to repo in an appropriate location
- [ ] Decide whether source file lives in:
  - [ ] `/data/master_race_calendar.csv`
  - [ ] `/imports/master_race_calendar.csv`
  - [ ] `/supabase/seed/`
- [ ] Create importer for master race CSV
- [ ] Validate required columns:
  - [ ] `date`
  - [ ] `id`
  - [ ] `run`
  - [ ] `km`
  - [ ] `type`
  - [ ] `rank`
  - [ ] `is_icelandic_championship`
  - [ ] `results`
- [ ] Normalize race type values
- [ ] Normalize rank values
- [ ] Convert championship flag to boolean
- [ ] Store race metadata in Supabase
- [ ] Preserve original CSV values where useful

---

## Race Calendar System

- [ ] Build Hlaupadagskrá scraper/importer later
- [ ] Use master race document as V1 calendar seed
- [ ] Extract/store:
  - [ ] race names
  - [ ] dates
  - [ ] distances
  - [ ] categories/types
  - [ ] rankings/tiers
  - [ ] championship flags
  - [ ] results links
- [ ] Store event metadata separately from results
- [ ] Add calendar import status tracking

---

## Results Import System

- [ ] Build Timataka importer
- [ ] Import first real race
- [ ] Normalize results
- [ ] Parse names/times/ranks/clubs
- [ ] Store raw imported rows
- [ ] Store cleaned results separately
- [ ] Preserve source URLs
- [ ] Add import batch tracking

---

## Corsa Support

- [ ] Design schema support for Corsa
- [ ] Add `timing_provider` field if not already included
- [ ] Add `import_status` field if not already included
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

- [ ] Replace default Next.js starter page
- [ ] Create homepage
- [ ] Create championship rankings pages
- [ ] Create Elo/power ranking pages
- [ ] Create athlete pages
- [ ] Create race pages
- [ ] Create methodology page
- [ ] Create race calendar page from master race document
- [ ] Add championship-race badge/display
- [ ] Add category filters
- [ ] Make tables mobile-friendly

---

## Deployment

- [x] Connect frontend to Vercel
- [x] Verify basic production deployment
- [ ] Connect frontend to Supabase
- [ ] Add final production environment variables
- [ ] Verify Supabase-backed production pages
- [ ] Add deployment workflow/checklist

---

## Immediate Next Build Step

- [ ] Ask Codex to review current repo, docs, and master race CSV
- [ ] Ask Codex to create a master race CSV importer
- [ ] Ask Codex to verify the database schema supports the master race document
- [ ] Ask Codex to add missing schema fields via migration if needed
- [ ] Ask Codex to seed Supabase with the master race document
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
