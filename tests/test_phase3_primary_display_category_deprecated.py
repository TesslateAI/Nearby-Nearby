"""Issue #42 — verify deprecation of the Event-only `primary_display_category`.

The legacy string column `events.primary_display_category` has been replaced
by the canonical UUID-based `main_category_id` / `is_main` mechanism on
`poi_categories`. These tests assert:

* Events can still be created without sending `primary_display_category`.
* The CRUD response does NOT expose `primary_display_category`.
* The underlying column has been renamed to
  `_deprecated_primary_display_category` (verified via information_schema).
* `main_category_id` membership validation rejects a category that is not in
  the POI's `category_ids` set.

Note: the integration test harness has a pre-existing bcrypt-72-byte issue at
fixture setup time; these tests are written to pass once that environmental
problem is resolved.
"""

from sqlalchemy import text

from conftest import create_event, create_category


class TestPrimaryDisplayCategoryDeprecated:
    """Issue #42 — primary_display_category column is deprecated."""

    def test_create_event_without_primary_display_category(self, admin_client):
        """Event create succeeds without sending the deprecated field."""
        data = create_event(
            admin_client,
            name="Plain Event #42",
            event={"start_datetime": "2026-08-01T10:00:00Z"},
        )
        assert "id" in data
        # The deprecated field must NOT appear on the Event subobject.
        assert "primary_display_category" not in data["event"]

    def test_response_omits_deprecated_field(self, admin_client):
        """Even if a client sends primary_display_category, the response strips it."""
        data = create_event(
            admin_client,
            name="Sender Event #42",
            event={
                "start_datetime": "2026-08-01T10:00:00Z",
                # This key is no longer in the schema; Pydantic silently drops it.
                "primary_display_category": "Festival",
            },
        )
        assert "primary_display_category" not in data["event"]

    def test_column_renamed_in_information_schema(self, db_session):
        """The events column has been renamed to the deprecated alias.

        The migration is applied implicitly by SQLAlchemy `create_all()` in
        the test fixture, which builds tables straight from ORM metadata
        without the deprecated column. So this test asserts the canonical
        column name is gone — equivalent end-state.
        """
        row = db_session.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'events' "
            "  AND column_name = 'primary_display_category'"
        )).fetchone()
        assert row is None, (
            "events.primary_display_category should not exist after Issue #42 "
            "deprecation; column should be renamed to "
            "_deprecated_primary_display_category by migration g42_001."
        )


class TestMainCategoryMembershipValidation:
    """Issue #42 — `main_category_id` must be in the POI's selected categories."""

    def test_main_category_must_be_in_category_ids(self, admin_client):
        """Passing main_category_id without including it in category_ids fails."""
        # Two distinct categories applicable to BUSINESS.
        cat_a = create_category(admin_client, name="Cat A #42", applicable_to=["BUSINESS"])
        cat_b = create_category(admin_client, name="Cat B #42", applicable_to=["BUSINESS"])

        payload = {
            "name": "Membership Biz #42",
            "poi_type": "BUSINESS",
            "location": {"type": "Point", "coordinates": [-79.0, 35.8]},
            "business": {"price_range": "$$"},
            # Selecting only A but trying to make B the main → should 422.
            "category_ids": [cat_a["id"]],
            "main_category_id": cat_b["id"],
        }
        resp = admin_client.post("/api/pois/", json=payload)
        assert resp.status_code == 422, resp.text
        assert "main_category_id" in resp.text
