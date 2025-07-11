#!/usr/bin/env python3
"""
Script to generate test data for Nearby Nearby
Creates categories and 100 realistic POIs near a specified location
"""

import sys
import os
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
import math

# Add the parent directory (backend) to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_GeomFromText
from app.database import SessionLocal
from app.models.poi import PointOfInterest, POIType, Business, Park, Trail, Event
from app.models.category import Category

# Configuration - MODIFY THESE COORDINATES FOR YOUR LOCATION
# Default: San Francisco area (37.7749, -122.4194)
BASE_LATITUDE = 37.7749
BASE_LONGITUDE = -122.4194
RADIUS_KM = 10  # Generate POIs within 10km radius

# Sample data for generating realistic POIs
BUSINESS_NAMES = [
    "Joe's Coffee Shop", "Maria's Tacos", "Golden Gate Pizza", "Tech Startup Hub",
    "Green Earth Market", "Blue Ocean Seafood", "Sunset Bakery", "Downtown Deli",
    "Artisan Craft Store", "Modern Fitness Center", "Vintage Bookstore", "Organic Grocery",
    "Local Brewery", "Sushi Master", "Italian Trattoria", "Burger Joint", "Thai Palace",
    "Mexican Cantina", "Indian Spice", "French Bistro", "Greek Taverna", "Korean BBQ",
    "Vietnamese Pho", "Mediterranean Grill", "American Diner", "Chinese Restaurant",
    "Japanese Ramen", "Spanish Tapas", "Brazilian Steakhouse", "Ethiopian Cuisine"
]

PARK_NAMES = [
    "Central Park", "Riverside Gardens", "Sunset Meadows", "Oak Hill Park",
    "Marina Green", "Golden Gate Park", "Presidio Heights", "Mission Bay Park",
    "Alamo Square", "Dolores Park", "Buena Vista Park", "Lafayette Park",
    "Washington Square", "Union Square", "Civic Center Plaza", "Embarcadero Plaza",
    "Justin Herman Plaza", "Yerba Buena Gardens", "South Park", "Portsmouth Square"
]

TRAIL_NAMES = [
    "Coastal Trail", "Mountain View Path", "Forest Loop", "Riverside Walk",
    "Sunset Boulevard Trail", "Golden Gate Bridge Walk", "Presidio Trail",
    "Lands End Trail", "Mount Davidson Trail", "Twin Peaks Trail",
    "Bernal Heights Trail", "Glen Canyon Trail", "McLaren Park Trail",
    "Stern Grove Trail", "Golden Gate Park Trails", "Crissy Field Trail",
    "Baker Beach Trail", "Fort Point Trail", "Angel Island Trail", "Alcatraz Trail"
]

EVENT_NAMES = [
    "Summer Music Festival", "Food Truck Rally", "Art Walk", "Farmers Market",
    "Wine Tasting Event", "Beer Festival", "Comic Con", "Tech Conference",
    "Fashion Show", "Dance Performance", "Theater Production", "Poetry Reading",
    "Book Signing", "Cooking Class", "Yoga Workshop", "Photography Exhibition",
    "Craft Fair", "Antique Show", "Car Show", "Pet Adoption Day"
]

STREET_NAMES = [
    "Main Street", "Oak Avenue", "Pine Street", "Elm Drive", "Maple Road",
    "Cedar Lane", "Birch Boulevard", "Willow Way", "Cherry Street", "Apple Avenue",
    "Peach Drive", "Orange Road", "Lemon Street", "Lime Avenue", "Grape Drive",
    "Strawberry Lane", "Blueberry Way", "Raspberry Street", "Blackberry Avenue",
    "Cranberry Drive"
]

CITY_NAMES = ["San Francisco", "Oakland", "Berkeley", "San Mateo", "Redwood City"]

