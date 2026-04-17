#!/usr/bin/env python3
"""
Phase 1 Chatham County seed script.

ADDS 20 POIs to an already-seeded dev database, exercising every
Phase 1 data structure (arrival_methods, what3words, icon booleans,
sponsor levels, listing_types, ideal_for grouped dict, trail Phase 1
fields, event ticket_links, playground ADA checklist, etc.).

Idempotent: skips any POI whose slug already exists.

Usage (from host):
    docker exec nearby-admin-backend python scripts/seed_phase1_chatham.py
"""

import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.poi import (
    PointOfInterest, Business, Park, Trail, Event, POIRelationship
)
from app.models.category import Category, poi_category_association
from app.models.image import Image, ImageType
from app.crud.crud_poi import apply_phase1_computed

from shared.models.enums import POIType


# ---------------------------------------------------------------------------
# Unsplash photo IDs (reused from seed_sample_data.py + a few new ones)
# ---------------------------------------------------------------------------
UNSPLASH = {
    "cafe_main": "photo-1509042239860-f550ce710b93",
    "store_main": "photo-1604719312566-8912e9227c6a",
    "bbq_main": "photo-1529193591184-b1d58069ecdd",
    "bakery_main": "photo-1555507036-ab1f4038808a",
    "brewery_main": "photo-1559526324-4b87b5e36e44",
    "bookstore_main": "photo-1507842217343-583bb7270b66",
    "farm_main": "photo-1500595046743-cd271d694d30",
    "spa_main": "photo-1540555700478-4be289fbecef",
    "park_main": "photo-1441974231531-c6227db76b6e",
    "park_play": "photo-1503803548695-c2a7b4a5b875",
    "park_restroom": "photo-1513475382585-d06e58bcb0e0",
    "park_map": "photo-1524661135-423995f22d0b",
    "park_entry": "photo-1476610182048-b716b8518aae",
    "park_alt": "photo-1518173946687-a74572de8e8c",
    "trail_main": "photo-1551632811-561732d1e306",
    "trail_alt": "photo-1510797215324-95aa89f43c33",
    "trail_water": "photo-1502786129293-79981df4e689",
    "trail_night": "photo-1504280390367-361c6d9f38f4",
    "event_fair": "photo-1472653431158-6364773b2a56",
    "event_music": "photo-1429962714451-bb934ecdc4ec",
    "event_film": "photo-1514525253161-7a46d19cd819",
    "gallery_a": "photo-1495474472287-4d71bcdd2085",
    "gallery_b": "photo-1442512595331-e89e73853f31",
}


def unsplash_url(key: str, w: int = 800) -> str:
    return f"https://images.unsplash.com/{UNSPLASH[key]}?w={w}&q=80&auto=format"


def attach_image(db, poi_id, image_type, key, display_order=0, alt=""):
    img = Image(
        poi_id=poi_id, image_type=image_type, filename=f"{key}.jpg",
        original_filename=f"{key}.jpg", mime_type="image/jpeg",
        width=800, height=600, storage_provider="external",
        storage_url=unsplash_url(key, 800), storage_key=f"seed-p1/{key}.jpg",
        image_size_variant="original",
        alt_text=alt or key.replace("_", " ").title(),
        display_order=display_order,
    )
    db.add(img); db.flush()
    thumb = Image(
        poi_id=poi_id, image_type=image_type, filename=f"thumb_{key}.jpg",
        original_filename=f"{key}.jpg", mime_type="image/jpeg",
        width=150, height=150, storage_provider="external",
        storage_url=unsplash_url(key, 150), storage_key=f"seed-p1/thumb_{key}.jpg",
        image_size_variant="thumbnail", parent_image_id=img.id,
        alt_text=alt or key, display_order=display_order,
    )
    db.add(thumb)
    return img


def get_cat(db, slug):
    return db.query(Category).filter(Category.slug == slug).first()


# ---------------------------------------------------------------------------
# Helpers to build POIs
# ---------------------------------------------------------------------------

BASE_SCALAR_FIELDS = {
    "name", "slug", "description_long", "description_short", "teaser_paragraph",
    "address_full", "address_street", "address_city", "address_state",
    "address_zip", "address_county", "status", "publication_status",
    "is_verified", "has_been_published", "website_url", "phone_number", "email",
    "listing_type", "is_sponsor", "sponsor_level", "admin_notes", "cost",
    "pricing_details", "alcohol_available", "park_entry_notes",
    "what3words_address", "dont_display_location", "hours_but_appointment_required",
    "playground_available", "history_paragraph",
}
JSONB_FIELDS = {
    "arrival_methods", "hours", "holiday_hours", "amenities", "contact_info",
    "compliance", "photos", "custom_fields", "ideal_for", "pet_options",
    "public_toilets", "wifi_options", "parking_types", "payment_methods",
    "key_facilities", "wheelchair_accessible", "accessible_parking_details",
    "accessible_restroom_details", "playground_types", "playground_surface_types",
    "playground_age_groups", "playground_ada_checklist", "business_amenities",
    "discounts", "entertainment_options", "youth_amenities", "facilities_options",
    "natural_features", "things_to_do", "smoking_options", "other_socials",
}


def build_poi(db, *, poi_type, subtype_obj=None, category_slugs=None,
              images=None, **fields):
    """Create a PointOfInterest + subtype, applying apply_phase1_computed.
    Returns (poi, created_bool)."""
    slug = fields["slug"]
    existing = db.query(PointOfInterest).filter(PointOfInterest.slug == slug).first()
    if existing:
        print(f"  [skip] already exists: {slug}")
        return existing, False

    # Set defaults
    fields.setdefault("address_state", "NC")
    fields.setdefault("address_county", "Chatham County")
    fields.setdefault("publication_status", "published")
    fields.setdefault("status", "Fully Open")

    location_wkt = fields.pop("location")

    # Build a dict of fields for apply_phase1_computed
    poi_data = {k: v for k, v in fields.items()}
    apply_phase1_computed(poi_data)

    poi = PointOfInterest(poi_type=poi_type, **poi_data)
    poi.location = location_wkt
    if subtype_obj is not None:
        if poi_type == POIType.BUSINESS:
            poi.business = subtype_obj
        elif poi_type == POIType.PARK:
            poi.park = subtype_obj
        elif poi_type == POIType.TRAIL:
            poi.trail = subtype_obj
        elif poi_type == POIType.EVENT:
            poi.event = subtype_obj

    db.add(poi); db.flush()

    # Attach categories (first is main)
    for i, cslug in enumerate(category_slugs or []):
        cat = get_cat(db, cslug)
        if not cat:
            continue
        db.execute(poi_category_association.insert().values(
            poi_id=poi.id, category_id=cat.id, is_main=(i == 0)
        ))

    # Images
    for img_type, key, order, alt in images or []:
        attach_image(db, poi.id, img_type, key, order, alt)

    db.commit()
    flags = []
    if poi.is_sponsor: flags.append(f"sponsor={poi.sponsor_level}")
    if poi.icon_free_wifi: flags.append("wifi")
    if poi.icon_pet_friendly: flags.append("pet")
    if poi.icon_public_restroom: flags.append("restroom")
    if poi.icon_wheelchair_accessible: flags.append("wheelchair")
    if poi.inclusive_playground: flags.append("inclusive-pg")
    if poi.dont_display_location: flags.append("hidden-loc")
    print(f"  [new] {slug} | {poi.listing_type} | {' '.join(flags) or '-'}")
    return poi, True


