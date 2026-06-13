"""Phase 1 Migration A invariants: no legacy sponsor_* listing_types; sponsor flips to paid."""
from sqlalchemy import text
from conftest import create_business


class TestSponsorMigrationInvariants:
    def test_no_legacy_sponsor_listing_types(self, admin_client, db_session):
        # admin_client ensures schema is created
        result = db_session.execute(text(
            "SELECT COUNT(*) FROM points_of_interest WHERE listing_type LIKE 'sponsor_%'"
        )).scalar()
        assert result == 0

    def test_sponsor_flips_listing_type_to_paid(self, admin_client):
        biz = create_business(
            admin_client,
            name="Sponsor Biz",
            is_sponsor=True,
            sponsor_level="state",
            listing_type="free",
        )
        assert biz["listing_type"] == "paid"
        assert biz["is_sponsor"] is True
        assert biz["sponsor_level"] == "state"

    def test_sponsor_level_persisted(self, admin_client):
        biz = create_business(
            admin_client,
            name="Sponsor Level Biz",
            is_sponsor=True,
            sponsor_level="county",
        )
        got = admin_client.get(f"/api/pois/{biz['id']}").json()
        assert got["sponsor_level"] == "county"