CATEGORIES_DATA = [
    {"name": "Restaurants", "slug": "restaurants", "applicable_to": ["BUSINESS"]},
    {"name": "Coffee Shops", "slug": "coffee-shops", "applicable_to": ["BUSINESS"]},
    {"name": "Bars & Pubs", "slug": "bars-pubs", "applicable_to": ["BUSINESS"]},
    {"name": "Shopping", "slug": "shopping", "applicable_to": ["BUSINESS"]},
    {"name": "Entertainment", "slug": "entertainment", "applicable_to": ["BUSINESS", "EVENT"]},
    {"name": "Fitness & Sports", "slug": "fitness-sports", "applicable_to": ["BUSINESS", "PARK"]},
    {"name": "Parks & Recreation", "slug": "parks-recreation", "applicable_to": ["PARK", "TRAIL"]},
    {"name": "Hiking Trails", "slug": "hiking-trails", "applicable_to": ["TRAIL"]},
    {"name": "Events", "slug": "events", "applicable_to": ["EVENT"]},
    {"name": "Cultural", "slug": "cultural", "applicable_to": ["BUSINESS", "EVENT", "PARK"]},
    {"name": "Family Friendly", "slug": "family-friendly", "applicable_to": ["BUSINESS", "PARK", "EVENT"]},
    {"name": "Pet Friendly", "slug": "pet-friendly", "applicable_to": ["BUSINESS", "PARK"]},
    {"name": "Wheelchair Accessible", "slug": "wheelchair-accessible", "applicable_to": ["BUSINESS", "PARK", "TRAIL"]},
    {"name": "Free WiFi", "slug": "free-wifi", "applicable_to": ["BUSINESS"]},
    {"name": "Outdoor Seating", "slug": "outdoor-seating", "applicable_to": ["BUSINESS", "PARK"]},
    {"name": "Live Music", "slug": "live-music", "applicable_to": ["BUSINESS", "EVENT"]},
    {"name": "Art Galleries", "slug": "art-galleries", "applicable_to": ["BUSINESS"]},
    {"name": "Museums", "slug": "museums", "applicable_to": ["BUSINESS"]},
    {"name": "Libraries", "slug": "libraries", "applicable_to": ["BUSINESS"]},
    {"name": "Schools", "slug": "schools", "applicable_to": ["BUSINESS"]}
]

def generate_random_coordinates(base_lat: float, base_lon: float, radius_km: float) -> tuple:
    """Generate random coordinates within a radius of the base point"""
    # Convert radius from km to degrees (approximate)
    radius_deg = radius_km / 111.0
    
    # Generate random angle and distance
    angle = random.uniform(0, 2 * math.pi)
    distance = random.uniform(0, radius_deg)
    
    # Calculate new coordinates
    lat = base_lat + distance * math.cos(angle)
    lon = base_lon + distance * math.sin(angle)
    
    return lat, lon

def create_categories(db: Session) -> Dict[str, Category]:
    """Create categories and return a mapping of slug to category"""
    categories = {}
    
    for cat_data in CATEGORIES_DATA:
        # Check if category already exists
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if existing:
            categories[cat_data["slug"]] = existing
            continue
            
        category = Category(
            name=cat_data["name"],
            slug=cat_data["slug"],
            applicable_to=cat_data["applicable_to"],
            is_active=True
        )
        db.add(category)
        categories[cat_data["slug"]] = category
    
    db.commit()
    return categories

def create_business_poi(db: Session, categories: Dict[str, Category], index: int) -> PointOfInterest:
    """Create a business POI"""
    lat, lon = generate_random_coordinates(BASE_LATITUDE, BASE_LONGITUDE, RADIUS_KM)
    
    name = random.choice(BUSINESS_NAMES)
    street_num = random.randint(100, 9999)
    street_name = random.choice(STREET_NAMES)
    city = random.choice(CITY_NAMES)
    cleaned_name = name.lower().replace(' ', '').replace("'", '')
    
    poi = PointOfInterest(
        poi_type=POIType.BUSINESS,
        name=name,
        description_short=f"A popular {name.lower()} in {city}",
        description_long=f"{name} is a well-known establishment in {city} that serves the local community with quality products and services.",
        address_full=f"{street_num} {street_name}, {city}, CA",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="CA",
        address_zip=f"94{random.randint(100, 999)}",
        location=ST_GeomFromText(f'POINT({lon} {lat})'),
        status="Fully Open",
        website_url=f"https://www.{cleaned_name}.com",
        phone_number=f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
        photos={"featured": f"https://example.com/photos/{name.lower().replace(' ', '_')}.jpg"},
        hours={
            "monday": [{"open": "09:00", "close": "17:00"}],
            "tuesday": [{"open": "09:00", "close": "17:00"}],
            "wednesday": [{"open": "09:00", "close": "17:00"}],
            "thursday": [{"open": "09:00", "close": "17:00"}],
            "friday": [{"open": "09:00", "close": "18:00"}],
            "saturday": [{"open": "10:00", "close": "16:00"}],
            "sunday": [{"open": "11:00", "close": "15:00"}]
        },
        amenities={
            "payment_methods": random.choice([["Cash", "Credit Card"], ["Cash", "Credit Card", "Apple Pay"], ["Credit Card Only"]]),
            "ideal_for": random.choice([["Families"], ["Couples"], ["Friends"], ["Business"], ["Everyone"]])
        }
    )
    
    # Add appropriate categories
    if "restaurant" in name.lower() or "cafe" in name.lower() or "coffee" in name.lower():
        poi.categories.append(categories["restaurants"])
    elif "coffee" in name.lower():
        poi.categories.append(categories["coffee-shops"])
    else:
        poi.categories.append(categories["shopping"])
    
    # Add some random additional categories
    if random.random() < 0.3:
        poi.categories.append(categories["family-friendly"])
    if random.random() < 0.2:
        poi.categories.append(categories["free-wifi"])
    if random.random() < 0.2:
        poi.categories.append(categories["outdoor-seating"])
    
    db.add(poi)
    db.flush()  # Get the ID
    
    # Create business record
    business = Business(
        poi_id=poi.id,
        listing_tier=random.choice(["free", "paid", "paid_founding"]),
        price_range=random.choice(["$", "$$", "$$$"])
    )
    db.add(business)
    
    return poi

