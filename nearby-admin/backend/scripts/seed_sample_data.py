#!/usr/bin/env python3
"""
Seed script for local development database.

Creates ~12 sample POIs (businesses, parks, trails, events) in the
Pittsboro / Chatham County, NC area with Unsplash images so the
frontend has real content to display.

Usage (inside admin backend container):
    python scripts/seed_sample_data.py

Or from host:
    docker exec nearby-admin-backend-1 python scripts/seed_sample_data.py
"""

import sys
import os
import uuid
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.poi import PointOfInterest, Business, Park, Trail, Event
from app.models.category import Category, poi_category_association
from app.models.image import Image, ImageType
from app.models.user import User
from app.core.security import get_password_hash
from app.crud.crud_user import get_user_by_email

from shared.models.enums import POIType

# ---------------------------------------------------------------------------
# Unsplash photo IDs — all freely licensed
# ---------------------------------------------------------------------------
UNSPLASH = {
    # Businesses
    "cafe_main": "photo-1509042239860-f550ce710b93",
    "cafe_gallery1": "photo-1495474472287-4d71bcdd2085",
    "cafe_gallery2": "photo-1442512595331-e89e73853f31",
    "store_main": "photo-1604719312566-8912e9227c6a",
    "store_gallery1": "photo-1556742049-0cfed4f6a45d",
    "store_gallery2": "photo-1582268611958-ebfd161ef9cf",
    "bbq_main": "photo-1529193591184-b1d58069ecdd",
    "bbq_gallery1": "photo-1558030006-450675393462",
    "bbq_gallery2": "photo-1544025162-d76694265947",
    # Parks
    "park1_main": "photo-1441974231531-c6227db76b6e",
    "park1_gallery1": "photo-1472396961693-142e6e269027",
    "park1_gallery2": "photo-1500534314263-0869cdc67ded",
    "park2_main": "photo-1507003211169-0a1dd7228f2d",
    "park2_gallery1": "photo-1470071459604-3b5ec3a7fe05",
    "park3_main": "photo-1518173946687-a74572de8e8c",
    "park3_gallery1": "photo-1476610182048-b716b8518aae",
    # Trails
    "trail1_main": "photo-1551632811-561732d1e306",
    "trail1_gallery1": "photo-1501555088652-021faa106b9b",
    "trail1_gallery2": "photo-1519681393784-d120267933ba",
    "trail2_main": "photo-1510797215324-95aa89f43c33",
    "trail2_gallery1": "photo-1473448912268-2022ce9509d8",
    "trail3_main": "photo-1504280390367-361c6d9f38f4",
    "trail3_gallery1": "photo-1542202229-7d93c33f5d07",
    # Events
    "event1_main": "photo-1533174072545-7a4b6ad7a6c3",
    "event1_gallery1": "photo-1555939594-58d7cb561ad1",
    "event2_main": "photo-1472653431158-6364773b2a56",
    "event2_gallery1": "photo-1514525253161-7a46d19cd819",
    "event3_main": "photo-1429962714451-bb934ecdc4ec",
    "event3_gallery1": "photo-1470229722913-7c0e2dbbafd3",
}


def unsplash_url(key: str, w: int = 800) -> str:
    """Build a sized Unsplash URL from a photo key."""
    photo_id = UNSPLASH[key]
    return f"https://images.unsplash.com/{photo_id}?w={w}&q=80&auto=format"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ensure_test_user(db: Session) -> User:
    """Create seed@nearbynearby.com if it doesn't exist. Return User."""
    email = "seed@nearbynearby.com"
    user = get_user_by_email(db, email)
    if user:
        print(f"  Test user already exists: {email}")
        return user
    user = User(
        email=email,
        hashed_password=get_password_hash("seed1234"),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"  Created test user: {email}")
    return user


def ensure_categories(db: Session):
    """Run seed_categories if the table is empty."""
    count = db.query(Category).count()
    if count > 0:
        print(f"  Categories already seeded ({count} rows)")
        return
    print("  Seeding categories...")
    from scripts.seed_categories import seed_categories
    seed_categories()


def get_category(db: Session, name: str) -> Category | None:
    return db.query(Category).filter(Category.name == name).first()


