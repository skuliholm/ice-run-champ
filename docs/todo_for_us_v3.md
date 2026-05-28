# Things For Us To Build Together

## Planning

- [x] Draft V1 planning document
- [x] Define championship vs Elo split
- [x] Decide championship standings are placing-based
- [x] Decide Elo is a separate power-ranking layer
- [x] Define Hlaupadagskrá as calendar metadata source
- [x] Define Timataka as primary results source
- [x] Define Corsa as later/manual exception source
- [ ] Finalize championship structure
- [ ] Finalize Elo structure
- [ ] Finalize race-tier system
- [ ] Finalize scoring logic

---

## Database Design

- [x] Create initial database schema
- [x] Create Supabase SQL migration
- [x] Push initial migration to Supabase
- [ ] Review schema against V1 requirements
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

## Race Calendar System

- [ ] Build Hlaupadagskrá scraper/importer
- [ ] Extract:
  - [ ] race names
  - [ ] dates
  - [ ] distances
  - [ ] categories
  - [ ] regions
  - [ ] source links
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

- [ ] Generate realistic Icelandic races
- [ ] Generate realistic athlete pool
- [ ] Generate recurring athletes
- [ ] Generate realistic finish times
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

---

## Elo System

- [ ] Build multiplayer Elo system
- [ ] Implement pairwise comparisons
- [ ] Implement field-strength adjustments
- [ ] Implement race-tier K-factors
- [ ] Optionally add time-gap adjustments
- [ ] Store Elo history

---

## Frontend

- [ ] Replace default Next.js starter page
- [ ] Create homepage
- [ ] Create championship rankings pages
- [ ] Create Elo/power ranking pages
- [ ] Create athlete pages
- [ ] Create race pages
- [ ] Create methodology page
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

- [ ] Ask Codex to review the current repo and docs
- [ ] Ask Codex to create a clean project structure plan
- [ ] Ask Codex to replace the default homepage with an IRC landing page using static placeholder data
- [ ] Commit and push first custom frontend
- [ ] Confirm Vercel redeploys automatically

---

## Future V2/V3 Ideas

- [ ] Automated imports
- [ ] Better athlete matching
- [ ] Historical seasons
- [ ] Rolling rankings
- [ ] Prediction engine
- [ ] GPX/course-fit analysis
- [ ] Win probability models
- [ ] Race simulations
