#!/usr/bin/env python3
"""
Seed script for The Rustic Spoon business listings (one paid, one free).
Based on mockup images provided by user.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.poi import PointOfInterest, Business, POIType
from app.models.category import Category, poi_category_association


def seed_rustic_spoon():
    """
    Create two business listings for The Rustic Spoon:
    1. Paid listing with comprehensive data
    2. Free listing with simplified data
    """
    db = SessionLocal()

    try:
        # Check if listings already exist and delete them
        existing = db.query(PointOfInterest).filter(
            PointOfInterest.name == "The Rustic Spoon"
        ).all()

        for poi in existing:
            db.delete(poi)
        db.commit()
        print("Cleared existing Rustic Spoon listings")

        # Get the Restaurant & Food main category for business
        restaurant_category = db.query(Category).filter(
            Category.name == "Restaurant & Food"
        ).first()

        # ============================================
        # LISTING 1: PAID LISTING (Comprehensive)
        # ============================================
        paid_poi = PointOfInterest(
            poi_type=POIType.BUSINESS,
            name="The Rustic Spoon",
            listing_type="paid",
            publication_status="published",
            is_verified=True,
            status="Fully Open",
            status_message="Fresh Baked Bread Today!",

            # Address
            address_street="123 Main Street",
            address_city="Pittsboro",
            address_state="NC",
            address_zip="09845",
            address_county="Chatham County",
            address_full="123 Main Street, Pittsboro, NC 09845",

            # Location (PostGIS format)
            location="POINT(-79.1772 35.7210)",

            # Descriptions
            description_long="The Rustic Spoon is a charming eatery known for its cozy atmosphere and delicious farm-to-table dishes. Nestled in the heart of the city, it offers a menu that celebrates local ingredients and seasonal flavors. Guests can enjoy a variety of mouthwatering options, from hearty brunches to exquisite dinners, all crafted with care. Whether you're stopping by for a quick bite or a leisurely meal, The Rustic Spoon promises a delightful dining experience.",
            description_short="Charming eatery with cozy atmosphere and farm-to-table dishes celebrating local ingredients.",
            teaser_paragraph="Best Hot Dogs in Town! Voted top 10 in state.",

            # Contact
            website_url="https://therusticspoon.com",
            phone_number="(555) 123-4567",

            # Social media
            instagram_username="therusticspoon",
            facebook_username="therusticspoon",
            x_username="therusticspoon",

            # Hours
            hours={
                "monday": {"closed": True},
                "tuesday": [{"open": "09:00", "close": "12:00"}, {"open": "16:00", "close": "21:00"}],
                "wednesday": [{"open": "09:00", "close": "21:00"}],
                "thursday": [{"open": "09:00", "close": "12:00"}, {"open": "16:00", "close": "21:00"}],
                "friday": [{"open": "09:00", "close": "21:00"}],
                "saturday": [{"open": "09:00", "close": "21:00"}],
                "sunday": [{"open": "09:00", "close": "21:00"}]
            },

            holiday_hours={
                "labor_day": "Closed",
                "new_years_day": "5pm-8pm",
                "mlk_day": "5pm-8pm",
                "presidents_day": "Closed"
            },

            # Pricing
            price_range_per_person="$100+",
            payment_methods=["Cash", "Credit Card", "ATM"],
            discounts=["Golden Years (55+)", "Military & Veterans", "First Responder", "Academic"],
            gift_cards="yes_this_only",

            # Ideal For
            ideal_for=["All Ages", "Families", "For the Kids", "Pet Friendly", "Ages 18+", "Ages 21+", "Golden Years Ages 55+"],

            # Business amenities
            business_amenities=["Public Restroom", "Parking Facilities", "Wi-Fi Access", "Playgrounds", "Bicycle Rentals", "Water Fountains", "Dog Parks", "Picnic Areas"],

            # Parking
            parking_types=["Public Parking Lot", "Private Parking Lot", "Street Parking", "Oversized Vehicles", "RV Parking"],
            expect_to_pay_parking="yes",
            parking_notes="We have limited street parking and the closest parking garage to us is at the courthouse after 5pm.",
            business_entry_notes="Inside the building. Take the first staircase on your right. We're the second door on the right.",

            # Menu & Ordering
            menu_link="https://therusticspoon.com/menu",
            reservation_links=[{"title": "Reserve a Table", "url": "https://therusticspoon.com/reservations"}],
            delivery_links=[{"title": "DoorDash", "url": "https://doordash.com"}, {"title": "UberEats", "url": "https://ubereats.com"}],
            online_ordering_links=[{"title": "Order Online", "url": "https://therusticspoon.com/order"}],

            # Alcohol & Smoking
            alcohol_options=["BYOB", "Brewery", "Mixed Drinks", "Good For Happy Hour"],
            smoking_options=["Indoor Lounge/Sitting Area"],
            smoking_details="Many businesses, including shops, cafes, and restaurants, have specific policies regarding pets to ensure a safe and enjoyable environment for all customers.",

            # Public toilets
            public_toilets=["Baby Changing Station", "Wheelchair Accessible"],
            toilet_description="Blah, Blah blah for the bathrooms! This is for patrons of the store only!",

            # Wheelchair accessibility
            wheelchair_accessible=["Accessible Bathrooms", "First Floor Seating"],
            wheelchair_details="We have accessible Bathrooms, accessible entry is on the right of the building and we have seating on the first floor.",

            # Pet policy
            pet_options=["Well Behaved Pet", "Dog Friendly", "Clean Up Stations", "Fenced In Area", "Kennels for Rent"],
            pet_policy="Many businesses, including shops, cafes, and restaurants, have specific policies regarding pets to ensure a safe and enjoyable environment for all customers. For more detailed information about our pet policy, including specific guidelines and locations, click here.",

            # Playground
            playground_available=True,
            playground_types=["Toddler (0-25 months)", "Natural Playground", "Inclusive (ADA Accessible)", "Art & Play Sculptures"],
            playground_surface_types=["Sand", "Dirt/Natural", "Grass"],
            playground_notes="Let's talk about parks and where to find the park. It's a cool cool place to be. The Park of you and me!!",

            # Rentals
            available_for_rent=True,
            rental_info="No smoking is permitted inside the building. Guests are responsible for any damages incurred during their stay. All guests must adhere to quiet hours from 10 PM to 7 AM. Pets are not allowed on the premises. Security deposit is required prior to check-in. Please dispose of trash in designated bins.",
            rental_link="https://therusticspoon.com/rentals",

            # History & Community
            history_paragraph="The Rustic Spoon is a beloved eatery that began as a small food truck in 2010, serving homemade comfort food with a twist. Over the years, it gained popularity for its farm-to-table approach and unique flavor combinations. In 2015, it transitioned into a cozy restaurant, where locals and visitors alike enjoy dishes made from fresh, seasonal ingredients. The Rustic Spoon has become a community staple, known for its warm atmosphere and commitment to sustainability.",
            community_impact="We proudly support the local little league team Little Miffits, Gold Sponsor for the YMCA and every year we donate 100 turkeys to the Pittsboro Rotary to feed 100 families at thanksgiving.",
            article_links=[
                {"title": "Title of the articles -- Chatham record", "url": "#"},
                {"title": "Title of the articles -- Chatham record", "url": "#"},
                {"title": "Title of the articles -- Chatham record", "url": "#"},
                {"title": "Title of the articles -- Chatham record", "url": "#"},
                {"title": "Title of the articles -- Chatham record", "url": "#"},
                {"title": "Title of the articles -- Chatham record", "url": "#"}
            ],
        )

        # Create Business subtype for paid listing
        paid_poi.business = Business(price_range="$$")

        db.add(paid_poi)
        db.flush()

        # Add main category if it exists
        if restaurant_category:
            db.execute(poi_category_association.insert().values(
                poi_id=paid_poi.id,
                category_id=restaurant_category.id,
                is_main=True
            ))

        db.commit()
        print(f"Created PAID listing: The Rustic Spoon (ID: {paid_poi.id}, Slug: {paid_poi.slug})")

        # ============================================
        # LISTING 2: FREE LISTING (Simplified)
        # ============================================
        free_poi = PointOfInterest(
            poi_type=POIType.BUSINESS,
            name="The Rustic Spoon",
            slug="the-rustic-spoon-pittsboro-free",  # Manually set to avoid conflict
            listing_type="free",
            publication_status="published",
            is_verified=True,
            status="Fully Open",
            status_message="Fresh Baked Bread Today!",

            # Address
            address_street="123 Main Street",
            address_city="Pittsboro",
            address_state="NC",
            address_zip="09845",
            address_county="Chatham County",
            address_full="123 Main Street, Pittsboro, NC 09845",

            # Location (slightly offset to avoid overlap)
            location="POINT(-79.1782 35.7220)",

            # Descriptions
            description_long="The Rustic Spoon is a charming eatery known for its cozy atmosphere and delicious farm-to-table dishes. Nestled in the heart of the city, it offers a menu that celebrates local ingredients and seasonal flavors. Guests can enjoy a variety of mouthwatering options, from hearty brunches to exquisite dinners, all crafted with care. Whether you're stopping by for a quick bite or a leisurely meal, The Rustic Spoon promises a delightful dining experience.",
            description_short="Charming eatery with cozy atmosphere and farm-to-table dishes.",

            # Contact
            website_url="https://therusticspoon.com",
            phone_number="(555) 123-4567",

            # Hours
            hours={
                "monday": {"closed": True},
                "tuesday": [{"open": "09:00", "close": "12:00"}, {"open": "16:00", "close": "21:00"}],
                "wednesday": [{"open": "09:00", "close": "21:00"}],
                "thursday": [{"open": "09:00", "close": "12:00"}, {"open": "16:00", "close": "21:00"}],
                "friday": [{"open": "09:00", "close": "21:00"}],
                "saturday": [{"open": "09:00", "close": "21:00"}],
                "sunday": [{"open": "09:00", "close": "21:00"}]
            },

            holiday_hours={
                "labor_day": "Closed",
                "new_years_day": "5pm-8pm",
                "mlk_day": "5pm-8pm",
                "presidents_day": "Closed"
            },

            # Pricing
            price_range_per_person="$100+",
            payment_methods=["Cash", "Credit Card", "ATM"],

            # Ideal For
            ideal_for=["All Ages", "Families", "For the Kids", "Pet Friendly", "Ages 18+", "Ages 21+", "Golden Years Ages 55+"],

            # Parking
            parking_types=["Public Parking Lot", "Private Parking Lot", "Street Parking", "Oversized Vehicles", "RV Parking"],
            expect_to_pay_parking="yes",

            # Public toilets
            public_toilets=["Baby Changing Station", "Wheelchair Accessible"],
            toilet_description="Blah, Blah blah for the bathrooms! This is for patrons of the store only!",

            # Wheelchair accessibility
            wheelchair_accessible=["Accessible Bathrooms", "First Floor Seating"],
            wheelchair_details="We have accessible Bathrooms, accessible entry is on the right of the building and we have seating on the first floor.",

            # Pet policy
            pet_options=["Well Behaved Pet", "Dog Friendly", "Clean Up Stations", "Fenced In Area", "Kennels for Rent"],
            pet_policy="Many businesses, including shops, cafes, and restaurants, have specific policies regarding pets to ensure a safe and enjoyable environment for all customers.",
        )

        # Create Business subtype for free listing
        free_poi.business = Business(price_range="$$")

        db.add(free_poi)
        db.flush()

        # Add main category if it exists
        if restaurant_category:
            db.execute(poi_category_association.insert().values(
                poi_id=free_poi.id,
                category_id=restaurant_category.id,
                is_main=True
            ))

        db.commit()
        print(f"Created FREE listing: The Rustic Spoon (ID: {free_poi.id}, Slug: {free_poi.slug})")

        print("\n" + "="*50)
        print("Successfully created both Rustic Spoon listings!")
        print("="*50)
        print(f"\nPAID listing:")
        print(f"  - ID: {paid_poi.id}")
        print(f"  - Slug: {paid_poi.slug}")
        print(f"  - Listing Type: {paid_poi.listing_type}")
        print(f"\nFREE listing:")
        print(f"  - ID: {free_poi.id}")
        print(f"  - Slug: {free_poi.slug}")
        print(f"  - Listing Type: {free_poi.listing_type}")

    except Exception as e:
        print(f"Error seeding Rustic Spoon listings: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_rustic_spoon()