def attach_image(
    db: Session,
    poi_id: uuid.UUID,
    image_type: ImageType,
    image_key: str,
    display_order: int = 0,
    alt_text: str = "",
) -> Image | None:
    """Download an Unsplash image and create an Image record.

    Because we're seeding a *local dev* database (no S3/MinIO required for
    display), we store a direct Unsplash URL as the storage_url. The frontend
    will load images from these URLs directly.
    """
    url = unsplash_url(image_key, w=800)
    thumb_url = unsplash_url(image_key, w=150)

    img = Image(
        poi_id=poi_id,
        image_type=image_type,
        filename=f"{image_key}.jpg",
        original_filename=f"{image_key}.jpg",
        mime_type="image/jpeg",
        width=800,
        height=600,
        storage_provider="external",
        storage_url=url,
        storage_key=f"seed/{image_key}.jpg",
        image_size_variant="original",
        alt_text=alt_text or image_key.replace("_", " ").title(),
        display_order=display_order,
    )
    db.add(img)
    db.flush()  # Get img.id so we can link the thumbnail

    # Create a thumbnail variant record so the frontend has a thumb URL
    thumb = Image(
        poi_id=poi_id,
        image_type=image_type,
        filename=f"thumbnail_{image_key}.jpg",
        original_filename=f"{image_key}.jpg",
        mime_type="image/jpeg",
        width=150,
        height=150,
        storage_provider="external",
        storage_url=thumb_url,
        storage_key=f"seed/thumbnail_{image_key}.jpg",
        image_size_variant="thumbnail",
        parent_image_id=img.id,
        alt_text=alt_text or image_key.replace("_", " ").title(),
        display_order=display_order,
    )
    db.add(thumb)
    return img


# ---------------------------------------------------------------------------
# POI definitions
# ---------------------------------------------------------------------------

