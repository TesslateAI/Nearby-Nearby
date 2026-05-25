# Nearby-Nearby — Issue Overview & Build Order

All 39 open issues (#25–#64) plus 5 newly-filed prerequisites (#67–#71), as one-liners with the *why*.
Each issue has an `✅ AUTHORITATIVE RECOMMENDED FIX` comment on GitHub — that comment is the source of truth.
Listed in recommended implementation order (waves). Check each box as you finish.

---

## Step 0 — Unblock today (mostly not coding)

- [x] **#35 — Locate and commit `BACKEND_UPDATES_FINAL.md`, update Section 12** — _cherry-picked `722f9a7` onto this branch (Wave 3+4 finishing push 2026-05-25). Section 12 is the source of truth for #55._
  _Why:_ It is the spec #55 builds against. The May 14 commit on the other branch adds the file with Section 12 fully updated (visibility flags ALL/PT/B+E, ADA inline checklists, sub-select fields). Sections 1-11 and 13+ are stubs.
- [ ] **BLOCKED #36 — Awaiting product decision** — see Wave 5 entry below; pending separate chat about scope (drop only `expect_to_pay_parking` vs. all 5).
  _Why:_ Verification shows 4 of the 5 still feed the live search engine + embeddings. Only `expect_to_pay_parking` is truly dead — the rest is a feature change, not a cleanup.
- [x] **#45 — Sign-off received; PR2 column drop shipped in Wave 5** (commits `ffb0632` + `2ae9673`).
  _Why:_ The column still powers search, 4 detail pages, cards, and SEO. Removing the UI dropdowns is safe; dropping the column is not.
- [x] **#50 — CLOSED on GitHub** (2026-05-25, duplicate of #57)
  _Why:_ The Hours `<TimeInput>` is a native control whose 12/24-hour mode is set by the browser/OS locale — it cannot be forced in code, so this ticket's scope is invalid.
- [x] **#71 — CLOSED on GitHub** (2026-05-25, folded into #51)
  _Why:_ Filed as a safety net; #51's authoritative scope now covers rendering the Tier field first.

---

## Wave 1 — User-facing bug fixes (no dependencies, ship first)

- [x] **#25 — Fix dawn/dusk hours so parks/trails stop showing "Closed"**
  _Why:_ The open-check only handles fixed times; in production *every* dawn-to-dusk park and trail is wrongly displayed as closed. Highest user impact.
- [x] **#27 — Swap the distance-sort origin to correct Pittsboro coordinates**
  _Why:_ A wrong hardcoded origin makes result #3 sometimes appear closer than #1; distances and radius filtering are visibly incorrect.
- [x] **#30 — Render the 7 EventDetail rich-text fields as HTML**
  _Why:_ Raw `<p>` tags display as literal text on every event page; Park/Trail pages already render correctly.
- [x] **#26 — Capture the form node before `await` so Subscribe stops showing a false error**
  _Why:_ The email saves fine, but a null `e.currentTarget` throws after the await, so users see a scary "Network error" and may resubmit.
- [x] **#29 — Make the verified-badge tooltip say "This event" on event pages**
  _Why:_ The tooltip text is hardcoded "This place", which reads wrong on Event detail pages.
- [x] **#61 — Reveal `fishing_types` only on the two "Yes" options, not "Other"**
  _Why:_ The checkbox group wrongly appears for "Other", letting editors enter irrelevant fishing data.
- [x] **#28 — Dismiss the search dropdown when the overlay closes**
  _Why:_ A ghost dropdown floats on top of the Explore page after a search, blocking content.
- [x] **#62 — Call `invalidateSize` so the admin LocationMap renders fully**
  _Why:_ Leaflet computes 0 dimensions when mounted inside a collapsed accordion, so only the top-left map tile shows.
- [x] **#31 — Disable map scroll-zoom until the map is clicked**
  _Why:_ Scrolling the page accidentally zooms or pans the map — a constant annoyance.
- [x] **#32 — Port the working Nearby marker↔card highlight to the Explore page** *(do after #31 — same files)*
  _Why:_ Clicking a map marker on Explore does nothing; users can't connect markers to result cards.
- [x] **#38 — Make detail-page Directions buttons open the Google/Apple/Waze modal**
  _Why:_ They currently jump straight to Google Maps, ignoring users who prefer Apple Maps or Waze.
- [x] **#39 — Add a counts endpoint so the Pet Friendly / Wheelchair cards show "X Listings"**
  _Why:_ Every other homepage category card shows a count; these two look broken without one.
- [x] **#37 — Replace bare "● Closed" with a contextual hours status + expandable weekly hours** *(do after #25 — hard block)*
  _Why:_ A flat "Closed" is uninformative; users want "Opens 9am" / "Closes at sunset" across all detail pages and cards.

---

## Wave 2 — Admin cleanups that unblock the reorgs (low risk)

- [x] **#56 — Delete the duplicate 6-option `AlcoholAvailableSelect` from 4 layouts, keep the Yes/No gate**
  _Why:_ Two alcohol controls exist; the redundant one must go before #55 restructures the section.
- [x] **#58 — Remove the stray duplicate `VenueSelector` render in EventLayout**
  _Why:_ The venue selector renders twice; `EventVenueSection` is the canonical wrapper.
- [x] **#44 — Update the 2 parking option labels**
  _Why:_ Label wording is out of date. (The dropdown removal moved to #45 to avoid an overlapping edit.)
- [x] **#45 (PR1) — Remove the 3 legacy `mobility_access` dropdowns from the form**
  _Why:_ The dropdowns are superseded UI; safe to remove now. The underlying column drop is deferred to Wave 5.
- [x] **#33 (Migration A) — Rename `public_transit_info` to `_deprecated_*` and strip code references**
  _Why:_ Unused field with no UI or consumer; a two-phase migration makes the removal reversible.
- [x] **#34 (Migration A) — Rename `key_facilities` to `_deprecated_*` and strip code references**
  _Why:_ Superseded by 4 auto-computed icon booleans; keeping it risks stale/conflicting data.

---

## Wave 3 — Field & section rebuilds (the bulk of the work)

### Reorg-blockers — do these first
- [x] **#67 — Build a reusable add/remove-row component for repeatable JSONB location arrays**
  _Why:_ Multiple reorg sections need repeatable parking/toilet/playground location rows; no such component exists yet. Blocks all 5 reorgs.
- [x] **#68 — Feed the Trail `outdoor_types` multi-select from the live Park categories API**
  _Why:_ The source constant is empty, so the Trail control currently renders zero options.
- [x] **#70 — Consolidate `holiday_hours` column vs `hours.holidays` JSONB into one store**
  _Why:_ Holiday hours live in two places, risking divergence; the reorgs need a single canonical source.

### Independent rebuilds — parallelizable, any order
- [x] **#48 — Replace the 38-item Pet Policy list with the 43-item current spec**
  _Why:_ The list is stale vs the approved spec; service-animal alert wording also needs updating.
- [x] **#51 — Replace sponsor tiers with Tier 1-5, make required, render Tier first**
  _Why:_ The old Platinum/Gold/etc names don't match the new sponsorship model; tier should lead each sponsor card.
- [x] **#57 — Force 12-hour AM/PM on the 7 Event start/end `DateTimePicker` instances**
  _Why:_ The 24-hour widget confuses editors; this is the correctly-scoped replacement for #50.
- [x] **#41 — Set `WHAT3WORDS_API_KEY` in dev + prod, then file the split-out `<CoordinateInput>` component ticket**
  _Why:_ The W3W coordinate-lookup endpoint is dead without the key; the reusable component is separate, larger scope.
- [x] **#42 — Deprecate the legacy Event-only `primary_display_category` string column**
  _Why:_ Verification shows the UUID category picker already works for all POI types; only the old string column needs cleanup.
- [x] **#43 — Collapse the 3 competing Ideal-For UIs into one and add Special Needs**
  _Why:_ Three Ideal-For widgets render simultaneously, confusing editors and producing duplicate data.
- [x] **#46 — Add a "Seasonal Hours Only" toggle and move quick-set buttons to the top**
  _Why:_ Seasonal businesses can't currently express "no regular hours"; affects both the admin form and public display.
- [x] **#47 — Update restroom options, fix the ADA checklist trigger, tighten `accessible_restroom` logic**
  _Why:_ Current restroom data is loose and the inline ADA checklist doesn't reveal correctly.
- [x] **#49 — Add a Playground Age Group field, update Type/Surface lists, group the ADA checklist into 4 categories**
  _Why:_ Playground data is incomplete vs spec; age group is a frequently-requested filter. (Storage column already exists.)
- [x] **#54 — Add the missing appointment-booking-URL admin input and wire the "By Appointment Only" toggle**
  _Why:_ The field can be rendered but has no admin input, so it can never actually be filled in.

### Chained rebuilds — strict order
- [x] **#55 — Rebuild Facilities + Amenities with POI-type visibility and inline sub-options** *(needs #35 + #56 done)*
  _Why:_ The current amenities UI writes form fields that aren't in the schema, so that data is silently dropped on every save — a real data-loss bug.
- [x] **#69 — Build a dedicated Alcohol accordion with conditional sub-options** *(after #55)*
  _Why:_ #55 moves alcohol controls out of Amenities; they need a proper home with the full conditional logic.
- [x] **#63 — Build the consolidated Trail Trailhead + Access Points structure** *(needs `<CoordinateInput>` + an `ImageType.access_point` enum migration)*
  _Why:_ Trail entry/exit data is fragmented across legacy fields; it needs one coherent structure with names, photos, notes, and W3W coordinates.

---

## Wave 4 — Accordion reorganizations (strict sequence, do last)

Re-grep every section slug against current code first — these ticket bodies are weeks stale.

- [x] **#52 — Reorder the Business Free accordion to the 13-section spec**
  _Why:_ Section order doesn't match the approved form spec. Ships first because Business Free is smallest — it validates the reorg pattern.
- [x] **#53 — Reorder the Business Paid + Community Comped accordion to the 18-section spec**
  _Why:_ Same spec-alignment goal for paid business listings.
- [x] **#59 — Reorder the Event accordion to the 20-section spec**
  _Why:_ Spec-alignment for event listings.
- [x] **#60 — Reorder the Park accordion to the 22-section spec + extract Drone Policy**
  _Why:_ Spec-alignment for park listings.
- [x] **#64 — Reorder the Trail accordion to the 22-section spec + Drone Policy section**
  _Why:_ Spec-alignment for trail listings. Shipped last because it depends on every other rebuild.

---

## Wave 5 — Deferred destructive column drops (after soak + sign-off)

Irreversible — done deliberately, last, never bundled into a UI PR.

- [x] **#33 / #34 (Migration B) — Dropped the renamed `_deprecated_*` columns** (commit `91eecde`, migrations `w33b_001` + `w34b_001`).
  _Why:_ The two-phase split lets the rename settle in production before the irreversible drop.
- [ ] **#36 — Awaiting product decision** — separate chat scheduled with @manav before scoping.
  _Why:_ 4 of the 5 columns feed live search; they can only go after the search engine stops reading them.
- [x] **#45 (PR2) — Dropped the `wheelchair_accessible` column** (commits `ffb0632` + `2ae9673`, migrations `w45a_001` + `w45b_001`).
  _Why:_ The column powers search/SEO/detail pages; its removal must be a deliberate, approved change.
- [x] **#63 (Migration B + C) — Migrated `trail_exit_*` into `access_points[]` and dropped legacy columns** (commits `5451ce9` + `0120de0` + `277de2e` linearization, migrations `w63b_001` + `w63c_001`).
  _Why:_ Trail data must be safely migrated into the new structure before the old fields are removed.

**Alembic chain head**: `w63c_001` — final order `i69_001 → w33b_001 → w34b_001 → w45a_001 → w45b_001 → w63b_001 → w63c_001`.

**Reviewers**: R4 (#45 PR2), R5 (#63 B+C), R6 (#33-B + #34-B) — all PASS via clean-context multi-agents 2026-05-25.