# ---------------------------------------------------------------------------
# POI definitions
# ---------------------------------------------------------------------------

def seed_businesses(db):
    print("\n--- Phase 1 Businesses (8) ---")
    out = []

    # 1. Pittsboro Sourdough — platform sponsor, paid_founding, free_wifi
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$$"),
        category_slugs=["restaurant-food", "locally-owned"],
        images=[(ImageType.main, "bakery_main", 0, "Sourdough bakery storefront"),
                (ImageType.gallery, "gallery_a", 0, "Fresh loaves"),
                (ImageType.gallery, "gallery_b", 1, "Interior")],
        name="Pittsboro Sourdough",
        slug="pittsboro-sourdough-pittsboro",
        location="POINT(-79.1755 35.7222)",
        description_short="Wood-fired sourdough and European pastries in downtown Pittsboro.",
        description_long="Pittsboro Sourdough is a founding listing on Nearby Nearby — a tiny neighborhood bakery with a big wood-fired oven. We mill our own flour and bake everything fresh daily.",
        teaser_paragraph="Wood-fired sourdough, fresh daily.",
        address_street="25 Hillsboro Street", address_city="Pittsboro",
        address_zip="27312", address_full="25 Hillsboro Street, Pittsboro, NC 27312",
        website_url="https://pittsborosourdough.example.com",
        phone_number="(919) 555-0201", email="hello@pittsborosourdough.example.com",
        listing_type="paid_founding", is_sponsor=True, sponsor_level="platform",
        has_been_published=True,
        what3words_address="filled.count.soap",
        arrival_methods=["Street Parking", "Bike-In Access", "Public Transit"],
        admin_notes="Founding partner — comped their first year. Owner: Ada.",
        hours={
            "monday": {"closed": True},
            "tuesday": [{"open": "07:00", "close": "15:00"}],
            "wednesday": [{"open": "07:00", "close": "15:00"}],
            "thursday": [{"open": "07:00", "close": "15:00"}],
            "friday": [{"open": "07:00", "close": "18:00"}, {"open": "19:00", "close": "21:00"}],
            "saturday": [{"open": "08:00", "close": "14:00"}],
            "sunday": [{"open": "08:00", "close": "13:00"}],
        },
        holiday_hours={"christmas": "closed", "thanksgiving": {"open": "08:00", "close": "12:00"}},
        wifi_options=["Free Wifi"],
        pet_options=["Dogs Welcome", "Service Animals Welcome"],
        public_toilets=["Flush Toilets", "All-Gender / Unisex"],
        accessible_parking_details=["Dedicated accessible parking spaces on site", "Van accessible space available (8 foot access aisle)"],
        accessible_restroom_details={
            "Accessible stall present": True,
            "Grab bars installed": True,
            "Door hardware lever or auto": True,
        },
        alcohol_available="beer_wine",
        business_amenities=["Wi-Fi Access", "Public Restroom", "Outdoor Seating"],
        payment_methods=["Cash", "Credit Cards", "Apple Pay", "Venmo"],
        discounts=["Local Resident + In-County Discount", "Teacher"],
        contact_info={"best": {"name": "Ada", "phone": "919-555-0201", "email": "ada@example.com"}},
        compliance={"pre_approval_required": False, "lead_time": "none"},
        photos={"featured": unsplash_url("bakery_main")},
        amenities={"wifi": None, "outdoor_seating": True},
        custom_fields={"Parking Tip": "Back lot is free after 5 PM."},
        other_socials={"youtube": "@pittsborosourdough"},
        instagram_username="pittsborosourdough",
        ideal_for=["Cozy + Intimate", "Families", "First Date", "Locally Sourced Ingredients", "Authentic + Local"],
    ))

    # 2. Bynum Bridge Brewery — state sponsor, paid listing, pet friendly, outdoor, beer
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$$"),
        category_slugs=["restaurant-food", "live-music"],
        images=[(ImageType.main, "brewery_main", 0, "Brewery taproom")],
        name="Bynum Bridge Brewery",
        slug="bynum-bridge-brewery-bynum",
        location="POINT(-79.1590 35.7750)",
        description_short="Craft brewery with riverside patio and live music Fridays.",
        description_long="Bynum Bridge Brewery pours small-batch ales beside the Haw River. Pet-friendly patio, food trucks weekends.",
        teaser_paragraph="Craft brews + live music by the Haw River.",
        address_street="101 Bynum Road", address_city="Pittsboro",
        address_zip="27312", address_full="101 Bynum Road, Pittsboro, NC 27312",
        website_url="https://bynumbridge.example.com", phone_number="(919) 555-0202",
        listing_type="paid", is_sponsor=True, sponsor_level="state",
        has_been_published=True,
        what3words_address="river.stone.amber",
        arrival_methods=["Dedicated Parking On Site", "Bike-In Access"],
        admin_notes="State-level sponsor from NC Craft Brewers Guild co-op.",
        hours={"wednesday": [{"open": "16:00", "close": "22:00"}],
               "thursday": [{"open": "16:00", "close": "22:00"}],
               "friday": [{"open": "15:00", "close": "23:00"}],
               "saturday": [{"open": "12:00", "close": "23:00"}],
               "sunday": [{"open": "12:00", "close": "20:00"}]},
        holiday_hours={"new_years_day": "closed"},
        wifi_options=["Free Wifi"],
        pet_options=["Pet Friendly", "Dogs Welcome", "Dog Water Bowls Provided"],
        public_toilets=["Accessible Restroom", "All-Gender / Unisex"],
        accessible_parking_details=["Dedicated accessible parking spaces on site"],
        accessible_restroom_details={"Accessible stall present": True, "Grab bars installed": True},
        alcohol_available="full_bar",
        payment_methods=["Credit Cards", "Apple Pay", "Google Pay", "Cash"],
        business_amenities=["Outdoor Seating", "Live Music", "Pet Friendly Patio"],
        entertainment_options=["Live Music", "Game Night", "Sports on TV"],
        ideal_for=["Loud + Lively", "Casual + Welcoming", "Ages 21+", "Pet Friendly", "First Date"],
        contact_info={"best": {"name": "Marcus", "phone": "919-555-0202"}},
        amenities={"outdoor_seating": True, "food_trucks": True},
        photos={"featured": unsplash_url("brewery_main")},
    ))

    # 3. Siler City Bookshop — community comped, no sponsor, free_wifi, pet friendly
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$"),
        category_slugs=["shopping-retail", "arts-culture"],
        images=[(ImageType.main, "bookstore_main", 0, "Bookshop exterior")],
        name="Siler City Bookshop",
        slug="siler-city-bookshop",
        location="POINT(-79.4620 35.7235)",
        description_short="Independent bookstore with reading nooks and a resident shop cat.",
        description_long="Community-comped listing. We stock regional authors and host a monthly book club at the library.",
        teaser_paragraph="Indie bookstore with a shop cat.",
        address_street="110 N Chatham Ave", address_city="Siler City",
        address_zip="27344", address_full="110 N Chatham Ave, Siler City, NC 27344",
        website_url="https://silercitybooks.example.com",
        listing_type="community_comped", has_been_published=True,
        what3words_address="pages.chapters.binding",
        arrival_methods=["Street Parking", "Nearby Public Parking"],
        admin_notes="Nonprofit adjacent — comped via Chatham Arts Council.",
        hours={"tuesday": [{"open": "10:00", "close": "18:00"}],
               "wednesday": [{"open": "10:00", "close": "18:00"}],
               "thursday": [{"open": "10:00", "close": "18:00"}],
               "friday": [{"open": "10:00", "close": "20:00"}],
               "saturday": [{"open": "10:00", "close": "17:00"}]},
        wifi_options=["Free Wifi"],
        pet_options=["Cats Welcome", "Small Dogs Only"],
        public_toilets=["All-Gender / Unisex"],
        alcohol_available="no_alcohol",
        payment_methods=["Cash", "Credit Cards"],
        business_amenities=["Wi-Fi Access", "Reading Nook"],
        ideal_for=["Quiet + Reflective", "Solo Friendly", "Historic + Heritage", "Budget Friendly"],
        contact_info={"best": {"name": "Iris"}},
        custom_fields={"Shop Cat": "Hemingway, 14yo tuxedo."},
    ))

    # 4. Moncure Auto Repair — free listing, no icons, plain
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$$"),
        category_slugs=["services", "professional-services"],
        images=[(ImageType.main, "store_main", 0, "Auto shop")],
        name="Moncure Auto Repair",
        slug="moncure-auto-repair",
        location="POINT(-79.0810 35.6255)",
        description_short="Family-run auto repair and inspections since 1978.",
        description_long="Honest mechanics, walk-ins welcome. NC state inspections while you wait.",
        teaser_paragraph="Family-run garage — since 1978.",
        address_street="4501 Old US 1", address_city="Moncure",
        address_zip="27559", address_full="4501 Old US 1, Moncure, NC 27559",
        phone_number="(919) 555-0204",
        listing_type="free", has_been_published=False,
        arrival_methods=["Dedicated Parking On Site"],
        admin_notes="Reached out 3x — owner prefers minimal online presence.",
        hours={"monday": [{"open": "08:00", "close": "17:00"}],
               "tuesday": [{"open": "08:00", "close": "17:00"}],
               "wednesday": [{"open": "08:00", "close": "17:00"}],
               "thursday": [{"open": "08:00", "close": "17:00"}],
               "friday": [{"open": "08:00", "close": "17:00"}]},
        wifi_options=["No Public Wifi"],
        public_toilets=["No Public Restroom"],
        alcohol_available="no_alcohol",
        payment_methods=["Cash", "Check", "Credit Cards"],
        ideal_for=["Authentic + Local", "Community Centered", "Walk Ins Welcome"],
    ))

    # 5. Goldston General Store — paid listing, dont_display_location=True
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$"),
        category_slugs=["shopping-retail"],
        images=[(ImageType.main, "store_main", 0, "General store")],
        name="Goldston General Store",
        slug="goldston-general-store",
        location="POINT(-79.3280 35.5980)",
        description_short="Rural general store — call ahead for hours.",
        description_long="Owner requested that exact location not be displayed; show only city on map.",
        teaser_paragraph="Rural general store. Call ahead.",
        address_street="2201 Pittsboro-Goldston Rd", address_city="Goldston",
        address_zip="27252", address_full="2201 Pittsboro-Goldston Rd, Goldston, NC 27252",
        phone_number="(919) 555-0205",
        listing_type="paid", dont_display_location=True, has_been_published=True,
        what3words_address="meadow.barn.chimney",
        arrival_methods=["Dedicated Parking On Site", "Roadside Pull-Off"],
        admin_notes="dont_display_location=true — owner lives on-site, privacy request.",
        wifi_options=["No Public Wifi"],
        payment_methods=["Cash", "Check"],
        ideal_for=["Country + Rural", "Off the Beaten Path"],
    ))

    # 6. Bear Creek BBQ — paid_founding, county sponsor, pet, restroom, wheelchair
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$$"),
        category_slugs=["restaurant-food"],
        images=[(ImageType.main, "bbq_main", 0, "BBQ joint")],
        name="Bear Creek Smokehouse",
        slug="bear-creek-smokehouse",
        location="POINT(-79.4105 35.6310)",
        description_short="Hickory-smoked BBQ with pet-friendly patio and accessible entry.",
        description_long="County-sponsored listing. Wheelchair-accessible entrance, all-gender restrooms, dogs welcome on the patio.",
        teaser_paragraph="Hickory BBQ, pet patio, accessible.",
        address_street="899 Bonlee Bennett Rd", address_city="Bear Creek",
        address_zip="27207", address_full="899 Bonlee Bennett Rd, Bear Creek, NC 27207",
        website_url="https://bearcreeksmoke.example.com", phone_number="(919) 555-0206",
        listing_type="paid_founding", is_sponsor=True, sponsor_level="county",
        has_been_published=True,
        what3words_address="smoke.oak.pit",
        arrival_methods=["Dedicated Parking On Site", "Carpool + Rideshare Parking"],
        admin_notes="County sponsor: Chatham Co. Tourism Board.",
        hours={"wednesday": [{"open": "11:00", "close": "21:00"}],
               "thursday": [{"open": "11:00", "close": "21:00"}],
               "friday": [{"open": "11:00", "close": "22:00"}],
               "saturday": [{"open": "11:00", "close": "22:00"}],
               "sunday": [{"open": "11:00", "close": "19:00"}]},
        wifi_options=["Free Wifi"],
        pet_options=["Pet Friendly", "Dogs Welcome", "Pet Patio + Outdoor Only", "Dog Water Bowls Provided"],
        public_toilets=["Accessible Restroom", "Men's Restroom", "Women's Restroom", "Baby Changing Station"],
        accessible_parking_details=["Dedicated accessible parking spaces on site", "Accessible route from parking to main entrance"],
        accessible_restroom_details={
            "Accessible stall present": True, "Grab bars installed": True,
            "Sink height 34 in. or lower": True, "Signage with braille": True,
        },
        alcohol_available="beer_wine",
        payment_methods=["Cash", "Credit Cards", "Apple Pay", "Google Pay"],
        business_amenities=["Outdoor Seating", "Catering", "Wi-Fi Access"],
        discounts=["Military Veteran", "First Responder"],
        ideal_for=["Casual + Welcoming", "Families", "Pet Friendly", "Award Winning", "Locally Sourced Ingredients"],
        contact_info={"best": {"name": "Dale"}, "emergency": {"name": "Dale", "phone": "919-555-0206"}},
    ))

    # 7. Pittsboro Cafe — paid, town sponsor
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$$"),
        category_slugs=["restaurant-food"],
        images=[(ImageType.main, "cafe_main", 0, "Cafe")],
        name="Courthouse Square Cafe",
        slug="courthouse-square-cafe",
        location="POINT(-79.1771 35.7205)",
        description_short="Town-sponsored cafe on Pittsboro's historic courthouse square.",
        description_long="Town-level sponsor; comped by the Town of Pittsboro as part of downtown revitalization.",
        teaser_paragraph="Historic square cafe, town-sponsored.",
        address_street="1 Courthouse Square", address_city="Pittsboro",
        address_zip="27312", address_full="1 Courthouse Square, Pittsboro, NC 27312",
        website_url="https://cthsquare.example.com",
        listing_type="paid", is_sponsor=True, sponsor_level="town",
        has_been_published=True,
        what3words_address="square.clock.brick",
        arrival_methods=["Street Parking", "Nearby Public Parking", "Public Transit"],
        admin_notes="Town sponsor — bills Jan/Jul.",
        hours={"monday": [{"open": "07:00", "close": "16:00"}],
               "tuesday": [{"open": "07:00", "close": "16:00"}],
               "wednesday": [{"open": "07:00", "close": "16:00"}],
               "thursday": [{"open": "07:00", "close": "16:00"}],
               "friday": [{"open": "07:00", "close": "20:00"}],
               "saturday": [{"open": "08:00", "close": "20:00"}]},
        wifi_options=["Free Wifi"],
        pet_options=["Dogs Welcome"],
        public_toilets=["Accessible Restroom"],
        accessible_restroom_details={"Accessible stall present": True},
        alcohol_available="beer_wine",
        payment_methods=["Credit Cards", "Apple Pay", "Cash", "Contactless Payments"],
        ideal_for=["Modern + Trendy", "Community Gathering Spot", "Networking", "Families"],
    ))

    # 8. Fearrington Spa — free listing (draft)
    out.append(build_poi(db,
        poi_type=POIType.BUSINESS, subtype_obj=Business(price_range="$$$"),
        category_slugs=["health-wellness", "services"],
        images=[(ImageType.main, "spa_main", 0, "Spa")],
        name="Fearrington Wellness Spa",
        slug="fearrington-wellness-spa",
        location="POINT(-79.0890 35.8095)",
        description_short="Boutique spa — draft listing, not yet verified.",
        description_long="Draft POI used to verify has_been_published=false path.",
        teaser_paragraph="Boutique spa (draft).",
        address_street="2000 Fearrington Village Center", address_city="Pittsboro",
        address_zip="27312", address_full="2000 Fearrington Village Center, Pittsboro, NC 27312",
        publication_status="draft", has_been_published=False,
        listing_type="free",
        arrival_methods=["Dedicated Parking On Site"],
        admin_notes="Draft — waiting on owner verification.",
        hours_but_appointment_required=True,
        appointment_booking_url="https://fearrington.example.com/book",
        ideal_for=["Formal + Refined", "Luxury", "By Appointment Only"],
    ))

    return out