def create_businesses(db: Session):
    print("\n--- Businesses ---")

    cat_restaurant = get_category(db, "Restaurant & Food")
    cat_retail = get_category(db, "Shopping & Retail")

    businesses = [
        {
            "name": "Chatham Coffee Co.",
            "slug": "chatham-coffee-co-pittsboro",
            "location": "POINT(-79.1762 35.7215)",
            "description_short": "Locally roasted specialty coffee and fresh-baked pastries in downtown Pittsboro.",
            "description_long": (
                "Chatham Coffee Co. is a community gathering place in the heart of "
                "downtown Pittsboro. We roast our beans in small batches using ethically "
                "sourced green coffee from around the world. Our pastry case is stocked "
                "daily with scones, muffins, and seasonal treats baked in-house. Whether "
                "you need a morning pick-me-up or a quiet afternoon workspace, our cozy "
                "shop has you covered."
            ),
            "teaser_paragraph": "Small-batch roasted coffee & fresh pastries daily.",
            "address_street": "42 Hillsboro Street",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "42 Hillsboro Street, Pittsboro, NC 27312",
            "website_url": "https://chathamcoffee.example.com",
            "phone_number": "(919) 555-0101",
            "price_range": "$$",
            "hours": {
                "monday": [{"open": "06:30", "close": "17:00"}],
                "tuesday": [{"open": "06:30", "close": "17:00"}],
                "wednesday": [{"open": "06:30", "close": "17:00"}],
                "thursday": [{"open": "06:30", "close": "17:00"}],
                "friday": [{"open": "06:30", "close": "18:00"}],
                "saturday": [{"open": "07:00", "close": "18:00"}],
                "sunday": [{"open": "08:00", "close": "15:00"}],
            },
            "category": cat_restaurant,
            "images": {
                "main": "cafe_main",
                "gallery": ["cafe_gallery1", "cafe_gallery2"],
            },
            "ideal_for": ["All Ages", "Families", "Pet Friendly"],
            "payment_methods": ["Cash", "Credit Card", "Apple Pay"],
            "business_amenities": ["Wi-Fi Access", "Public Restroom"],
            "pet_options": ["Dog Friendly"],
        },
        {
            "name": "Pittsboro General Store",
            "slug": "pittsboro-general-store-pittsboro",
            "location": "POINT(-79.1780 35.7202)",
            "description_short": "Vintage-inspired general store carrying local goods, pantry staples, and gifts.",
            "description_long": (
                "Pittsboro General Store is a throwback to a simpler time. We stock "
                "locally made jams, honey, and sauces alongside everyday pantry items "
                "you won't find at the big-box stores. Our shelves also feature handmade "
                "gifts, candles, and pottery from Chatham County artisans. Stop in for a "
                "cold bottle of Cheerwine and a friendly chat."
            ),
            "teaser_paragraph": "Local goods, pantry staples & handmade gifts.",
            "address_street": "15 Sanford Road",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "15 Sanford Road, Pittsboro, NC 27312",
            "website_url": "https://pittsborogeneral.example.com",
            "phone_number": "(919) 555-0102",
            "price_range": "$",
            "hours": {
                "monday": [{"open": "09:00", "close": "18:00"}],
                "tuesday": [{"open": "09:00", "close": "18:00"}],
                "wednesday": [{"open": "09:00", "close": "18:00"}],
                "thursday": [{"open": "09:00", "close": "18:00"}],
                "friday": [{"open": "09:00", "close": "19:00"}],
                "saturday": [{"open": "10:00", "close": "17:00"}],
                "sunday": {"closed": True},
            },
            "category": cat_retail,
            "images": {
                "main": "store_main",
                "gallery": ["store_gallery1", "store_gallery2"],
            },
            "ideal_for": ["All Ages", "Families"],
            "payment_methods": ["Cash", "Credit Card"],
            "business_amenities": ["Public Restroom", "Parking Facilities"],
        },
        {
            "name": "Southern Roots BBQ",
            "slug": "southern-roots-bbq-pittsboro",
            "location": "POINT(-79.1745 35.7228)",
            "description_short": "Slow-smoked Eastern NC-style barbecue with homemade sides and sweet tea.",
            "description_long": (
                "Southern Roots BBQ has been serving Chatham County's finest pit-cooked "
                "pork since 2018. Our pitmasters start the smokers before dawn, cooking "
                "whole hogs low and slow over hickory and oak. Pair your pulled pork with "
                "our famous vinegar slaw, hush puppies, and banana pudding. We also cater "
                "events large and small — ask about our whole-hog packages."
            ),
            "teaser_paragraph": "Pit-cooked whole hog BBQ & homemade sides since 2018.",
            "address_street": "108 East Street",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "108 East Street, Pittsboro, NC 27312",
            "website_url": "https://southernrootsbbq.example.com",
            "phone_number": "(919) 555-0103",
            "price_range": "$$",
            "hours": {
                "monday": {"closed": True},
                "tuesday": {"closed": True},
                "wednesday": [{"open": "11:00", "close": "20:00"}],
                "thursday": [{"open": "11:00", "close": "20:00"}],
                "friday": [{"open": "11:00", "close": "21:00"}],
                "saturday": [{"open": "11:00", "close": "21:00"}],
                "sunday": [{"open": "11:00", "close": "15:00"}],
            },
            "category": cat_restaurant,
            "images": {
                "main": "bbq_main",
                "gallery": ["bbq_gallery1", "bbq_gallery2"],
            },
            "ideal_for": ["All Ages", "Families", "For the Kids"],
            "payment_methods": ["Cash", "Credit Card"],
            "business_amenities": ["Public Restroom", "Parking Facilities"],
            "pet_options": ["Dog Friendly"],
        },
    ]

    for biz in businesses:
        existing = db.query(PointOfInterest).filter(
            PointOfInterest.slug == biz["slug"]
        ).first()
        if existing:
            print(f"  Skipping (exists): {biz['name']}")
            continue

        poi = PointOfInterest(
            poi_type=POIType.BUSINESS,
            name=biz["name"],
            slug=biz["slug"],
            listing_type="paid",
            publication_status="published",
            is_verified=True,
            status="Fully Open",
            location=biz["location"],
            description_short=biz["description_short"],
            description_long=biz["description_long"],
            teaser_paragraph=biz.get("teaser_paragraph"),
            address_street=biz["address_street"],
            address_city=biz["address_city"],
            address_state=biz["address_state"],
            address_zip=biz["address_zip"],
            address_county=biz["address_county"],
            address_full=biz["address_full"],
            website_url=biz.get("website_url"),
            phone_number=biz.get("phone_number"),
            hours=biz.get("hours"),
            ideal_for=biz.get("ideal_for"),
            payment_methods=biz.get("payment_methods"),
            business_amenities=biz.get("business_amenities"),
            pet_options=biz.get("pet_options"),
        )
        poi.business = Business(price_range=biz["price_range"])
        db.add(poi)
        db.flush()

        if biz.get("category"):
            db.execute(poi_category_association.insert().values(
                poi_id=poi.id, category_id=biz["category"].id, is_main=True
            ))

        # Images
        imgs = biz["images"]
        attach_image(db, poi.id, ImageType.main, imgs["main"], alt_text=f"{biz['name']} storefront")
        for i, key in enumerate(imgs.get("gallery", [])):
            attach_image(db, poi.id, ImageType.gallery, key, display_order=i)

        db.commit()
        print(f"  Created: {biz['name']} (slug: {poi.slug})")


