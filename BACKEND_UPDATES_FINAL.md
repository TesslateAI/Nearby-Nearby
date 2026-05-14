# BACKEND_UPDATES_FINAL.md

Phase 1 Backend + Admin Form Build Specification.
Each section maps to a numbered accordion in the admin POI form.

---

<!-- ============================================================ -->
<!-- SECTIONS 01–11                                               -->
<!-- These sections exist in the working specification document   -->
<!-- and will be added here as each section is built out.        -->
<!-- ============================================================ -->

### Phase 1 File: 01-identity.md
_[To be added]_

---

### Phase 1 File: 02-trail-in-park.md
_[To be added]_

---

### Phase 1 File: 03-categories.md
_[To be added]_

---

### Phase 1 File: 04-hours.md
_[To be added]_

---

### Phase 1 File: 05-address.md
_[To be added]_

---

### Phase 1 File: 06-parking.md
_[To be added]_

---

### Phase 1 File: 07-pricing.md
_[To be added]_

---

### Phase 1 File: 08-trail-guide.md
_[To be added]_

---

### Phase 1 File: 09-accessibility.md
_[To be added]_

---

### Phase 1 File: 10-restrooms.md
_[To be added]_

---

### Phase 1 File: 11-playground.md
_[To be added]_

---

<!-- ============================================================ -->
<!-- SECTION 12 — COMPLETE AND CURRENT (updated per issue #35)   -->
<!-- ============================================================ -->

### Phase 1 File: 12-facilities-amenities.md

#### Summary

Facilities + Amenities is the biggest single Phase 1 file. It covers a shared multi-select field used across all four POI types (Business Free, Business Paid, Park, Trail) with per-item visibility flags and several ADA inline checklists nested under specific parent items.

The frontend renders one combined Facilities + Amenities accordion section. The backend stores values in the existing `facilities_amenities` JSONB column. No migration is needed — field schema is additive.

---

#### What Exists

- `facilities_amenities` JSONB column exists on the `points_of_interest` table.
- ParkLayout and TrailLayout already render `PARK_FACILITIES` checkbox groups and `FullAmenitiesBlock` from `_shared.jsx`.
- BusinessFreeLayout and BusinessPaidLayout render an amenities block that includes a subset of these items.
- The current list is stale — it predates Coat Check, Equestrian Facilities, EV Charging, Water + Boating, and visibility flag annotations.

---

#### Step 1–7 Framework

1. **Update `AMENITIES_GENERAL` constant** in `frontend/src/utils/constants.js` with the new list (below).
2. **Add visibility flags** to each item (`'ALL'`, `'PT'`, `'B+E'`) as a metadata property.
3. **Filter by POI type** in each Layout component before rendering — Parks + Trails hide `B+E` items; Business + Events hide `PT` items.
4. **Render ADA inline checklists** as nested `Checkbox.Group` components that appear conditionally when their parent checkbox is checked.
5. **Add new sub-select fields** (Coat Check, Drinking Fountain options, Equestrian Facilities options, EV Charging options, On-Site Kitchen, Outdoor Seating options, Picnic Area options) as conditional panels.
6. **Add top-level single-select fields** (Wifi, Cell Service) using `Select` components above the multi-select groups.
7. **Preserve existing JSONB structure** — all new sub-fields serialize into the same `facilities_amenities` object; no schema migration required.

---

#### Full Facilities + Amenities List

**(ALL POIs) FACILITIES + AMENITIES** — Items are visible to all POI types by default. Exceptions are listed separately below. `*` = ADA inline checklist appears when checked.

---

##### Visibility Exceptions

**Parks + Trails only (PT) — hidden from Business and Events:**
- General → Covered Trail Shelter
- General → No Drinking Water on Trail
- General → Drinking Fountain → At Trailhead
- General → Drinking Fountain → On Trail

**Business + Events only (B+E) — hidden from Parks and Trails:**
- General → Darts
- General → Drive-Up Pickup Area
- General → Pool Tables
- General → Sports on TV
- General → Coat Check
- Family + Youth → Childcare Available
- Family + Youth → Cribs
- Family + Youth → Kid Friendly Menus
- Family + Youth → Playpens
- Dining, Seating + Gathering → Bar Seating
- Dining, Seating + Gathering → Catering Pickup Area
- Dining, Seating + Gathering → Coworking + Work Friendly Seating
- Dining, Seating + Gathering → Meeting Room
- Dining, Seating + Gathering → Outdoor Bar

---

##### Top-Level Single-Select Fields (required for all POI types)

**Wifi (single select — required)**
- Free Wifi
- Paid Wifi
- No Public Wifi

**Cell Service (single select)**
- Good
- Limited
- Unknown
- None

---

##### Multi-Select Group: General

- Amphitheater
- ATM
- Bag Check
- Bike Rack
- Bike Repair Station
- Caretaker On Site
- Coat Check *(B+E only)* → if checked, sub-select all that apply: Complimentary, Fee Based
- Coin Change Machine
- Covered Trail Shelter *(PT only)*
- Darts *(B+E only)*
- Drive-Up Pickup Area *(B+E only)*
- Drinking Fountain → if checked, sub-select all that apply:
  - At Trailhead *(PT only)*
  - On Trail *(PT only)*
  - Standard Drinking Fountain
  - Bottle Refill Station
  - Pet Water Station
  - No Drinking Water on Site
  - No Drinking Water on Trail *(PT only)*
- Dump Station for RVs
- Equestrian Facilities → if checked, sub-select all that apply:
  - Equestrian Tie-Up + Hitching Post
  - Horse Water Trough
  - Horse Trailer Parking
  - Equestrian Staging Area
- Equipment Storage
- EV Charging → if checked, sub-select all that apply: Standard Charging (Level 2), Fast Charging (DC Fast Charge / Level 3), Tesla Supercharger; plus Number of Stations (number field)
- Fire Pit
- Fire Ring
- First Aid Station
- Gated Access
- Gazebo
- Gift Shop
- Grill
- Information Kiosk + Map Board
- Laundry Facilities
- Lockers + Storage
- Lost + Found
- Multilingual Signage
- Outdoor Classroom
- Overflow Parking
- Performance Stage
- Pool Tables *(B+E only)*
- Public Spring Water Collection Point
- Recycling Stations
- Seasonal Access
- Security On Site
- Showers
- Shuttle + Trolley Service
- Sports on TV *(B+E only)*
- Stroller Check
- Vending Machines
- Weather Station
- Wildlife Observation Platform

---

##### Multi-Select Group: Family + Youth

- Booster Seat
- Changing Table
- Childcare Available *(B+E only)*
- Cribs *(B+E only)*
- Family Spaces
- High Chair
- Kids Activity Area
- Kid Friendly Menus *(B+E only)*
- Lactation Room
- Play Area — Indoor
- Play Area — Outdoor
- Playpens *(B+E only)*
- Stroller Parking
- Stroller Rental

---

##### Multi-Select Group: Water + Boating

- Beach Access
- Boat Access → if checked, sub-select all that apply with ADA inline checklists:
  - **Boat Dock** *(ADA checklist when checked)*:
    - Stationary fixed dock (no movement)
    - Floating dock (moves with water level)
    - Accessible path to dock entrance
    - Dock width 60"+ throughout
    - Non-slip surface
    - Lowered or open railing sections for fishing or water access
    - Cleats and tie-up points reachable from wheelchair height
    - Seating available
  - **Boat Launch** *(ADA checklist when checked)*:
    - Paved or firm surface path to staging area (minimum 5 feet wide)
    - 1:12 slope gangway or ramp (1 foot length for every inch of drop)
    - Continuous handrail along gangway — 36" high
    - Floating dock or stable launch platform
    - Transfer bench available — 16" high
    - Grab bars and handrails at water entry point
    - Boat slide or guide rails
    - Accessible parking within reasonable distance
    - Staging area width 60"+ for wheelchair
  - **Boat Ramp** *(ADA checklist when checked)*:
    - Non-slip surface on ramp
    - 1:12 slope — 1 foot length for every inch of drop
    - Handrails on both sides
    - Handrail height 36"
    - Level landing area at bottom of ramp
    - Accessible parking within reasonable distance
    - Firm surface alongside ramp for wheelchair access
    - Staging area width 60"+ at top and bottom of ramp
- Boat Storage
- Fuel Station for Boats
- Marina
- **Kayak, Canoe + Paddleboard Launch** *(ADA checklist when checked)*:
  - Paved or firm surface path to launch (at least 5 feet wide)
  - 1:12 slope gangway or ramp (1 foot length for every inch of drop)
  - Continuous handrail along gangway (36" high)
  - Floating dock or stable launch platform
  - Transfer bench available (16" high — standard for wheelchair transfers)
  - Grab bars and handrails at water entry point
  - Roll cage or stabilizing frame around vessel (holds kayak/canoe steady during transfer)
  - Boat slide or guide rails (allows vessel to be eased into water)
  - Accessible parking within reasonable distance
  - Staging area width 60"+ for wheelchair

---

##### Multi-Select Group: Dining, Seating + Gathering

- Bar Seating *(B+E only)*
- Benches + Rest Areas
- Catering Pickup Area *(B+E only)*
- Concession Stand
- Coworking + Work Friendly Seating *(B+E only)*
- Group Shelter
- Indoor Seating
- Meeting Room *(B+E only)*
- On-Site Kitchen Facility → if checked, sub-select all that apply: Has Power, Has Running Water
- Outdoor Bar *(B+E only)*
- Outdoor Seating → if checked, sub-select all that apply: Cooled Outdoor Seating, Covered Outdoor Seating, Heated Outdoor Seating
- Picnic Area → if checked, sub-select all that apply: Covered, Uncovered
- Private Event Space

---

#### Dev Notes

Facilities + Amenities is a single shared database field across all POI types. Every item has a visibility flag: `ALL` (shows on all POI types), `PT` (Parks + Trails only — hidden from Business and Events), or `B+E` (Business + Events only — hidden from Parks and Trails).

Backend form filters items by POI type visibility flag automatically. Parent group labels are saved as filterable values but not displayed on the frontend — only child items are shown to visitors.

ADA checklist items under Boat Dock, Boat Launch, Boat Ramp, and Kayak Canoe + Paddleboard Launch are nested sub-fields of their parent facility checkbox — they are not separate standalone facilities.

Explore search and filtering queries Things To Do, Facilities + Amenities, and all other relevant fields simultaneously so visitors find relevant results regardless of which field an item lives in.

---

<!-- ============================================================ -->
<!-- SECTIONS 13–22+ — TO BE ADDED                               -->
<!-- ============================================================ -->

### Phase 1 File: 13-pets.md
_[To be added]_

---

### Phase 1 File: 14-alcohol-smoking.md
_[To be added]_

---

### Phase 1 File: 15-outdoor-features.md
_[To be added]_

---

### Phase 1 File: 16-drone.md
_[To be added]_

---

### Phase 1 File: 17-hunting-fishing.md
_[To be added]_

---

### Phase 1 File: 18-rentals.md
_[To be added]_

---

### Phase 1 File: 19-locally-found-history.md
_[To be added]_

---

### Phase 1 File: 20-images.md
_[To be added]_

---

### Phase 1 File: 21-contact-compliance.md
_[To be added]_

---
