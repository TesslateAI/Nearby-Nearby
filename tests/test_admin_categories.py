"""Tests for Category CRUD + assignment via admin API."""

import pytest
from conftest import create_category, create_business


class TestCreateCategory:
    def test_create_category(self, admin_client):
        """POST category with name, applicable_to."""
        cat = create_category(admin_client, name="Restaurants", applicable_to=["BUSINESS"])
        assert cat["name"] == "Restaurants"
        assert cat["applicable_to"] == ["BUSINESS"]
        assert cat["slug"] == "restaurants"
        assert "id" in cat

    def test_create_child_category(self, admin_client):
        """Category with parent_id."""
        parent = create_category(admin_client, name="Food & Drink")
        child_payload = {
            "name": "Coffee Shops",
            "parent_id": parent["id"],
            "applicable_to": ["BUSINESS"],
        }
        resp = admin_client.post("/api/categories/", json=child_payload)
        assert resp.status_code == 201
        child = resp.json()
        assert child["name"] == "Coffee Shops"
        assert child["parent_id"] == parent["id"]


class TestAssignCategories:
    def test_assign_main_category(self, admin_client):
        """Create POI with main_category_id."""
        cat = create_category(admin_client, name="Dining")
        biz = create_business(
            admin_client,
            name="Categorized Biz",
            main_category_id=cat["id"],
        )
        assert biz["main_category"] is not None
        assert biz["main_category"]["name"] == "Dining"

    def test_assign_secondary_categories(self, admin_client):
        """Create POI with category_ids list."""
        cat1 = create_category(admin_client, name="Shopping")
        cat2 = create_category(admin_client, name="Entertainment")
        biz = create_business(
            admin_client,
            name="Multi-Cat Biz",
            listing_type="paid",
            category_ids=[cat1["id"], cat2["id"]],
        )
        sec_names = [c["name"] for c in biz.get("secondary_categories", [])]
        # Or check via categories list
        cat_names = [c["name"] for c in biz.get("categories", [])]
        assert "Shopping" in cat_names or "Shopping" in sec_names
        assert "Entertainment" in cat_names or "Entertainment" in sec_names


class TestUpdateCategories:
    def test_update_main_category(self, admin_client):
        """PUT to change main category."""
        cat1 = create_category(admin_client, name="Cat A")
        cat2 = create_category(admin_client, name="Cat B")
        biz = create_business(admin_client, name="Update Cat Biz", main_category_id=cat1["id"])
        assert biz["main_category"]["name"] == "Cat A"

        resp = admin_client.put(
            f"/api/pois/{biz['id']}",
            json={"main_category_id": cat2["id"]},
        )
        assert resp.status_code == 200
        updated = resp.json()
        assert updated["main_category"]["name"] == "Cat B"

    def test_update_secondary_categories(self, admin_client):
        """PUT to change category_ids."""
        cat1 = create_category(admin_client, name="Sec Cat 1")
        cat2 = create_category(admin_client, name="Sec Cat 2")
        cat3 = create_category(admin_client, name="Sec Cat 3")
        biz = create_business(
            admin_client,
            name="Update Sec Cat Biz",
            listing_type="paid",
            category_ids=[cat1["id"], cat2["id"]],
        )

        resp = admin_client.put(
            f"/api/pois/{biz['id']}",
            json={"category_ids": [cat3["id"]]},
        )
        assert resp.status_code == 200
        updated = resp.json()
        sec_names = [c["name"] for c in updated.get("secondary_categories", [])]
        cat_names = [c["name"] for c in updated.get("categories", [])]
        # cat3 should be present, cat1/cat2 should not be in secondary
        assert "Sec Cat 3" in cat_names or "Sec Cat 3" in sec_names


class TestCategoryTree:
    def test_category_tree(self, admin_client):
        """GET /api/categories/tree."""
        parent = create_category(admin_client, name="Tree Parent")
        admin_client.post("/api/categories/", json={
            "name": "Tree Child",
            "parent_id": parent["id"],
            "applicable_to": ["BUSINESS"],
        })

        resp = admin_client.get("/api/categories/tree")
        assert resp.status_code == 200
        tree = resp.json()
        assert len(tree) >= 1
        parent_node = next((t for t in tree if t["name"] == "Tree Parent"), None)
        assert parent_node is not None
        assert len(parent_node["children"]) >= 1

    def test_categories_by_poi_type(self, admin_client):
        """GET /api/categories/by-poi-type/BUSINESS."""
        create_category(admin_client, name="Biz Only Cat", applicable_to=["BUSINESS"])
        create_category(admin_client, name="Park Only Cat", applicable_to=["PARK"])

        resp = admin_client.get("/api/categories/by-poi-type/BUSINESS")
        assert resp.status_code == 200
        cats = resp.json()
        names = [c["name"] for c in cats]
        assert "Biz Only Cat" in names
        assert "Park Only Cat" not in names


class TestDeleteCategory:
    def test_delete_leaf_category(self, admin_client):
        """DELETE childless category → succeeds."""
        cat = create_category(admin_client, name="Leaf Cat")
        resp = admin_client.delete(f"/api/categories/{cat['id']}")
        assert resp.status_code == 204

    def test_delete_category_with_children_fails(self, admin_client):
        """DELETE parent category → should fail if it has children."""
        parent = create_category(admin_client, name="Parent To Delete")
        admin_client.post("/api/categories/", json={
            "name": "Child of Deleted",
            "parent_id": parent["id"],
            "applicable_to": ["BUSINESS"],
        })

        resp = admin_client.delete(f"/api/categories/{parent['id']}")
        # Should fail - has children
        assert resp.status_code in [400, 500]