def create_park_poi(db: Session, categories: Dict[str, Category], index: int) -> PointOfInterest:
    """Create a park POI"""
    lat, lon = generate_random_coordinates(BASE_LATITUDE, BASE_LONGITUDE, RADIUS_KM)
    
    name = random.choice(PARK_NAMES)
    street_num = random.randint(100, 9999)
    street_name = random.choice(STREET_NAMES)
    city = random.choice(CITY_NAMES)
    
    poi = PointOfInterest(
        poi_type=POIType.PARK,
        name=name,
        description_short=f"A beautiful park in {city}",
        description_long=f"{name} is a scenic park in {city} offering green spaces, walking paths, and recreational facilities for the community.",
        address_full=f"{street_num} {street_name}, {city}, CA",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="CA",
        address_zip=f"94{random.randint(100, 999)}",
        location=ST_GeomFromText(f'POINT({lon} {lat})'),
        status="Fully Open",
        photos={"featured": f"https://example.com/photos/{name.lower().replace(' ', '_')}.jpg"},
        hours={
            "monday": [{"open": "06:00", "close": "22:00"}],
            "tuesday": [{"open": "06:00", "close": "22:00"}],
            "wednesday": [{"open": "06:00", "close": "22:00"}],
            "thursday": [{"open": "06:00", "close": "22:00"}],
            "friday": [{"open": "06:00", "close": "22:00"}],
            "saturday": [{"open": "06:00", "close": "22:00"}],
            "sunday": [{"open": "06:00", "close": "22:00"}]
        },
        amenities={
            "features": random.choice([["Playground", "Picnic Tables"], ["Walking Trails", "Dog Park"], ["Basketball Court", "Tennis Courts"], ["Fishing Pond", "Boat Launch"]]),
            "ideal_for": ["Families", "Outdoor Enthusiasts", "Pet Owners"]
        }
    )
    
    # Add categories
    poi.categories.append(categories["parks-recreation"])
    poi.categories.append(categories["family-friendly"])
    if random.random() < 0.7:
        poi.categories.append(categories["pet-friendly"])
    if random.random() < 0.8:
        poi.categories.append(categories["wheelchair-accessible"])
    
    db.add(poi)
    db.flush()
    
    # Create park record
    park = Park(
        poi_id=poi.id,
        drone_usage_policy=random.choice(["Allowed", "Restricted", "Prohibited"])
    )
    db.add(park)
    
    return poi

def create_trail_poi(db: Session, categories: Dict[str, Category], index: int) -> PointOfInterest:
    """Create a trail POI"""
    lat, lon = generate_random_coordinates(BASE_LATITUDE, BASE_LONGITUDE, RADIUS_KM)
    
    name = random.choice(TRAIL_NAMES)
    street_num = random.randint(100, 9999)
    street_name = random.choice(STREET_NAMES)
    city = random.choice(CITY_NAMES)
    
    poi = PointOfInterest(
        poi_type=POIType.TRAIL,
        name=name,
        description_short=f"A scenic trail in {city}",
        description_long=f"{name} offers beautiful views and a great hiking experience in {city}. Perfect for outdoor enthusiasts and nature lovers.",
        address_full=f"{street_num} {street_name}, {city}, CA",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="CA",
        address_zip=f"94{random.randint(100, 999)}",
        location=ST_GeomFromText(f'POINT({lon} {lat})'),
        status="Fully Open",
        photos={"featured": f"https://example.com/photos/{name.lower().replace(' ', '_')}.jpg"},
        hours={
            "monday": [{"open": "06:00", "close": "20:00"}],
            "tuesday": [{"open": "06:00", "close": "20:00"}],
            "wednesday": [{"open": "06:00", "close": "20:00"}],
            "thursday": [{"open": "06:00", "close": "20:00"}],
            "friday": [{"open": "06:00", "close": "20:00"}],
            "saturday": [{"open": "06:00", "close": "20:00"}],
            "sunday": [{"open": "06:00", "close": "20:00"}]
        },
        amenities={
            "features": random.choice([["Scenic Views", "Wildlife"], ["Water Features", "Rock Formations"], ["Forest Cover", "Meadows"], ["Coastal Views", "Beach Access"]]),
            "ideal_for": ["Hikers", "Nature Enthusiasts", "Photographers"]
        }
    )
    
    # Add categories
    poi.categories.append(categories["hiking-trails"])
    poi.categories.append(categories["parks-recreation"])
    if random.random() < 0.6:
        poi.categories.append(categories["wheelchair-accessible"])
    
    db.add(poi)
    db.flush()
    
    # Create trail record
    trail = Trail(
        poi_id=poi.id,
        length_text=f"{random.randint(1, 10)}.{random.randint(0, 9)} miles",
        difficulty=random.choice(["easy", "moderate", "difficult"]),
        route_type=random.choice(["loop", "out_and_back", "point_to_point"])
    )
    db.add(trail)
    
    return poi