def create_parks(db: Session):
    print("\n--- Parks ---")

    cat_state = get_category(db, "State Park")
    cat_municipal = get_category(db, "Municipal Park")
    cat_preserve = get_category(db, "Nature Preserve")

    parks = [
        {
            "name": "Haw River State Park",
            "slug": "haw-river-state-park-pittsboro",
            "location": "POINT(-79.1650 35.7350)",
            "description_short": "A scenic state park along the Haw River with camping, fishing, and paddling.",
            "description_long": (
                "Haw River State Park stretches along miles of the Haw River offering "
                "some of the best paddling in the Piedmont. Campsites range from walk-in "
                "tent sites to RV-friendly pads with hookups. Fish for largemouth bass "
                "and catfish from the shore or launch your canoe at the river access. "
                "Picnic shelters and a nature center make this a perfect day-trip "
                "destination for families."
            ),
            "teaser_paragraph": "Paddling, camping & fishing along the scenic Haw River.",
            "address_street": "339 Haw River Road",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "339 Haw River Road, Pittsboro, NC 27312",
            "category": cat_state,
            "hours": {
                "monday": [{"open": "07:00", "close": "21:00"}],
                "tuesday": [{"open": "07:00", "close": "21:00"}],
                "wednesday": [{"open": "07:00", "close": "21:00"}],
                "thursday": [{"open": "07:00", "close": "21:00"}],
                "friday": [{"open": "07:00", "close": "21:00"}],
                "saturday": [{"open": "07:00", "close": "21:00"}],
                "sunday": [{"open": "07:00", "close": "21:00"}],
            },
            "cost": "0",
            "images": {"main": "park1_main", "gallery": ["park1_gallery1", "park1_gallery2"]},
            "key_facilities": ["Boat Launch", "Campground", "Picnic Shelters", "Nature Center"],
            "pet_options": ["Dog Friendly", "Clean Up Stations"],
            "wheelchair_accessible": ["Accessible Bathrooms", "Paved Paths"],
            "public_toilets": ["Wheelchair Accessible"],
        },
        {
            "name": "Robeson Creek Park",
            "slug": "robeson-creek-park-pittsboro",
            "location": "POINT(-79.1830 35.7120)",
            "description_short": "A quiet municipal park with playgrounds, sports fields, and a creek-side walking path.",
            "description_long": (
                "Robeson Creek Park is Pittsboro's favorite neighborhood green space. "
                "The park features two playgrounds (toddler and ages 5-12), a basketball "
                "court, and a large multi-purpose field used for soccer and flag football. "
                "A paved walking path winds along Robeson Creek under towering oaks — "
                "perfect for a morning stroll or an after-dinner walk with the dog."
            ),
            "teaser_paragraph": "Playgrounds, sports fields & a creekside walking path.",
            "address_street": "200 Robeson Street",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "200 Robeson Street, Pittsboro, NC 27312",
            "category": cat_municipal,
            "hours": {
                "monday": [{"open": "06:00", "close": "22:00"}],
                "tuesday": [{"open": "06:00", "close": "22:00"}],
                "wednesday": [{"open": "06:00", "close": "22:00"}],
                "thursday": [{"open": "06:00", "close": "22:00"}],
                "friday": [{"open": "06:00", "close": "22:00"}],
                "saturday": [{"open": "06:00", "close": "22:00"}],
                "sunday": [{"open": "06:00", "close": "22:00"}],
            },
            "cost": "0",
            "images": {"main": "park2_main", "gallery": ["park2_gallery1"]},
            "playground_available": True,
            "playground_types": ["Toddler (0-25 months)", "Ages 5-12"],
            "playground_surface_types": ["Rubber Mulch", "Sand"],
            "key_facilities": ["Basketball Court", "Sports Fields", "Playground"],
            "pet_options": ["Dog Friendly", "Clean Up Stations"],
            "public_toilets": ["Baby Changing Station"],
        },
        {
            "name": "Chatham Mills Nature Preserve",
            "slug": "chatham-mills-nature-preserve-pittsboro",
            "location": "POINT(-79.1900 35.7180)",
            "description_short": "A 120-acre nature preserve with old-growth forest, birding trails, and a historic mill site.",
            "description_long": (
                "Chatham Mills Nature Preserve protects 120 acres of Piedmont hardwood "
                "forest along the Rocky River. The preserve is managed by the Chatham "
                "Conservation Trust and features two miles of easy hiking trails that "
                "wind through towering tulip poplars, past the ruins of an 1850s grist "
                "mill, and along the river bluffs. It's one of the best birding spots "
                "in the county — look for prothonotary warblers in spring."
            ),
            "teaser_paragraph": "Old-growth forest, historic mill ruins & top birding spot.",
            "address_street": "480 Mill Road",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "480 Mill Road, Pittsboro, NC 27312",
            "category": cat_preserve,
            "hours": {
                "monday": [{"open": "dawn", "close": "dusk"}],
                "tuesday": [{"open": "dawn", "close": "dusk"}],
                "wednesday": [{"open": "dawn", "close": "dusk"}],
                "thursday": [{"open": "dawn", "close": "dusk"}],
                "friday": [{"open": "dawn", "close": "dusk"}],
                "saturday": [{"open": "dawn", "close": "dusk"}],
                "sunday": [{"open": "dawn", "close": "dusk"}],
            },
            "cost": "0",
            "images": {"main": "park3_main", "gallery": ["park3_gallery1"]},
            "key_facilities": ["Hiking Trails", "Bird Watching", "Historic Site"],
            "pet_options": ["Dog Friendly", "Clean Up Stations"],
        },
    ]

    for p in parks:
        existing = db.query(PointOfInterest).filter(
            PointOfInterest.slug == p["slug"]
        ).first()
        if existing:
            print(f"  Skipping (exists): {p['name']}")
            continue

        poi = PointOfInterest(
            poi_type=POIType.PARK,
            name=p["name"],
            slug=p["slug"],
            listing_type="community_comped",
            publication_status="published",
            is_verified=True,
            status="Fully Open",
            location=p["location"],
            description_short=p["description_short"],
            description_long=p["description_long"],
            teaser_paragraph=p.get("teaser_paragraph"),
            address_street=p["address_street"],
            address_city=p["address_city"],
            address_state=p["address_state"],
            address_zip=p["address_zip"],
            address_county=p["address_county"],
            address_full=p["address_full"],
            hours=p.get("hours"),
            cost=p.get("cost"),
            key_facilities=p.get("key_facilities"),
            pet_options=p.get("pet_options"),
            wheelchair_accessible=p.get("wheelchair_accessible"),
            public_toilets=p.get("public_toilets"),
            playground_available=p.get("playground_available", False),
            playground_types=p.get("playground_types"),
            playground_surface_types=p.get("playground_surface_types"),
        )
        poi.park = Park(drone_usage_policy="No drones without permit")
        db.add(poi)
        db.flush()

        if p.get("category"):
            db.execute(poi_category_association.insert().values(
                poi_id=poi.id, category_id=p["category"].id, is_main=True
            ))

        imgs = p["images"]
        attach_image(db, poi.id, ImageType.main, imgs["main"], alt_text=f"{p['name']} scenic view")
        for i, key in enumerate(imgs.get("gallery", [])):
            attach_image(db, poi.id, ImageType.gallery, key, display_order=i)

        db.commit()
        print(f"  Created: {p['name']} (slug: {poi.slug})")