def seed_parks(db):
    print("\n--- Phase 1 Parks (5) ---")
    out = []

    # 1. Pittsboro Community Park — inclusive playground (all 3 required items)
    out.append(build_poi(db,
        poi_type=POIType.PARK,
        subtype_obj=Park(drone_usage_policy="No drones without written permit"),
        category_slugs=["municipal-park"],
        images=[(ImageType.main, "park_main", 0, "Community park"),
                (ImageType.playground, "park_play", 0, "Inclusive playground"),
                (ImageType.restroom, "park_restroom", 0, "Restroom building"),
                (ImageType.map, "park_map", 0, "Park map"),
                (ImageType.entry, "park_entry", 0, "Park entrance")],
        name="Pittsboro Community Park",
        slug="pittsboro-community-park",
        location="POINT(-79.1820 35.7180)",
        description_short="Fully inclusive playground, accessible restrooms, paved loop trail.",
        description_long="A showcase municipal park — inclusive playground meets all 3 required ADA items (accessible route, ground-level components, unitary surface), so inclusive_playground auto-flips true.",
        teaser_paragraph="Inclusive playground + accessible park.",
        address_street="500 Chatham Park Dr", address_city="Pittsboro",
        address_zip="27312", address_full="500 Chatham Park Dr, Pittsboro, NC 27312",
        listing_type="community_comped", has_been_published=True,
        what3words_address="swing.slide.surface",
        arrival_methods=["Dedicated Parking On Site", "Bike-In Access", "Public Transit"],
        admin_notes="Town-owned park. Inclusive playground opened 2024.",
        hours={"monday": [{"open": "06:00", "close": "22:00"}],
               "tuesday": [{"open": "06:00", "close": "22:00"}],
               "wednesday": [{"open": "06:00", "close": "22:00"}],
               "thursday": [{"open": "06:00", "close": "22:00"}],
               "friday": [{"open": "06:00", "close": "22:00"}],
               "saturday": [{"open": "06:00", "close": "22:00"}],
               "sunday": [{"open": "06:00", "close": "22:00"}]},
        holiday_hours={"christmas": "closed"},
        cost="0", park_entry_notes="Two entrances: main gate on Chatham Park Dr, secondary off Robeson St. Restrooms at main pavilion.",
        pet_options=["Dog Friendly", "Dogs On Leash Required", "Dog Waste Stations"],
        public_toilets=["Accessible Restroom", "Family Restroom", "Flush Toilets", "Baby Changing Station"],
        accessible_parking_details=["Dedicated accessible parking spaces on site", "Van accessible space available (8 foot access aisle)", "Accessible route from parking to main entrance"],
        accessible_restroom_details={
            "Accessible stall present": True, "Grab bars installed": True,
            "Accessible route to restroom": True, "Adult changing table": True,
            "Signage with braille": True,
        },
        playground_available=True,
        playground_types=["Inclusive / Universal", "Swings", "Slides", "Sensory Play"],
        playground_surface_types=["Poured-in-Place Rubber"],
        playground_age_groups=["2–5 years", "5–12 years", "All Ages"],
        playground_ada_checklist=[
            "Accessible route to play area",
            "Ground-level play components accessible",
            "Unitary surface (poured-rubber/tiles)",
            "Accessible swing (bucket/harness)",
            "Sensory play components",
            "Shade over play area",
            "Accessible seating for caregivers",
        ],
        wheelchair_accessible=["Paved Paths", "Accessible Parking", "Accessible Restroom"],
        key_facilities=["Playground", "Restrooms", "Paved Trail", "Picnic Shelter"],
        facilities_options=["Covered Shelter + Pavilion", "Drinking Fountain", "Benches"],
        natural_features=["Creek", "Hardwood Forest"],
        things_to_do=["Playground", "Walk", "Picnic", "Birdwatch"],
        ideal_for=["Families", "Community Gathering Spot", "All Ages", "Stroller Friendly", "Open + Inclusive"],
        contact_info={"best": {"name": "Parks & Rec Dept", "phone": "919-542-3200"}},
        custom_fields={"Permit Office": "Call Parks & Rec for shelter reservations."},
    ))

    # 2. Jordan Lake Access — park_entry_notes, alcohol_available, arrival
    out.append(build_poi(db,
        poi_type=POIType.PARK,
        subtype_obj=Park(drone_usage_policy="Drones allowed with NC State Parks permit"),
        category_slugs=["state-park", "park-boating", "park-fishing"],
        images=[(ImageType.main, "park_alt", 0, "Jordan Lake shoreline"),
                (ImageType.entry, "park_entry", 0, "Entry gate")],
        name="Jordan Lake — Farrington Point",
        slug="jordan-lake-farrington-point",
        location="POINT(-79.0360 35.7540)",
        description_short="State park access point with boat ramp, swim area, and fee station.",
        description_long="Farrington Point is a day-use state park area with restrooms, boat ramp, fishing pier, and picnic shelters. Self-pay fee envelope at the entrance.",
        teaser_paragraph="Boat ramp, swim beach, day-use fee.",
        address_street="2790 Farrington Point Rd", address_city="Pittsboro",
        address_zip="27312", address_full="2790 Farrington Point Rd, Pittsboro, NC 27312",
        listing_type="community_comped", has_been_published=True,
        what3words_address="lake.paddle.pines",
        arrival_methods=["Dedicated Parking On Site", "Boat Access", "Roadside Pull-Off"],
        admin_notes="Self-pay fee envelope; rangers do rounds.",
        hours={"monday": [{"open": "08:00", "close": "dusk"}],
               "tuesday": [{"open": "08:00", "close": "dusk"}],
               "wednesday": [{"open": "08:00", "close": "dusk"}],
               "thursday": [{"open": "08:00", "close": "dusk"}],
               "friday": [{"open": "08:00", "close": "dusk"}],
               "saturday": [{"open": "07:00", "close": "dusk"}],
               "sunday": [{"open": "07:00", "close": "dusk"}]},
        cost="$7",
        park_entry_notes="Self-pay $7 envelope at kiosk. Annual state park pass accepted. Boat launch fee is additional $5.",
        alcohol_available="no_alcohol",
        pet_options=["Dog Friendly", "Dogs On Leash Required"],
        public_toilets=["Vault Toilet", "Accessible Restroom", "Seasonal Restroom"],
        accessible_parking_details=["Accessible parking within reasonable distance", "Accessible parking on firm stable surface"],
        accessible_restroom_details={"Accessible route to restroom": True, "Firm stable flooring": True},
        key_facilities=["Boat Launch", "Swim Area", "Fishing Pier", "Picnic Shelter"],
        natural_features=["Lake", "Pine Forest"],
        things_to_do=["Swim", "Fish", "Boat", "Picnic"],
        payment_methods=["Cash", "Check", "Fee Station + Self-Pay Envelope"],
        ideal_for=["Nature Immersed", "Wide Open Spaces", "Families", "Pet Friendly", "Photography Friendly"],
        hunting_fishing_allowed="year_round", fishing_allowed="catch_keep",
        fishing_types=["Freshwater", "Bass", "Catfish"],
        licenses_required=["NC Freshwater Fishing License"],
    ))

    # 3. Siler City Dog Park — simple park with pet_options, seasonal alcohol
    out.append(build_poi(db,
        poi_type=POIType.PARK, subtype_obj=Park(drone_usage_policy="No"),
        category_slugs=["dog-park", "municipal-park"],
        images=[(ImageType.main, "park_alt", 0, "Dog park")],
        name="Siler City Bark Park",
        slug="siler-city-bark-park",
        location="POINT(-79.4590 35.7260)",
        description_short="Fenced off-leash dog park with separate small-dog area.",
        description_long="Two-acre off-leash dog park with waste stations, water fountain (pet + human), and shade structures.",
        teaser_paragraph="Off-leash dog park, two acres.",
        address_street="300 N 2nd Ave", address_city="Siler City",
        address_zip="27344", address_full="300 N 2nd Ave, Siler City, NC 27344",
        listing_type="community_comped", has_been_published=True,
        arrival_methods=["Dedicated Parking On Site"],
        admin_notes="Volunteer-run; contact Friends of Siler City Dog Park.",
        hours={k: [{"open": "dawn", "close": "dusk"}] for k in
               ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]},
        cost="0",
        alcohol_available="no_alcohol",
        pet_options=["Dog Park On Site", "Dogs Off Leash Permitted", "Dog Waste Stations",
                     "Dog Waste Bags Provided", "Dog Water Bowls Provided", "Small Dogs Only"],
        public_toilets=["Portable Toilet"],
        key_facilities=["Dog Park", "Water Fountain", "Shade Structures"],
        ideal_for=["Pet Friendly", "Community Gathering Spot", "Solo Friendly"],
    ))

    # 4. Robeson Creek Nature Preserve — draft park, accessible parking exercise
    out.append(build_poi(db,
        poi_type=POIType.PARK, subtype_obj=Park(drone_usage_policy="Permit only"),
        category_slugs=["nature-preserve"],
        images=[(ImageType.main, "park_main", 0, "Nature preserve")],
        name="Robeson Creek Nature Preserve",
        slug="robeson-creek-nature-preserve",
        location="POINT(-79.1985 35.7085)",
        description_short="Draft listing — 80-acre creek preserve, awaiting verification.",
        description_long="Draft POI covering has_been_published=false for parks.",
        teaser_paragraph="Draft nature preserve.",
        address_street="Robeson Creek Rd", address_city="Pittsboro",
        address_zip="27312", address_full="Robeson Creek Rd, Pittsboro, NC 27312",
        publication_status="draft", has_been_published=False,
        listing_type="free",
        arrival_methods=["Roadside Pull-Off", "Bike-In Access"],
        admin_notes="Awaiting land-trust confirmation before publish.",
        accessible_parking_details=["Accessible parking within reasonable distance"],
        pet_options=["Dogs On Leash Required"],
    ))

    # 5. Bynum Historic Mill Park — paid_founding (rare for parks), wifi + restroom + wheelchair icons
    out.append(build_poi(db,
        poi_type=POIType.PARK,
        subtype_obj=Park(drone_usage_policy="No drones"),
        category_slugs=["historical-sites", "municipal-park"],
        images=[(ImageType.main, "park_main", 0, "Historic mill"),
                (ImageType.restroom, "park_restroom", 0, "Mill restroom")],
        name="Bynum Historic Mill Park",
        slug="bynum-historic-mill-park",
        location="POINT(-79.1545 35.7722)",
        description_short="Historic cotton mill ruins with riverside picnic area and visitor center.",
        description_long="Small heritage park with interpretive signage and restored mill wheel. Visitor center has free wifi and all-gender accessible restroom.",
        teaser_paragraph="Historic mill + visitor center.",
        address_street="950 Bynum Rd", address_city="Pittsboro",
        address_zip="27312", address_full="950 Bynum Rd, Pittsboro, NC 27312",
        listing_type="paid_founding", has_been_published=True,
        what3words_address="mill.stone.wheel",
        arrival_methods=["Dedicated Parking On Site", "Roadside Pull-Off"],
        admin_notes="Founding paid listing from Chatham Historical Society.",
        hours={"wednesday": [{"open": "10:00", "close": "16:00"}],
               "thursday": [{"open": "10:00", "close": "16:00"}],
               "friday": [{"open": "10:00", "close": "16:00"}],
               "saturday": [{"open": "10:00", "close": "17:00"}],
               "sunday": [{"open": "12:00", "close": "17:00"}]},
        cost="0",
        wifi_options=["Free Wifi"],
        pet_options=["Dog Friendly", "Dogs On Leash Required"],
        public_toilets=["Accessible Restroom", "All-Gender / Unisex", "Flush Toilets"],
        accessible_parking_details=["Dedicated accessible parking spaces on site"],
        accessible_restroom_details={"Accessible stall present": True, "Grab bars installed": True},
        key_facilities=["Visitor Center", "Picnic Area", "Historic Site"],
        ideal_for=["Historic + Heritage", "Quiet + Reflective", "Peaceful + Secluded", "Families"],
        history_paragraph="The Bynum Mill operated from 1872 to 1982, producing cotton textiles along the Haw River. Restored as a public park in 2015.",
    ))

    return out