def create_event_poi(db: Session, categories: Dict[str, Category], index: int) -> PointOfInterest:
    """Create an event POI"""
    lat, lon = generate_random_coordinates(BASE_LATITUDE, BASE_LONGITUDE, RADIUS_KM)
    
    name = random.choice(EVENT_NAMES)
    street_num = random.randint(100, 9999)
    street_name = random.choice(STREET_NAMES)
    city = random.choice(CITY_NAMES)
    
    # Generate future event dates
    start_date = datetime.now() + timedelta(days=random.randint(1, 90))
    end_date = start_date + timedelta(hours=random.randint(2, 8))
    
    poi = PointOfInterest(
        poi_type=POIType.EVENT,
        name=name,
        description_short=f"An exciting event in {city}",
        description_long=f"{name} is a must-attend event in {city} featuring entertainment, activities, and community engagement.",
        address_full=f"{street_num} {street_name}, {city}, CA",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="CA",
        address_zip=f"94{random.randint(100, 999)}",
        location=ST_GeomFromText(f'POINT({lon} {lat})'),
        status="Fully Open",
        photos={"featured": f"https://example.com/photos/{name.lower().replace(' ', '_')}.jpg"},
        hours={
            "event_day": [{"open": start_date.strftime("%H:%M"), "close": end_date.strftime("%H:%M")}]
        },
        amenities={
            "features": random.choice([["Live Music", "Food Vendors"], ["Art Exhibits", "Workshops"], ["Games", "Activities"], ["Networking", "Presentations"]]),
            "ideal_for": ["Everyone", "Families", "Professionals"]
        }
    )
    
    # Add categories
    poi.categories.append(categories["events"])
    poi.categories.append(categories["entertainment"])
    if random.random() < 0.7:
        poi.categories.append(categories["family-friendly"])
    if random.random() < 0.3:
        poi.categories.append(categories["cultural"])
    
    db.add(poi)
    db.flush()
    
    # Create event record
    event = Event(
        poi_id=poi.id,
        start_datetime=start_date,
        end_datetime=end_date,
        cost_text=random.choice(["Free", "$10", "$25", "$50", "Donation suggested"])
    )
    db.add(event)
    
    return poi

def main():
    """Main function to generate test data"""
    print("🚀 Starting test data generation...")
    
    db = SessionLocal()
    try:
        # Create categories
        print("📂 Creating categories...")
        categories = create_categories(db)
        print(f"✅ Created {len(categories)} categories")
        
        # Generate POIs
        print("🏢 Generating POIs...")
        poi_types = [POIType.BUSINESS, POIType.PARK, POIType.TRAIL, POIType.EVENT]
        
        for i in range(100):
            poi_type = random.choice(poi_types)
            
            if poi_type == POIType.BUSINESS:
                poi = create_business_poi(db, categories, i)
            elif poi_type == POIType.PARK:
                poi = create_park_poi(db, categories, i)
            elif poi_type == POIType.TRAIL:
                poi = create_trail_poi(db, categories, i)
            elif poi_type == POIType.EVENT:
                poi = create_event_poi(db, categories, i)
            
            if (i + 1) % 10 == 0:
                print(f"✅ Created {i + 1} POIs...")
        
        db.commit()
        print(f"🎉 Successfully created 100 POIs!")
        print(f"📍 Location: {BASE_LATITUDE}, {BASE_LONGITUDE} (within {RADIUS_KM}km radius)")
        print("🌐 You can now test the search functionality!")
        
    except Exception as e:
        print(f"❌ Error generating test data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main() 