def create_trails(db: Session):
    print("\n--- Trails ---")

    cat_moderate = get_category(db, "Moderate")
    cat_easy = get_category(db, "Easy")
    cat_hard = get_category(db, "Hard")

    trails = [
        {
            "name": "Deep River Trail",
            "slug": "deep-river-trail-pittsboro",
            "location": "POINT(-79.1580 35.7280)",
            "description_short": "A 3.2-mile moderate loop through river-bottom forest with scenic bluff overlooks.",
            "description_long": (
                "Deep River Trail follows the banks of the Deep River through one of "
                "the most beautiful stretches of bottomland hardwood in Chatham County. "
                "The 3.2-mile loop gains about 250 feet of elevation as it climbs to "
                "a series of bluff overlooks before descending back to the river. "
                "Wildflowers carpet the forest floor in April and May. The trail is "
                "well-marked with blue blazes and maintained by the Chatham Trails "
                "Association."
            ),
            "teaser_paragraph": "Scenic 3.2-mile river loop with bluff overlooks.",
            "address_street": "Deep River Access Road",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "Deep River Access Road, Pittsboro, NC 27312",
            "category": cat_moderate,
            "trail": {
                "length_text": "3.2 miles",
                "difficulty": "moderate",
                "route_type": "loop",
                "trail_surfaces": ["Dirt", "Rock"],
                "trail_experiences": ["River Views", "Wildflowers", "Bluff Overlooks"],
            },
            "images": {"main": "trail1_main", "gallery": ["trail1_gallery1", "trail1_gallery2"]},
            "cost": "0",
            "pet_options": ["Dog Friendly", "Clean Up Stations"],
        },
        {
            "name": "Rocky River Greenway",
            "slug": "rocky-river-greenway-pittsboro",
            "location": "POINT(-79.1870 35.7150)",
            "description_short": "An easy 1.5-mile paved greenway along Rocky River — perfect for families and bikes.",
            "description_long": (
                "Rocky River Greenway is a paved multi-use path that follows the Rocky "
                "River for 1.5 miles from the Chatham Park trailhead to the Pittsboro "
                "town limits. The flat, wide surface is ideal for strollers, wheelchairs, "
                "and cyclists. Benches and interpretive signs are placed along the route. "
                "A small nature playground near the midpoint makes this a great outing "
                "for families with young children."
            ),
            "teaser_paragraph": "Flat 1.5-mile paved path perfect for families & bikes.",
            "address_street": "Chatham Park Drive",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "Chatham Park Drive, Pittsboro, NC 27312",
            "category": cat_easy,
            "trail": {
                "length_text": "1.5 miles",
                "difficulty": "easy",
                "route_type": "out_and_back",
                "trail_surfaces": ["Paved"],
                "trail_experiences": ["River Views", "Nature Playground", "Accessible"],
            },
            "images": {"main": "trail2_main", "gallery": ["trail2_gallery1"]},
            "cost": "0",
            "wheelchair_accessible": ["Paved Paths", "Accessible Parking"],
            "pet_options": ["Dog Friendly", "Clean Up Stations"],
        },
        {
            "name": "Devil's Tramping Ground Trail",
            "slug": "devils-tramping-ground-trail-siler-city",
            "location": "POINT(-79.2650 35.6800)",
            "description_short": "A challenging 4.8-mile loop through rugged terrain to a mysterious bare circle in the woods.",
            "description_long": (
                "Devil's Tramping Ground Trail leads hikers through 4.8 miles of "
                "rolling Piedmont forest to one of North Carolina's oldest mysteries — "
                "a 40-foot bare circle where nothing grows. Local legend says the devil "
                "paces here at night. The trail itself is challenging, with steep "
                "ravines, multiple creek crossings, and sections of exposed root. Bring "
                "trekking poles and sturdy boots. The trailhead has limited parking for "
                "about 10 cars."
            ),
            "teaser_paragraph": "Rugged 4.8-mile hike to NC's most mysterious bare circle.",
            "address_street": "Devil's Tramping Ground Road",
            "address_city": "Siler City",
            "address_state": "NC",
            "address_zip": "27344",
            "address_county": "Chatham County",
            "address_full": "Devil's Tramping Ground Road, Siler City, NC 27344",
            "category": cat_hard,
            "trail": {
                "length_text": "4.8 miles",
                "difficulty": "challenging",
                "route_type": "loop",
                "trail_surfaces": ["Dirt", "Rock", "Root"],
                "trail_experiences": ["Historic Site", "Creek Crossings", "Rugged Terrain"],
            },
            "images": {"main": "trail3_main", "gallery": ["trail3_gallery1"]},
            "cost": "0",
            "pet_options": ["Dog Friendly"],
        },
    ]

    for t in trails:
        existing = db.query(PointOfInterest).filter(
            PointOfInterest.slug == t["slug"]
        ).first()
        if existing:
            print(f"  Skipping (exists): {t['name']}")
            continue

        trail_data = t["trail"]
        poi = PointOfInterest(
            poi_type=POIType.TRAIL,
            name=t["name"],
            slug=t["slug"],
            listing_type="community_comped",
            publication_status="published",
            is_verified=True,
            status="Fully Open",
            location=t["location"],
            description_short=t["description_short"],
            description_long=t["description_long"],
            teaser_paragraph=t.get("teaser_paragraph"),
            address_street=t["address_street"],
            address_city=t["address_city"],
            address_state=t["address_state"],
            address_zip=t["address_zip"],
            address_county=t["address_county"],
            address_full=t["address_full"],
            cost=t.get("cost"),
            pet_options=t.get("pet_options"),
            wheelchair_accessible=t.get("wheelchair_accessible"),
        )
        poi.trail = Trail(
            length_text=trail_data["length_text"],
            difficulty=trail_data["difficulty"],
            route_type=trail_data["route_type"],
            trail_surfaces=trail_data.get("trail_surfaces"),
            trail_experiences=trail_data.get("trail_experiences"),
        )
        db.add(poi)
        db.flush()

        if t.get("category"):
            db.execute(poi_category_association.insert().values(
                poi_id=poi.id, category_id=t["category"].id, is_main=True
            ))

        imgs = t["images"]
        attach_image(db, poi.id, ImageType.main, imgs["main"], alt_text=f"{t['name']} trailhead")
        for i, key in enumerate(imgs.get("gallery", [])):
            attach_image(db, poi.id, ImageType.gallery, key, display_order=i)

        db.commit()
        print(f"  Created: {t['name']} (slug: {poi.slug})")