def seed_trails(db, parks):
    print("\n--- Phase 1 Trails (4) ---")
    out = []

    # Find a published park to link "trail_in_park" to
    target_park = next((p for p, c in parks if c and p.publication_status == "published"), None)
    if not target_park and parks:
        target_park = parks[0][0]

    # 1. Haw River Water Trail — route_type=water_trail, access_points
    out.append(build_poi(db,
        poi_type=POIType.TRAIL,
        subtype_obj=Trail(
            length_text="12 miles",
            difficulty="moderate",
            route_type="water_trail",
            trail_surfaces=["Water"],
            trail_experiences=["River Views", "Wildlife"],
            mile_markers=True,
            trailhead_signage=True,
            audio_guide_available=False,
            qr_trail_guide=True,
            trail_guide_notes="Mile markers are painted on bankside trees at each put-in. QR at every access point links to water level + hazard info.",
            trail_lighting="partial",
            access_points=[
                {"name": "Bynum Put-In", "lat": 35.7750, "lng": -79.1590, "type": "put-in"},
                {"name": "US 64 Take-Out", "lat": 35.7210, "lng": -79.1680, "type": "take-out"},
                {"name": "Jordan Lake Confluence", "lat": 35.7550, "lng": -79.0360, "type": "take-out"},
            ],
        ),
        category_slugs=["moderate", "park-boating"],
        images=[(ImageType.main, "trail_water", 0, "Haw River paddling")],
        name="Haw River Water Trail",
        slug="haw-river-water-trail",
        location="POINT(-79.1600 35.7400)",
        description_short="12-mile paddling water trail from Bynum to Jordan Lake.",
        description_long="Classic Piedmont river paddle. Class I–II in normal flow; scout when gauge exceeds 5 ft. Three official access points.",
        teaser_paragraph="12-mile Piedmont paddle, 3 access points.",
        address_street="Bynum Put-In", address_city="Pittsboro",
        address_zip="27312", address_full="Bynum Put-In, Pittsboro, NC 27312",
        listing_type="community_comped", has_been_published=True,
        what3words_address="paddle.current.boulder",
        arrival_methods=["Boat Access", "Dedicated Parking On Site", "Roadside Pull-Off"],
        admin_notes="Water trail — labels flip to Put-In/Take-Out in UI.",
        cost="0",
        pet_options=["Dog Friendly"],
        ideal_for=["Nature Immersed", "Wide Open Spaces", "Ages 18+", "Stewardship + Conservation"],
    ))

    # 2. Lower Haw Trail-in-Park (linked to target_park)
    linked_trail_poi, created = build_poi(db,
        poi_type=POIType.TRAIL,
        subtype_obj=Trail(
            length_text="2.1 miles",
            difficulty="easy",
            route_type="loop",
            trail_surfaces=["Dirt", "Gravel"],
            trail_experiences=["Riverside"],
            mile_markers=False,
            trailhead_signage=True,
            audio_guide_available=True,
            qr_trail_guide=True,
            trail_guide_notes="Self-guided audio tour via QR codes at trailhead and at the 0.5 / 1.0 / 1.5 mile posts.",
            trail_lighting="dusk_to_dawn",
            access_points=[{"name": "Main Trailhead", "lat": 35.7180, "lng": -79.1820, "type": "trailhead"}],
        ),
        category_slugs=["easy", "trail-walking"],
        images=[(ImageType.main, "trail_main", 0, "Wooded trail")],
        name="Community Park Loop",
        slug="pittsboro-community-park-loop",
        location="POINT(-79.1815 35.7185)",
        description_short="Easy 2.1-mile loop inside Pittsboro Community Park.",
        description_long="Trail-in-park example: linked via POIRelationship type='trail_in_park'.",
        teaser_paragraph="2.1-mile family loop.",
        address_street="500 Chatham Park Dr", address_city="Pittsboro",
        address_zip="27312", address_full="500 Chatham Park Dr, Pittsboro, NC 27312",
        listing_type="community_comped", has_been_published=True,
        what3words_address="loop.bench.shade",
        arrival_methods=["Dedicated Parking On Site"],
        admin_notes="Trail inside Pittsboro Community Park.",
        cost="0",
        pet_options=["Dog Friendly", "Dogs On Leash Required"],
        public_toilets=["Accessible Restroom"],
        accessible_parking_details=["Dedicated accessible parking spaces on site"],
        accessible_restroom_details={"Accessible stall present": True},
        ideal_for=["Families", "Stroller Friendly", "Casual + Welcoming"],
    )
    out.append((linked_trail_poi, created))

    # Create the trail_in_park relationship if both exist and linked trail was created now
    if created and target_park:
        existing_rel = db.query(POIRelationship).filter(
            POIRelationship.source_poi_id == linked_trail_poi.id,
            POIRelationship.target_poi_id == target_park.id,
            POIRelationship.relationship_type == "trail_in_park",
        ).first()
        if not existing_rel:
            db.add(POIRelationship(
                source_poi_id=linked_trail_poi.id,
                target_poi_id=target_park.id,
                relationship_type="trail_in_park",
            ))
            db.commit()
            print(f"    relationship: trail_in_park -> {target_park.name}")

    # 3. Devil's Tramping Trail — seasonal lighting, hard
    out.append(build_poi(db,
        poi_type=POIType.TRAIL,
        subtype_obj=Trail(
            length_text="4.8 miles",
            difficulty="challenging",
            route_type="loop",
            trail_surfaces=["Dirt", "Rock", "Root"],
            trail_experiences=["Historic Site", "Rugged"],
            mile_markers=True,
            trailhead_signage=False,
            audio_guide_available=False,
            qr_trail_guide=False,
            trail_guide_notes="No trail guide; bring paper map. Reception is poor past mile 1.",
            trail_lighting="seasonal",
            access_points=[{"name": "Primary TH", "lat": 35.6800, "lng": -79.2650, "type": "trailhead"}],
        ),
        category_slugs=["hard", "trail-hiking"],
        images=[(ImageType.main, "trail_night", 0, "Rugged trail")],
        name="Devil's Tramping Ground Loop",
        slug="devils-tramping-ground-loop",
        location="POINT(-79.2650 35.6800)",
        description_short="Challenging 4.8-mile loop to NC's famous bare circle.",
        description_long="Seasonal trail — unlit past Nov 1, partial clearings reopen in spring.",
        teaser_paragraph="Challenging 4.8-mile legend loop.",
        address_street="Devil's Tramping Ground Rd", address_city="Siler City",
        address_zip="27344", address_full="Devil's Tramping Ground Rd, Siler City, NC 27344",
        listing_type="free", has_been_published=True,
        what3words_address="circle.legend.pine",
        arrival_methods=["Roadside Pull-Off"],
        admin_notes="Seasonal trail; confirmed lighting=seasonal.",
        cost="0",
        pet_options=["Dogs On Leash Required"],
        ideal_for=["Off the Beaten Path", "Rustic + Natural", "Ages 18+", "Historic + Heritage"],
    ))

    # 4. Chatham Greenway Night Trail — full lighting
    out.append(build_poi(db,
        poi_type=POIType.TRAIL,
        subtype_obj=Trail(
            length_text="3.0 miles",
            difficulty="easy",
            route_type="out_and_back",
            trail_surfaces=["Paved"],
            trail_experiences=["Accessible", "Night Walking"],
            mile_markers=True,
            trailhead_signage=True,
            audio_guide_available=False,
            qr_trail_guide=True,
            trail_guide_notes="Lit every 100 ft. Emergency call boxes at miles 0, 1, 2, 3.",
            trail_lighting="full",
            access_points=[
                {"name": "North TH", "lat": 35.7250, "lng": -79.1700, "type": "trailhead"},
                {"name": "South TH", "lat": 35.7000, "lng": -79.1720, "type": "trailhead"},
            ],
        ),
        category_slugs=["easy", "trail-walking"],
        images=[(ImageType.main, "trail_alt", 0, "Paved greenway")],
        name="Chatham Greenway Night Trail",
        slug="chatham-greenway-night-trail",
        location="POINT(-79.1710 35.7125)",
        description_short="Fully lit paved greenway — walk or bike after dark.",
        description_long="3-mile paved out-and-back with full LED lighting and emergency call boxes.",
        teaser_paragraph="Fully lit paved greenway.",
        address_street="North Trailhead, Chatham Park", address_city="Pittsboro",
        address_zip="27312", address_full="North Trailhead, Chatham Park, Pittsboro, NC 27312",
        listing_type="community_comped", has_been_published=True,
        arrival_methods=["Dedicated Parking On Site", "Nearby Public Parking", "Bike-In Access"],
        admin_notes="Full-lit trail for night walkers.",
        cost="0",
        pet_options=["Dog Friendly", "Dogs On Leash Required"],
        public_toilets=["Accessible Restroom"],
        wheelchair_accessible=["Paved Paths", "Accessible Parking"],
        accessible_parking_details=["Dedicated accessible parking spaces on site", "Accessible route from parking to main entrance"],
        ideal_for=["Night Owls Open Late (past 10pm)", "Families", "Stroller Friendly", "Solo Friendly"],
    ))

    return out


