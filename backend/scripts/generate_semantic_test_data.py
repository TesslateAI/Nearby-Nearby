#!/usr/bin/env python3
"""
Enhanced Script to generate test data for Nearby Nearby Semantic Search Testing
Creates categories and 100 realistic POIs with diverse business types for semantic search testing
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
# Default: Chatham County, NC area (35.7796, -79.4194)
BASE_LATITUDE = 35.7796
BASE_LONGITUDE = -79.4194
RADIUS_KM = 25  # Generate POIs within 25km radius

# Enhanced business data for semantic search testing
BUSINESS_TYPES = {
    "bakery": {
        "names": [
            "Sweet Dreams Bakery", "Artisan Bread Co.", "Cupcake Corner", "Pastry Paradise",
            "Flour Power Bakery", "The Cake Shop", "Bread & Butter", "Sugar & Spice",
            "Golden Crust Bakery", "Morning Glory Pastries", "The Doughnut Hole", "Crust & Crumbs",
            "Sweet Treats Bakery", "The Bread Basket", "Cake & Bake", "Flour & Sugar"
        ],
        "descriptions": [
            "Fresh-baked breads and pastries made daily",
            "Artisan bakery specializing in sourdough and croissants",
            "Local bakery serving fresh cakes, cookies, and breads",
            "Family-owned bakery with traditional recipes"
        ]
    },
    "coffee_shop": {
        "names": [
            "Brew & Bean", "Caffeine Corner", "The Daily Grind", "Coffee Haven",
            "Bean There Done That", "Steam & Steam", "The Coffee House", "Cup of Joy",
            "Morning Brew", "The Roastery", "Coffee & Co.", "The Bean Counter",
            "Steamy Dreams", "The Coffee Spot", "Brewed Awakening", "Cafe Central"
        ],
        "descriptions": [
            "Cozy coffee shop serving locally roasted beans",
            "Artisan coffee and espresso drinks",
            "Community coffee house with fresh pastries",
            "Specialty coffee shop with organic options"
        ]
    },
    "library": {
        "names": [
            "Chatham County Library", "Pittsboro Public Library", "Siler City Library",
            "Community Learning Center", "Knowledge Hub", "The Reading Room",
            "Learning Commons", "Public Library", "Community Library", "Town Library"
        ],
        "descriptions": [
            "Public library with extensive book collection and study spaces",
            "Community library offering books, digital resources, and programs",
            "Public library with children's programs and computer access",
            "Local library serving the community with educational resources"
        ]
    },
    "restaurant": {
        "names": [
            "The Local Diner", "Farm to Table", "Southern Comfort", "The Blue Plate",
            "Kitchen Table", "The Corner Cafe", "Main Street Grill", "The Hungry Horse",
            "Country Kitchen", "The Lunch Box", "Dinner Bell", "The Food Stop",
            "Home Cooking", "The Eatery", "Local Flavors", "The Dining Room"
        ],
        "descriptions": [
            "Local restaurant serving Southern comfort food",
            "Farm-to-table restaurant with fresh local ingredients",
            "Family-owned restaurant with traditional recipes",
            "Casual dining with homemade specialties"
        ]
    },
    "grocery_store": {
        "names": [
            "Fresh Market", "Local Grocery", "The Food Store", "Community Market",
            "Fresh & Local", "The Grocery", "Market Place", "Food Mart",
            "Local Foods", "The Market", "Fresh Foods", "Community Grocery"
        ],
        "descriptions": [
            "Local grocery store with fresh produce and essentials",
            "Community market with local and organic products",
            "Full-service grocery store serving the community",
            "Local food market with fresh ingredients"
        ]
    },
    "pharmacy": {
        "names": [
            "Community Pharmacy", "Local Drug Store", "The Medicine Cabinet", "Health Mart",
            "Family Pharmacy", "The Drug Store", "Health & Wellness", "Pharmacy Plus",
            "Local Pharmacy", "The Medicine Shop", "Health Store", "Community Drug"
        ],
        "descriptions": [
            "Local pharmacy with prescription services and health products",
            "Community pharmacy serving healthcare needs",
            "Full-service pharmacy with health consultations",
            "Local drug store with prescription and over-the-counter medications"
        ]
    },
    "hardware_store": {
        "names": [
            "Ace Hardware", "Local Hardware", "The Tool Box", "Hardware Plus",
            "Community Hardware", "The Hardware Store", "Tool & Supply", "Hardware Mart",
            "Local Tools", "The Tool Store", "Hardware & More", "Community Tools"
        ],
        "descriptions": [
            "Local hardware store with tools and building supplies",
            "Full-service hardware store for home improvement",
            "Community hardware store with expert advice",
            "Local tool and supply store for DIY projects"
        ]
    },
    "gas_station": {
        "names": [
            "Quick Stop", "Gas & Go", "The Fuel Stop", "Express Mart",
            "Speedway", "Gas Station", "Quick Mart", "The Stop",
            "Fuel Express", "Gas & Shop", "Quick Fuel", "The Gas Stop"
        ],
        "descriptions": [
            "Convenient gas station with snacks and essentials",
            "Full-service gas station with convenience store",
            "Quick stop for fuel and basic supplies",
            "Local gas station serving the community"
        ]
    },
    "bank": {
        "names": [
            "First National Bank", "Community Bank", "Local Credit Union", "The Bank",
            "Trust Bank", "Community Trust", "Local Bank", "The Credit Union",
            "First Community", "Local Trust", "Community First", "The Local Bank"
        ],
        "descriptions": [
            "Local bank serving personal and business banking needs",
            "Community bank with personal service and local focus",
            "Credit union serving members with financial services",
            "Local financial institution with community focus"
        ]
    },
    "post_office": {
        "names": [
            "Pittsboro Post Office", "Siler City Post Office", "Chatham Post Office",
            "Local Post Office", "Community Post Office", "The Post Office",
            "Mail Center", "Postal Service", "Local Mail", "Community Mail"
        ],
        "descriptions": [
            "US Post Office serving mail and package needs",
            "Local post office with shipping and mailing services",
            "Community post office for mail and package delivery",
            "Postal service location serving the area"
        ]
    }
}

PARK_NAMES = [
    "Chatham Park", "Pittsboro Community Park", "Siler City Park", "Jordan Lake State Park",
    "Fearrington Park", "Bynum Park", "Goldston Park", "Moncure Park",
    "Bennett Park", "Community Park", "Riverside Park", "Central Park",
    "Memorial Park", "Town Park", "Local Park", "Neighborhood Park"
]

TRAIL_NAMES = [
    "Jordan Lake Trail", "Haw River Trail", "Chatham Trails", "Pittsboro Greenway",
    "Siler City Trail", "Bynum Trail", "Goldston Trail", "Moncure Trail",
    "Riverside Trail", "Forest Trail", "Nature Trail", "Walking Trail",
    "Hiking Trail", "Community Trail", "Local Trail", "Park Trail"
]

EVENT_NAMES = [
    "Chatham County Fair", "Pittsboro Farmers Market", "Siler City Festival", "Local Art Show",
    "Community Concert", "Food Truck Rally", "Craft Fair", "Music Festival",
    "Local Market", "Community Event", "Town Festival", "Local Fair",
    "Art Festival", "Music in the Park", "Community Day", "Local Celebration"
]

STREET_NAMES = [
    "Main Street", "Oak Avenue", "Pine Street", "Elm Drive", "Maple Road",
    "Cedar Lane", "Birch Boulevard", "Willow Way", "Cherry Street", "Apple Avenue",
    "Peach Drive", "Orange Road", "Lemon Street", "Lime Avenue", "Grape Drive",
    "Strawberry Lane", "Blueberry Way", "Raspberry Street", "Blackberry Avenue",
    "Cranberry Drive", "Hillsboro Street", "Chatham Street", "Pittsboro Road"
]

CITY_NAMES = ["Pittsboro", "Siler City", "Goldston", "Moncure", "Bynum", "Fearrington"]

# Enhanced categories for semantic search testing
CATEGORIES_DATA = [
    {"name": "Bakeries", "slug": "bakeries", "applicable_to": ["BUSINESS"]},
    {"name": "Coffee Shops", "slug": "coffee-shops", "applicable_to": ["BUSINESS"]},
    {"name": "Libraries", "slug": "libraries", "applicable_to": ["BUSINESS"]},
    {"name": "Restaurants", "slug": "restaurants", "applicable_to": ["BUSINESS"]},
    {"name": "Grocery Stores", "slug": "grocery-stores", "applicable_to": ["BUSINESS"]},
    {"name": "Pharmacies", "slug": "pharmacies", "applicable_to": ["BUSINESS"]},
    {"name": "Hardware Stores", "slug": "hardware-stores", "applicable_to": ["BUSINESS"]},
    {"name": "Gas Stations", "slug": "gas-stations", "applicable_to": ["BUSINESS"]},
    {"name": "Banks", "slug": "banks", "applicable_to": ["BUSINESS"]},
    {"name": "Post Offices", "slug": "post-offices", "applicable_to": ["BUSINESS"]},
    {"name": "Parks & Recreation", "slug": "parks-recreation", "applicable_to": ["PARK", "TRAIL"]},
    {"name": "Hiking Trails", "slug": "hiking-trails", "applicable_to": ["TRAIL"]},
    {"name": "Events", "slug": "events", "applicable_to": ["EVENT"]},
    {"name": "Family Friendly", "slug": "family-friendly", "applicable_to": ["BUSINESS", "PARK", "EVENT"]},
    {"name": "Pet Friendly", "slug": "pet-friendly", "applicable_to": ["BUSINESS", "PARK"]},
    {"name": "Wheelchair Accessible", "slug": "wheelchair-accessible", "applicable_to": ["BUSINESS", "PARK", "TRAIL"]},
    {"name": "Free WiFi", "slug": "free-wifi", "applicable_to": ["BUSINESS"]},
    {"name": "Outdoor Seating", "slug": "outdoor-seating", "applicable_to": ["BUSINESS", "PARK"]},
    {"name": "Public Services", "slug": "public-services", "applicable_to": ["BUSINESS"]},
    {"name": "Local Businesses", "slug": "local-businesses", "applicable_to": ["BUSINESS"]}
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

def create_business_poi(db: Session, categories: Dict[str, Category], business_type: str, index: int) -> PointOfInterest:
    """Create a business POI of specific type"""
    lat, lon = generate_random_coordinates(BASE_LATITUDE, BASE_LONGITUDE, RADIUS_KM)
    
    business_data = BUSINESS_TYPES[business_type]
    name = random.choice(business_data["names"])
    description = random.choice(business_data["descriptions"])
    
    street_num = random.randint(100, 9999)
    street_name = random.choice(STREET_NAMES)
    city = random.choice(CITY_NAMES)
    cleaned_name = name.lower().replace(' ', '').replace("'", '').replace('&', '')
    
    poi = PointOfInterest(
        poi_type=POIType.BUSINESS,
        name=name,
        description_short=description,
        description_long=f"{name} is a well-established {business_type.replace('_', ' ')} in {city} that serves the local community with quality products and services. {description}",
        address_full=f"{street_num} {street_name}, {city}, NC",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="NC",
        address_zip=f"27{random.randint(100, 999)}",
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
    
    # Add appropriate categories based on business type
    if business_type == "bakery":
        poi.categories.append(categories["bakeries"])
    elif business_type == "coffee_shop":
        poi.categories.append(categories["coffee-shops"])
    elif business_type == "library":
        poi.categories.append(categories["libraries"])
        poi.categories.append(categories["public-services"])
    elif business_type == "restaurant":
        poi.categories.append(categories["restaurants"])
    elif business_type == "grocery_store":
        poi.categories.append(categories["grocery-stores"])
    elif business_type == "pharmacy":
        poi.categories.append(categories["pharmacies"])
        poi.categories.append(categories["public-services"])
    elif business_type == "hardware_store":
        poi.categories.append(categories["hardware-stores"])
    elif business_type == "gas_station":
        poi.categories.append(categories["gas-stations"])
    elif business_type == "bank":
        poi.categories.append(categories["banks"])
        poi.categories.append(categories["public-services"])
    elif business_type == "post_office":
        poi.categories.append(categories["post-offices"])
        poi.categories.append(categories["public-services"])
    
    # Add local business category to all businesses
    poi.categories.append(categories["local-businesses"])
    
    # Add some random additional categories
    if random.random() < 0.3:
        poi.categories.append(categories["family-friendly"])
    if random.random() < 0.2:
        poi.categories.append(categories["free-wifi"])
    if random.random() < 0.2:
        poi.categories.append(categories["outdoor-seating"])
    if random.random() < 0.8:
        poi.categories.append(categories["wheelchair-accessible"])
    
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
        address_full=f"{street_num} {street_name}, {city}, NC",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="NC",
        address_zip=f"27{random.randint(100, 999)}",
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
        address_full=f"{street_num} {street_name}, {city}, NC",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="NC",
        address_zip=f"27{random.randint(100, 999)}",
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
        address_full=f"{street_num} {street_name}, {city}, NC",
        address_street=f"{street_num} {street_name}",
        address_city=city,
        address_state="NC",
        address_zip=f"27{random.randint(100, 999)}",
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
    poi.categories.append(categories["family-friendly"])
    
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
    """Main function to generate test data for semantic search testing"""
    print("🚀 Starting enhanced test data generation for semantic search testing...")
    print(f"📍 Location: {BASE_LATITUDE}, {BASE_LONGITUDE} (within {RADIUS_KM}km radius)")
    
    db = SessionLocal()
    try:
        # Create categories
        print("📂 Creating categories...")
        categories = create_categories(db)
        print(f"✅ Created {len(categories)} categories")
        
        # Generate POIs with specific business type distribution
        print("🏢 Generating POIs for semantic search testing...")
        
        # Define the distribution of business types for testing
        business_distribution = {
            "bakery": 8,        # 8 bakeries
            "coffee_shop": 10,  # 10 coffee shops
            "library": 5,       # 5 libraries
            "restaurant": 12,   # 12 restaurants
            "grocery_store": 8, # 8 grocery stores
            "pharmacy": 6,      # 6 pharmacies
            "hardware_store": 6, # 6 hardware stores
            "gas_station": 8,   # 8 gas stations
            "bank": 5,          # 5 banks
            "post_office": 4,   # 4 post offices
            "park": 10,         # 10 parks
            "trail": 8,         # 8 trails
            "event": 10         # 10 events
        }
        
        total_pois = sum(business_distribution.values())
        print(f"📊 Will create {total_pois} POIs with the following distribution:")
        for business_type, count in business_distribution.items():
            print(f"   - {business_type}: {count}")
        
        poi_count = 0
        
        # Create businesses by type
        for business_type, count in business_distribution.items():
            if business_type in ["park", "trail", "event"]:
                continue  # Handle these separately
            
            for i in range(count):
                poi = create_business_poi(db, categories, business_type, poi_count)
                poi_count += 1
                print(f"✅ Created {business_type}: {poi.name}")
        
        # Create parks
        for i in range(business_distribution["park"]):
            poi = create_park_poi(db, categories, poi_count)
            poi_count += 1
            print(f"✅ Created park: {poi.name}")
        
        # Create trails
        for i in range(business_distribution["trail"]):
            poi = create_trail_poi(db, categories, poi_count)
            poi_count += 1
            print(f"✅ Created trail: {poi.name}")
        
        # Create events
        for i in range(business_distribution["event"]):
            poi = create_event_poi(db, categories, poi_count)
            poi_count += 1
            print(f"✅ Created event: {poi.name}")
        
        db.commit()
        print(f"\n🎉 Successfully created {total_pois} POIs for semantic search testing!")
        print(f"📍 Location: {BASE_LATITUDE}, {BASE_LONGITUDE} (within {RADIUS_KM}km radius)")
        print("\n🔍 You can now test semantic search with queries like:")
        print("   - 'bakeries near me'")
        print("   - 'coffee shops'")
        print("   - 'libraries'")
        print("   - 'parks'")
        print("   - 'restaurants'")
        print("   - 'grocery stores'")
        print("   - 'pharmacies'")
        print("   - 'hardware stores'")
        print("   - 'gas stations'")
        print("   - 'banks'")
        print("   - 'post offices'")
        print("   - 'hiking trails'")
        print("   - 'events'")
        
    except Exception as e:
        print(f"❌ Error generating test data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main() 