def create_events(db: Session):
    print("\n--- Events ---")

    cat_market = get_category(db, "Market")
    cat_festival = get_category(db, "Festival")

    now = datetime.now(timezone.utc)

    events = [
        {
            "name": "Pittsboro First Sunday",
            "slug": "pittsboro-first-sunday-pittsboro",
            "location": "POINT(-79.1770 35.7208)",
            "description_short": "Monthly outdoor market on the Pittsboro courthouse lawn with local vendors and live music.",
            "description_long": (
                "Pittsboro First Sunday is a beloved monthly tradition held on the "
                "courthouse lawn in downtown Pittsboro. Every first Sunday of the month, "
                "30+ local vendors set up booths selling produce, baked goods, crafts, "
                "and art. Live acoustic music plays throughout the afternoon. Food trucks "
                "line Hillsboro Street, and the Chatham Arts Council hosts a kid's craft "
                "table. Free admission — just show up and enjoy."
            ),
            "teaser_paragraph": "30+ local vendors, live music & food trucks monthly.",
            "address_street": "Courthouse Square",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "Courthouse Square, Pittsboro, NC 27312",
            "category": cat_market,
            "event": {
                "start_datetime": (now + timedelta(days=7)).replace(hour=11, minute=0, second=0),
                "end_datetime": (now + timedelta(days=7)).replace(hour=16, minute=0, second=0),
                "is_repeating": True,
                "repeat_pattern": {"frequency": "monthly", "day_of_month": "first_sunday"},
                "organizer_name": "Downtown Pittsboro Association",
                "venue_settings": ["Outdoor"],
            },
            "cost": "0",
            "images": {"main": "event1_main", "gallery": ["event1_gallery1"]},
            "ideal_for": ["All Ages", "Families", "For the Kids", "Pet Friendly"],
            "pet_options": ["Dog Friendly"],
        },
        {
            "name": "Chatham County Fair",
            "slug": "chatham-county-fair-pittsboro",
            "location": "POINT(-79.1700 35.7300)",
            "description_short": "Annual county fair with rides, livestock shows, a demolition derby, and fried everything.",
            "description_long": (
                "The Chatham County Fair has been a fall tradition for over 60 years. "
                "Held at the fairgrounds on US-64, the week-long event features a midway "
                "with carnival rides, a 4-H livestock exhibition, a Friday-night "
                "demolition derby, and enough fried food to last a lifetime. Gate "
                "admission is $10 for adults, $5 for kids. Ride wristbands sold "
                "separately. Don't miss the homemade pie contest on Saturday."
            ),
            "teaser_paragraph": "Rides, livestock shows, demolition derby & fried everything.",
            "address_street": "1000 US Highway 64 West",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "1000 US Highway 64 West, Pittsboro, NC 27312",
            "category": cat_festival,
            "event": {
                "start_datetime": (now + timedelta(days=30)).replace(hour=17, minute=0, second=0),
                "end_datetime": (now + timedelta(days=37)).replace(hour=22, minute=0, second=0),
                "is_repeating": False,
                "organizer_name": "Chatham County Agricultural Society",
                "venue_settings": ["Outdoor", "Indoor"],
            },
            "cost": "$10",
            "ticket_link": "https://chathamfair.example.com/tickets",
            "images": {"main": "event2_main", "gallery": ["event2_gallery1"]},
            "ideal_for": ["All Ages", "Families", "For the Kids"],
        },
        {
            "name": "Shakori Hills Music Festival",
            "slug": "shakori-hills-music-festival-pittsboro",
            "location": "POINT(-79.2100 35.7050)",
            "description_short": "A weekend grassroots music festival with four stages, camping, and community workshops.",
            "description_long": (
                "Shakori Hills GrassRoots Festival of Music & Dance is a semi-annual "
                "celebration held on 72 acres of rolling farmland south of Pittsboro. "
                "Four stages host over 30 bands spanning Americana, bluegrass, world "
                "music, and rock. Weekend passes include primitive camping, artisan "
                "vendors, a kids' village, and community workshops on everything from "
                "blacksmithing to fermentation. It's Chatham County's biggest cultural "
                "event and a rite of passage for local music lovers."
            ),
            "teaser_paragraph": "4-stage music fest with camping, workshops & 30+ bands.",
            "address_street": "1439 Henderson Tanyard Road",
            "address_city": "Pittsboro",
            "address_state": "NC",
            "address_zip": "27312",
            "address_county": "Chatham County",
            "address_full": "1439 Henderson Tanyard Road, Pittsboro, NC 27312",
            "category": cat_festival,
            "event": {
                "start_datetime": (now + timedelta(days=60)).replace(hour=12, minute=0, second=0),
                "end_datetime": (now + timedelta(days=63)).replace(hour=23, minute=0, second=0),
                "is_repeating": False,
                "organizer_name": "Shakori Hills Community Arts Center",
                "venue_settings": ["Outdoor"],
                "has_vendors": True,
                "vendor_types": ["Food", "Crafts", "Art"],
            },
            "cost": "$75-$150",
            "ticket_link": "https://shakorihills.example.com/tickets",
            "images": {"main": "event3_main", "gallery": ["event3_gallery1"]},
            "ideal_for": ["All Ages", "Families", "Ages 18+"],
        },
    ]

    for e in events:
        existing = db.query(PointOfInterest).filter(
            PointOfInterest.slug == e["slug"]
        ).first()
        if existing:
            print(f"  Skipping (exists): {e['name']}")
            continue

        evt_data = e["event"]
        poi = PointOfInterest(
            poi_type=POIType.EVENT,
            name=e["name"],
            slug=e["slug"],
            listing_type="community_comped",
            publication_status="published",
            is_verified=True,
            status="Fully Open",
            location=e["location"],
            description_short=e["description_short"],
            description_long=e["description_long"],
            teaser_paragraph=e.get("teaser_paragraph"),
            address_street=e["address_street"],
            address_city=e["address_city"],
            address_state=e["address_state"],
            address_zip=e["address_zip"],
            address_county=e["address_county"],
            address_full=e["address_full"],
            cost=e.get("cost"),
            ticket_link=e.get("ticket_link"),
            ideal_for=e.get("ideal_for"),
            pet_options=e.get("pet_options"),
        )
        poi.event = Event(
            start_datetime=evt_data["start_datetime"],
            end_datetime=evt_data.get("end_datetime"),
            is_repeating=evt_data.get("is_repeating", False),
            repeat_pattern=evt_data.get("repeat_pattern"),
            organizer_name=evt_data.get("organizer_name"),
            venue_settings=evt_data.get("venue_settings"),
            has_vendors=evt_data.get("has_vendors", False),
            vendor_types=evt_data.get("vendor_types"),
        )
        db.add(poi)
        db.flush()

        if e.get("category"):
            db.execute(poi_category_association.insert().values(
                poi_id=poi.id, category_id=e["category"].id, is_main=True
            ))

        imgs = e["images"]
        attach_image(db, poi.id, ImageType.main, imgs["main"], alt_text=f"{e['name']} event photo")
        for i, key in enumerate(imgs.get("gallery", [])):
            attach_image(db, poi.id, ImageType.gallery, key, display_order=i)

        db.commit()
        print(f"  Created: {e['name']} (slug: {poi.slug})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  Nearby Nearby — Local Dev Seed Script")
    print("=" * 60)

    db = SessionLocal()
    try:
        print("\n[1/6] Ensuring test user...")
        ensure_test_user(db)

        print("\n[2/6] Ensuring categories...")
        ensure_categories(db)

        print("\n[3/6] Creating businesses...")
        create_businesses(db)

        print("\n[4/6] Creating parks...")
        create_parks(db)

        print("\n[5/6] Creating trails...")
        create_trails(db)

        print("\n[6/6] Creating events...")
        create_events(db)

        # Summary
        total = db.query(PointOfInterest).filter(
            PointOfInterest.publication_status == "published"
        ).count()
        img_count = db.query(Image).count()

        print("\n" + "=" * 60)
        print(f"  Done! {total} published POIs, {img_count} image records")
        print("=" * 60)
        print("\nVerify at:")
        print("  - Admin panel: http://localhost:5175")
        print("  - User app:    http://localhost:8003 (dev) or http://localhost:8002 (prod)")

    except Exception as e:
        print(f"\nERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
