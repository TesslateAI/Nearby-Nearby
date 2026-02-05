#!/usr/bin/env python3
"""
Seed script for categories based on Story 3 requirements from STORIES.md and PO_REQUIREMENTS.md
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.category import Category
from app.schemas.category import generate_slug

def seed_categories():
    """
    Create categories for each POI type based on the requirements.
    """
    db = SessionLocal()

    try:
        # Clear existing categories to avoid conflicts during development
        db.query(Category).delete()
        db.commit()

        categories_data = [
            # BUSINESS MAIN CATEGORIES
            {
                "name": "Restaurant & Food",
                "applicable_to": ["BUSINESS"],
                "is_main_category": True,
                "sort_order": 1
            },
            {
                "name": "Shopping & Retail",
                "applicable_to": ["BUSINESS"],
                "is_main_category": True,
                "sort_order": 2
            },
            {
                "name": "Services",
                "applicable_to": ["BUSINESS"],
                "is_main_category": True,
                "sort_order": 3
            },
            {
                "name": "Health & Wellness",
                "applicable_to": ["BUSINESS"],
                "is_main_category": True,
                "sort_order": 4
            },
            {
                "name": "Entertainment & Arts",
                "applicable_to": ["BUSINESS"],
                "is_main_category": True,
                "sort_order": 5
            },
            {
                "name": "Professional Services",
                "applicable_to": ["BUSINESS"],
                "is_main_category": True,
                "sort_order": 6
            },

            # PARK MAIN CATEGORIES
            {
                "name": "Municipal Park",
                "applicable_to": ["PARK"],
                "is_main_category": True,
                "sort_order": 1
            },
            {
                "name": "County Park",
                "applicable_to": ["PARK"],
                "is_main_category": True,
                "sort_order": 2
            },
            {
                "name": "State Park",
                "applicable_to": ["PARK"],
                "is_main_category": True,
                "sort_order": 3
            },
            {
                "name": "National Park",
                "applicable_to": ["PARK"],
                "is_main_category": True,
                "sort_order": 4
            },
            {
                "name": "Nature Preserve",
                "applicable_to": ["PARK"],
                "is_main_category": True,
                "sort_order": 5
            },
            {
                "name": "Recreation Area",
                "applicable_to": ["PARK"],
                "is_main_category": True,
                "sort_order": 6
            },

            # TRAIL MAIN CATEGORIES (Trail Difficulty)
            {
                "name": "Easy",
                "applicable_to": ["TRAIL"],
                "is_main_category": True,
                "sort_order": 1
            },
            {
                "name": "Moderate",
                "applicable_to": ["TRAIL"],
                "is_main_category": True,
                "sort_order": 2
            },
            {
                "name": "Hard",
                "applicable_to": ["TRAIL"],
                "is_main_category": True,
                "sort_order": 3
            },
            {
                "name": "Very Difficult",
                "applicable_to": ["TRAIL"],
                "is_main_category": True,
                "sort_order": 4
            },
            {
                "name": "Extreme",
                "applicable_to": ["TRAIL"],
                "is_main_category": True,
                "sort_order": 5
            },

            # EVENT MAIN CATEGORIES
            {
                "name": "Festival",
                "applicable_to": ["EVENT"],
                "is_main_category": True,
                "sort_order": 1
            },
            {
                "name": "Market",
                "applicable_to": ["EVENT"],
                "is_main_category": True,
                "sort_order": 2
            },
            {
                "name": "Workshop & Class",
                "applicable_to": ["EVENT"],
                "is_main_category": True,
                "sort_order": 3
            },
            {
                "name": "Sports & Recreation",
                "applicable_to": ["EVENT"],
                "is_main_category": True,
                "sort_order": 4
            },
            {
                "name": "Arts & Culture",
                "applicable_to": ["EVENT"],
                "is_main_category": True,
                "sort_order": 5
            },
            {
                "name": "Community Meeting",
                "applicable_to": ["EVENT"],
                "is_main_category": True,
                "sort_order": 6
            },
            {
                "name": "Social Gathering",
                "applicable_to": ["EVENT"],
                "is_main_category": True,
                "sort_order": 7
            },
        ]

        # Create main categories first
        created_categories = {}
        for cat_data in categories_data:
            category = Category(
                name=cat_data["name"],
                slug=generate_slug(cat_data["name"]),
                applicable_to=cat_data["applicable_to"],
                is_main_category=cat_data["is_main_category"],
                is_active=True,
                sort_order=cat_data["sort_order"]
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            created_categories[cat_data["name"]] = category
            print(f"Created main category: {cat_data['name']} for {cat_data['applicable_to']}")

        # SECONDARY CATEGORIES FOR PARKS - "Things to Do (Outdoor Features)"
        park_secondary_categories = [
            "Park Playground",
            "Park Walking Trails",
            "Park Hiking Trails",
            "Park Biking Trails",
            "Sports Fields",
            "Basketball Court",
            "Tennis Court",
            "Baseball Field",
            "Soccer Field",
            "Park Swimming",
            "Park Fishing",
            "Park Boating",
            "Picnic Areas",
            "Park Pavilions",
            "Park Grills",
            "Dog Park",
            "Garden Areas",
            "Nature Center",
            "Park Amphitheater",
            "Park Camping",
            "Wildlife Viewing",
        ]

        for i, secondary_name in enumerate(park_secondary_categories):
            category = Category(
                name=secondary_name,
                slug=generate_slug(secondary_name),
                applicable_to=["PARK"],
                is_main_category=False,
                is_active=True,
                sort_order=i + 1
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            print(f"Created park secondary category: {secondary_name}")

        # SECONDARY CATEGORIES FOR TRAILS - "Things to Do"
        trail_secondary_categories = [
            "Trail Hiking",
            "Trail Walking",
            "Trail Running",
            "Trail Biking",
            "Mountain Biking",
            "Horseback Riding",
            "Nature Photography",
            "Bird Watching",
            "Wildlife Observation",
            "Geocaching",
            "Educational Tours",  # Changed to avoid duplicate with events
            "Historical Sites",   # Changed to avoid duplicate with events
        ]

        for i, secondary_name in enumerate(trail_secondary_categories):
            category = Category(
                name=secondary_name,
                slug=generate_slug(secondary_name),
                applicable_to=["TRAIL"],
                is_main_category=False,
                is_active=True,
                sort_order=i + 1
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            print(f"Created trail secondary category: {secondary_name}")

        # SECONDARY CATEGORIES FOR EVENTS
        event_secondary_categories = [
            "Family Friendly",
            "Adults Only",
            "Kids Activities",
            "Live Music",
            "Food & Drink",
            "Educational",
            "Fundraising",
            "Seasonal",
            "Holiday",
            "Outdoor",
            "Indoor",
            "Free Admission",
            "Ticketed Event",
        ]

        for i, secondary_name in enumerate(event_secondary_categories):
            category = Category(
                name=secondary_name,
                slug=generate_slug(secondary_name),
                applicable_to=["EVENT"],
                is_main_category=False,
                is_active=True,
                sort_order=i + 1
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            print(f"Created event secondary category: {secondary_name}")

        # SECONDARY CATEGORIES FOR BUSINESS
        business_secondary_categories = [
            "Takeout",
            "Dine In",
            "Delivery",
            "Drive Through",
            "Catering",
            "Locally Owned",
            "Chain/Franchise",
            "Seasonal Business",  # Changed to avoid duplicate with events
            "Appointment Only",
            "Walk-ins Welcome",
            "Online Services",
            "Mobile Services",
        ]

        for i, secondary_name in enumerate(business_secondary_categories):
            category = Category(
                name=secondary_name,
                slug=generate_slug(secondary_name),
                applicable_to=["BUSINESS"],
                is_main_category=False,
                is_active=True,
                sort_order=i + 1
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            print(f"Created business secondary category: {secondary_name}")

        print("\n✅ Successfully seeded all categories!")
        print(f"Total categories created: {db.query(Category).count()}")

    except Exception as e:
        print(f"❌ Error seeding categories: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()