def seed_events(db, businesses, parks, trails):
    print("\n--- Phase 1 Events (3) ---")
    out = []
    now = datetime.now(timezone.utc)

    # Pick published venues of each type
    biz_venue = next((p for p, c in businesses if p.publication_status == "published"), None)
    park_venue = next((p for p, c in parks if p.publication_status == "published"), None)
    trail_venue = next((p for p, c in trails if p.publication_status == "published"), None)

    # Event 1 at Business — ticketed, multi ticket_links, recurring weekly
    out.append(build_poi(db,
        poi_type=POIType.EVENT,
        subtype_obj=Event(
            start_datetime=(now + timedelta(days=5)).replace(hour=19, minute=0, second=0, microsecond=0),
            end_datetime=(now + timedelta(days=5)).replace(hour=22, minute=0, second=0, microsecond=0),
            is_repeating=True,
            repeat_pattern={"frequency": "weekly", "interval": 1, "days": ["friday"]},
            recurrence_end_date=(now + timedelta(days=90)),
            organizer_name="Bynum Bridge Brewery",
            organizer_email="events@bynumbridge.example.com",
            organizer_phone="(919) 555-0202",
            organizer_poi_id=biz_venue.id if biz_venue else None,
            venue_settings=["Outdoor"],
            venue_poi_id=biz_venue.id if biz_venue else None,
            venue_inheritance={"address": True, "hours": False},
            event_status="Scheduled",
            cost_type="single_price",
            ticket_links=[
                {"platform": "Eventbrite", "url": "https://eventbrite.example.com/brewfridays"},
                {"platform": "Square", "url": "https://square.example.com/brewfridays"},
                {"platform": "Website", "url": "https://bynumbridge.example.com/fridays"},
            ],
            sponsors=[{"name": "Chatham County Tourism", "level": "county"}],
            has_vendors=True,
            vendor_types=["Food Truck"],
        ),
        category_slugs=["live-music", "ticketed-event"],
        images=[(ImageType.main, "event_music", 0, "Live music")],
        name="Friday Night Brews & Bands",
        slug="friday-brews-and-bands",
        location="POINT(-79.1590 35.7750)",
        description_short="Weekly Friday live music at Bynum Bridge Brewery.",
        description_long="Recurring event (weekly) hosted at a Business venue. Multi-platform ticket links.",
        teaser_paragraph="Weekly live music Fridays.",
        address_street="101 Bynum Road", address_city="Pittsboro",
        address_zip="27312", address_full="101 Bynum Road, Pittsboro, NC 27312",
        listing_type="paid", has_been_published=True,
        what3words_address="stage.hops.friday",
        arrival_methods=["Dedicated Parking On Site", "Bike-In Access", "Shuttle + Drop-Off"],
        admin_notes="Series; expands into individual instances nightly.",
        cost="$15",
        alcohol_available="full_bar",
        pet_options=["Pet Friendly", "Dogs Welcome"],
        public_toilets=["Accessible Restroom"],
        wifi_options=["Free Wifi"],
        ideal_for=["Loud + Lively", "Ages 21+", "Community Gathering Spot", "First Date", "Pet Friendly"],
    ))

    # Event 2 at Park — festival, range cost, 2 ticket links
    out.append(build_poi(db,
        poi_type=POIType.EVENT,
        subtype_obj=Event(
            start_datetime=(now + timedelta(days=45)).replace(hour=10, minute=0, second=0, microsecond=0),
            end_datetime=(now + timedelta(days=47)).replace(hour=20, minute=0, second=0, microsecond=0),
            is_repeating=False,
            organizer_name="Chatham Arts Council",
            organizer_email="fest@chathamarts.example.com",
            organizer_website="https://chathamarts.example.com",
            venue_settings=["Outdoor"],
            venue_poi_id=park_venue.id if park_venue else None,
            venue_inheritance={"address": True, "hours": False, "amenities": True},
            event_status="Scheduled",
            cost_type="range",
            ticket_links=[
                {"platform": "Eventbrite", "url": "https://eventbrite.example.com/chathamfest"},
                {"platform": "Onsite", "url": "https://chathamarts.example.com/fest"},
            ],
            has_vendors=True,
            vendor_types=["Food", "Crafts", "Art", "Nonprofit"],
            sponsors=[
                {"name": "Town of Pittsboro", "level": "town"},
                {"name": "NC Arts Council", "level": "state"},
            ],
        ),
        category_slugs=["festival"],
        images=[(ImageType.main, "event_fair", 0, "Festival fair")],
        name="Chatham Arts Festival",
        slug="chatham-arts-festival-phase1",
        location="POINT(-79.1820 35.7180)",
        description_short="3-day arts festival at Pittsboro Community Park.",
        description_long="Event venue-linked to a Park. Range pricing ($10–$40). Two ticket platforms.",
        teaser_paragraph="3-day arts fest at the park.",
        address_street="500 Chatham Park Dr", address_city="Pittsboro",
        address_zip="27312", address_full="500 Chatham Park Dr, Pittsboro, NC 27312",
        listing_type="paid", has_been_published=True,
        what3words_address="canvas.music.meadow",
        arrival_methods=["Dedicated Parking On Site", "Shuttle + Drop-Off", "Carpool + Rideshare Parking"],
        admin_notes="Park-venued festival; inherits address but sets own hours.",
        cost="$10-$40",
        alcohol_available="seasonal",
        pet_options=["Dogs On Leash Required"],
        public_toilets=["Accessible Restroom", "Portable Toilet", "Family Restroom"],
        accessible_parking_details=["Accessible spaces closest to main entrance"],
        ideal_for=["Families", "All Ages", "Community Centered", "Award Winning"],
    ))

    # Event 3 at Trail — hike-with-naturalist, single ticket link, free
    out.append(build_poi(db,
        poi_type=POIType.EVENT,
        subtype_obj=Event(
            start_datetime=(now + timedelta(days=14)).replace(hour=9, minute=0, second=0, microsecond=0),
            end_datetime=(now + timedelta(days=14)).replace(hour=12, minute=0, second=0, microsecond=0),
            is_repeating=False,
            organizer_name="Chatham Conservation Trust",
            organizer_email="naturalist@chathamconserv.example.com",
            venue_settings=["Outdoor"],
            venue_poi_id=trail_venue.id if trail_venue else None,
            venue_inheritance={"address": True},
            event_status="Scheduled",
            cost_type="free",
            ticket_links=[
                {"platform": "Eventbrite", "url": "https://eventbrite.example.com/naturewalk"},
                {"platform": "RSVP", "url": "https://chathamconserv.example.com/rsvp"},
            ],
            has_vendors=False,
            sponsors=[],
        ),
        category_slugs=["educational", "kids-activities"],
        images=[(ImageType.main, "event_film", 0, "Outdoor walk")],
        name="Naturalist-Led Spring Walk",
        slug="naturalist-spring-walk",
        location="POINT(-79.1600 35.7400)",
        description_short="Free guided ecology walk along the Haw River Water Trail.",
        description_long="Event venue-linked to a Trail POI. Free, RSVP required.",
        teaser_paragraph="Free guided nature walk.",
        address_street="Bynum Put-In", address_city="Pittsboro",
        address_zip="27312", address_full="Bynum Put-In, Pittsboro, NC 27312",
        listing_type="community_comped", has_been_published=True,
        arrival_methods=["Roadside Pull-Off", "Bike-In Access"],
        admin_notes="Free; trail-venued event.",
        cost="0",
        alcohol_available="no_alcohol",
        pet_options=["Dogs On Leash Required"],
        ideal_for=["Families", "All Ages", "Nature Immersed", "Educational"],
    ))

    return out


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 72)
    print("  Phase 1 Chatham County seed")
    print("=" * 72)

    db: Session = SessionLocal()
    all_results = []
    try:
        businesses = seed_businesses(db)
        parks = seed_parks(db)
        trails = seed_trails(db, parks)
        events = seed_events(db,
                             [b for b in businesses],
                             [p for p in parks],
                             [t for t in trails])
        all_results = businesses + parks + trails + events
    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        import traceback; traceback.print_exc()
        raise
    finally:
        # Summary
        created_pois = [p for p, c in all_results if c]
        skipped = [p for p, c in all_results if not c]

        def count(pred):
            return sum(1 for p in created_pois if pred(p))

        wifi_ct = count(lambda p: p.icon_free_wifi)
        pet_ct = count(lambda p: p.icon_pet_friendly)
        restroom_ct = count(lambda p: p.icon_public_restroom)
        wheel_ct = count(lambda p: p.icon_wheelchair_accessible)
        spons = {"platform": 0, "state": 0, "county": 0, "town": 0}
        for p in created_pois:
            if p.is_sponsor and p.sponsor_level in spons:
                spons[p.sponsor_level] += 1
        inclusive = count(lambda p: p.inclusive_playground)
        water = sum(1 for p in created_pois
                    if p.poi_type == POIType.TRAIL and p.trail and p.trail.route_type == "water_trail")
        multi_tickets = sum(1 for p in created_pois
                            if p.poi_type == POIType.EVENT and p.event
                            and isinstance(p.event.ticket_links, list)
                            and len(p.event.ticket_links) >= 2)

        print("\n" + "=" * 72)
        print(" === Phase 1 Chatham County seed summary ===")
        print(f"  {len(created_pois)} POIs created  ({len(skipped)} skipped/existed)")
        print(f"  Icon booleans set: free_wifi={wifi_ct}, pet_friendly={pet_ct}, "
              f"public_restroom={restroom_ct}, wheelchair={wheel_ct}")
        print(f"  Sponsors: platform={spons['platform']}, state={spons['state']}, "
              f"county={spons['county']}, town={spons['town']}")
        print(f"  Inclusive playgrounds: {inclusive}")
        print(f"  Trails with water_trail route: {water}")
        print(f"  Events with multi-ticket links: {multi_tickets}")
        print("=" * 72)
        db.close()


if __name__ == "__main__":
    main()
