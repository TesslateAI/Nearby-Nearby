"""Tests for corporate compliance field persistence.

Validates that the JSONB `compliance` field on POIs correctly:
- Defaults to null/None when not provided
- Persists data through create and update round-trips
- Handles partial updates (replacing the whole compliance object)
- Does not break the API when null in the database
"""

import pytest
from conftest import create_business


class TestComplianceNullDefault:
    """POIs created without compliance should return it as null or empty."""

    def test_compliance_null_on_create(self, admin_client):
        """Creating a POI without compliance should return compliance as null."""
        data = create_business(admin_client, name="No Compliance Biz")
        # compliance should be None when not provided
        assert data.get("compliance") is None or data.get("compliance") == {}

    def test_compliance_null_on_get(self, admin_client):
        """GET on a POI with null compliance should not error."""
        data = create_business(admin_client, name="Null Compliance GET")
        poi_id = data["id"]

        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        assert poi.get("compliance") is None or poi.get("compliance") == {}


class TestComplianceRoundTrip:
    """Compliance data should survive create -> GET and update -> GET cycles."""

    def test_compliance_set_on_create(self, admin_client):
        """Compliance provided at creation should be returned in the response."""
        compliance = {
            "comments_restricted": "yes",
            "comments_explanation": "Corporate policy",
            "pre_approval_required": "no",
            "branding_requirements": "yes",
            "branding_details": "Use official name only",
        }
        data = create_business(
            admin_client,
            name="Compliance On Create",
            compliance=compliance,
        )
        assert data["compliance"]["comments_restricted"] == "yes"
        assert data["compliance"]["branding_requirements"] == "yes"
        assert data["compliance"]["branding_details"] == "Use official name only"

    def test_compliance_persists_after_get(self, admin_client):
        """Compliance set at creation should be returned on subsequent GET."""
        compliance = {
            "pre_approval_required": True,
            "lead_time": "5 days",
        }
        data = create_business(
            admin_client,
            name="Compliance Persist GET",
            compliance=compliance,
        )
        poi_id = data["id"]

        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        assert poi["compliance"]["pre_approval_required"] is True
        assert poi["compliance"]["lead_time"] == "5 days"

    def test_compliance_set_via_update(self, admin_client):
        """Setting compliance via PUT should persist and be retrievable."""
        # Create without compliance
        data = create_business(admin_client, name="Compliance Via Update")
        poi_id = data["id"]
        assert data.get("compliance") is None or data.get("compliance") == {}

        # Update with compliance
        compliance = {
            "comments_restricted": "yes",
            "comments_explanation": "Corporate policy",
            "pre_approval_required": "no",
            "branding_requirements": "yes",
            "branding_details": "Use official name only",
        }
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"compliance": compliance})
        assert resp.status_code == 200

        # Reload and verify
        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        assert poi["compliance"]["comments_restricted"] == "yes"
        assert poi["compliance"]["branding_requirements"] == "yes"
        assert poi["compliance"]["branding_details"] == "Use official name only"
        assert poi["compliance"]["pre_approval_required"] == "no"


class TestComplianceUpdate:
    """Compliance updates should fully replace the previous value (JSONB semantics)."""

    def test_compliance_full_replace_on_update(self, admin_client):
        """PUT with a new compliance object replaces the entire old one."""
        initial_compliance = {
            "comments_restricted": "yes",
            "pre_approval_required": "no",
        }
        data = create_business(
            admin_client,
            name="Compliance Full Replace",
            compliance=initial_compliance,
        )
        poi_id = data["id"]

        # Replace with different values
        new_compliance = {
            "comments_restricted": "no",
            "pre_approval_required": "yes",
        }
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"compliance": new_compliance})
        assert resp.status_code == 200

        # Verify the new values
        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        assert poi["compliance"]["comments_restricted"] == "no"
        assert poi["compliance"]["pre_approval_required"] == "yes"

    def test_compliance_update_does_not_affect_other_fields(self, admin_client):
        """Updating compliance should not affect other POI fields."""
        data = create_business(
            admin_client,
            name="Compliance No Side Effects",
            phone_number="919-555-1234",
        )
        poi_id = data["id"]
        assert data["phone_number"] == "919-555-1234"

        # Update only compliance
        resp = admin_client.put(
            f"/api/pois/{poi_id}",
            json={"compliance": {"lead_time": "3 days"}},
        )
        assert resp.status_code == 200

        # Verify phone number is unchanged
        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        assert poi["phone_number"] == "919-555-1234"
        assert poi["compliance"]["lead_time"] == "3 days"

    def test_compliance_can_be_cleared_to_null(self, admin_client):
        """Setting compliance to None/null should clear it."""
        data = create_business(
            admin_client,
            name="Compliance Clear",
            compliance={"pre_approval_required": True},
        )
        poi_id = data["id"]
        assert data["compliance"] is not None

        # Clear compliance by setting it to None
        resp = admin_client.put(f"/api/pois/{poi_id}", json={"compliance": None})
        assert resp.status_code == 200

        # Verify it's cleared
        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        assert poi.get("compliance") is None or poi.get("compliance") == {}


class TestComplianceComplexValues:
    """Compliance field should handle various value types within JSONB."""

    def test_compliance_with_boolean_values(self, admin_client):
        """Compliance can store boolean values."""
        compliance = {
            "pre_approval_required": True,
            "comments_restricted": False,
        }
        data = create_business(
            admin_client,
            name="Compliance Booleans",
            compliance=compliance,
        )
        assert data["compliance"]["pre_approval_required"] is True
        assert data["compliance"]["comments_restricted"] is False

    def test_compliance_with_nested_objects(self, admin_client):
        """Compliance can store nested dicts as JSONB."""
        compliance = {
            "approval_chain": {
                "first": "marketing@corp.com",
                "second": "legal@corp.com",
            },
            "lead_time": "5 business days",
        }
        data = create_business(
            admin_client,
            name="Compliance Nested",
            compliance=compliance,
        )
        poi_id = data["id"]

        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        assert poi["compliance"]["approval_chain"]["first"] == "marketing@corp.com"
        assert poi["compliance"]["approval_chain"]["second"] == "legal@corp.com"

    def test_compliance_with_mixed_string_values(self, admin_client):
        """Compliance can store string values alongside other types."""
        compliance = {
            "comments_restricted": "yes",
            "comments_explanation": "Corporate policy requires pre-approval",
            "pre_approval_required": "no",
            "branding_requirements": "yes",
            "branding_details": "Must use registered trademark symbol",
        }
        data = create_business(
            admin_client,
            name="Compliance Strings",
            compliance=compliance,
        )
        poi_id = data["id"]

        # Round-trip check
        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        poi = resp.json()
        for key, value in compliance.items():
            assert poi["compliance"][key] == value, (
                f"compliance[{key!r}] mismatch: expected {value!r}, got {poi['compliance'].get(key)!r}"
            )
