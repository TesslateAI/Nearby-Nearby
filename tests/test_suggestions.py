"""
Tests for the place suggestions endpoint.

Uses the nearby-app TestClient from conftest.
"""

import pytest


class TestSubmitSuggestion:
    def test_submit_suggestion(self, app_client):
        """POST with full data returns 201 and stored."""
        resp = app_client.post("/api/suggestions", json={
            "name": "Bob's Burgers",
            "poi_type": "BUSINESS",
            "address_or_description": "123 Main St, Pittsboro",
            "submitter_email": "bob@example.com",
        })
        assert resp.status_code == 201
        assert "thank you" in resp.json()["message"].lower()

    def test_submit_suggestion_minimal(self, app_client):
        """POST with only name works."""
        resp = app_client.post("/api/suggestions", json={"name": "Mystery Spot"})
        assert resp.status_code == 201

    def test_submit_suggestion_missing_name(self, app_client):
        """POST without name is rejected (422)."""
        resp = app_client.post("/api/suggestions", json={})
        assert resp.status_code == 422


class TestSuggestionsCount:
    def test_get_suggestions_count(self, app_client):
        """Count endpoint returns a number."""
        # Submit one first
        app_client.post("/api/suggestions", json={"name": "Count Test Place"})
        resp = app_client.get("/api/suggestions/count")
        assert resp.status_code == 200
        assert resp.json()["count"] >= 1
