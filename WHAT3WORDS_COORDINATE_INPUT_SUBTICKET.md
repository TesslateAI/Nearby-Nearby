# Sub-ticket: Reusable `<CoordinateInput />` component (deferred from #41)

This file scopes the larger follow-up work split out of issue #41
("[Config] Set WHAT3WORDS_API_KEY in production + dev environments").

The env-config + 503 wording portion of #41 has shipped (see commit on
branch `barry-first-changes-ever`). The reusable component build below
is a separate, larger piece of work and is deferred so the env work
can land independently.

## Scope

Build a single, reusable React component that bundles three fields as
one coordinate-entry unit and drop it into every lat/lng location in
the admin POI form.

### Component contract

Path (proposed): `nearby-admin/frontend/src/components/CoordinateInput.jsx`

Bundles three inputs as one logical unit:
- A What3Words text input (3-dot-separated lowercase words)
- A latitude number input (6 decimal precision)
- A longitude number input (6 decimal precision)

### Behavior

- On W3W field blur (or ~800ms debounce after typing stops), call
  `POST /api/utils/what3words-to-coords`. On success, populate the lat
  and lng inputs with the returned coordinates. Show a subtle
  success/error state next to the field.
- On manual entry in either the lat OR the lng input, clear the W3W
  input (set to empty string). Both methods write to the same lat+lng
  fields; the W3W value is auxiliary metadata.
- W3W field is backend-only — never rendered on the public frontend.
- Show inline error states when the API returns 503 (mis-configured),
  400/422 (malformed input), or 502 (upstream failure).

### Props

| Prop      | Type   | Notes |
|-----------|--------|-------|
| `form`    | object | Mantine `useForm` instance |
| `latField`| string | Form key for latitude (e.g. `front_door_latitude`, `primary_parking_lat`) |
| `lngField`| string | Form key for longitude |
| `w3wField`| string | Form key for the W3W string (e.g. `what3words_address`) |
| `label`   | string | Top-level label (e.g. "Front Door Coordinates") |

### Helper text (exact wording)

> Don't know your coordinates? Use What3Words to find them. Go to
> what3words.com or download the free What3Words app, find your exact
> location, and enter the three word address here. We'll convert it to
> coordinates automatically.

## Replace these standalone components with the new bundle

In every layout that currently renders `<What3WordsInput />` followed
by separate lat/lng inputs, replace both with one `<CoordinateInput />`:

- `BusinessFreeLayout.jsx` — front door coords
- `BusinessPaidLayout.jsx` — front door coords
- `EventLayout.jsx` — front door coords
- `ParkLayout.jsx` — front door coords
- `TrailLayout.jsx` — front door coords

Then audit `LocationSection.jsx` for additional coordinate pairs:
- Primary parking lat/lng (`primary_parking_lat`, `primary_parking_lng`)
- Toilet lat/lng (`toilet_latitude`, `toilet_longitude`)

`TrailLayout.jsx` access points — each access point already has `lat`,
`lng`, and `what3words` fields; wire each row to use `<CoordinateInput />`.

## Public-frontend cleanup

Issue #41's addendum also calls out removing the public render of W3W
on `nearby-app/app/src/components/details/TrailDetail.jsx:173` (the
`{ap.what3words && <div>…</div>}` block). Audit with
`grep -r "what3words\|what_3_words\|W3W" nearby-app/app/src/` and remove
any other public-facing renders. This belongs to the same sub-ticket.

## Out of scope for this sub-ticket

- Switching the underlying backend endpoint (no change required —
  `POST /api/utils/what3words-to-coords` is already shipped).
- Database migrations (the `what3words_address` field already exists).
- Adding a separate "convert" button — auto-convert on blur replaces it.

## Tests

- Unit: simulate blur on W3W field with a mocked fetch → asserts lat
  and lng populate.
- Unit: simulate user typing in lat → asserts W3W field clears.
- Integration: render `<BusinessPaidLayout>` with the new component,
  fill W3W, blur, assert front-door lat/lng updated.
- Backend smoke: confirm the existing 503 path still triggers when
  `WHAT3WORDS_API_KEY` is unset (already covered by
  `tests/test_phase1_what3words.py::test_missing_api_key_returns_503`).

## Estimate

~1 day for the component + replacements + tests.
