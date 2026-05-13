"""Python source of truth for field option lists.

These mirror the values in nearby-admin/frontend/src/utils/constants.js.
Backend validation and future API serving can use these directly.
"""

# ============================================================================
# Phase 1 (May Launch) — NEW / REPLACED constants
# ============================================================================

ARRIVAL_METHOD_OPTIONS = [
    "Bike-In Access",
    "Boat Access",
    "Dedicated Parking On Site",
    "Gate Access + Controlled Entry",
    "Nearby Public Parking",
    "Public Transit",
    "Roadside Pull-Off",
    "Shuttle + Drop-Off",
    "Street Parking",
]

LISTING_TYPES = [
    {"value": "free", "label": "Free Listing"},
    {"value": "paid", "label": "Paid Listing"},
    {"value": "paid_founding", "label": "Paid – Founding"},
    {"value": "community_comped", "label": "Community-Comped"},
]

SPONSOR_LEVEL_OPTIONS = [
    {"value": "platform", "label": "Platform"},
    {"value": "state", "label": "State"},
    {"value": "county", "label": "County"},
    {"value": "town", "label": "Town"},
]

# REPLACED — 24 values (supersedes prior 15)
PARKING_OPTIONS = [
    "Accessible Parking",
    "ATV + UTV Trailer Parking",
    "Bike Rack + Bicycle Parking",
    "Boat Trailer Parking",
    "Bus + Charter Bus Parking",
    "Carpool + Rideshare Parking",
    "Day Use Only (no overnight parking)",
    "Dedicated On-Site Parking Lot",
    "Garage",
    "Horse Trailer Parking",
    "Motorcycle + Motorbike Parking",
    "Nearby Public Parking Lot",
    "Overflow Parking",
    "Overnight Parking Permitted",
    "Oversized + Wide Load Vehicle",
    "Pull-Through Parking",
    "RV Parking (parking only — no hookups)",
    "Seasonal Parking Only",
    "Semi Truck + 18 Wheeler (cab and trailer)",
    "Semi Truck Cab Only (no trailer)",
    "Street Parking",
    "Trailer Parking — General",
    "Unpaved + Gravel Parking",
    "Valet Parking",
]

PARKING_ADA_CHECKLIST = [
    "Dedicated accessible parking spaces on site",
    "Accessible spaces closest to main entrance",
    "Van accessible space available (8 foot access aisle)",
    "Accessible parking within reasonable distance",
    "Accessible route from parking to main entrance",
    "Accessible parking on firm stable surface",
]

# REPLACED — 17 values
PAYMENT_METHODS = [
    "Cash",
    "Check",
    "Online Payments",
    "Credit Cards",
    "Coin Operated",
    "Apple Pay",
    "Google Pay",
    "Samsung Pay",
    "Cryptocurrency",
    "Contactless Payments",
    "PayPal",
    "Venmo",
    "Zelle",
    "Payment Plans",
    "Fee Station + Self-Pay Envelope",
    "Varies with Vendors",
    "Once Entered there is no place to spend money",
]

# REPLACED — 26 values
DISCOUNT_TYPES = [
    "AAA Members",
    "AARP Members",
    "Access Pass Holders",
    "Active Duty Military",
    "Military Veteran",
    "Annual Pass Holder",
    "Children Free (age specified in notes)",
    "EMT",
    "Farmers",
    "Fire + Firefighter",
    "First Responder",
    "Golden Years (55+)",
    "Senior Discount (65+)",
    "Group Discount (10+)",
    "Healthcare Workers",
    "Homeschool Groups",
    "Local Resident + In-County Discount",
    "National Park Pass Holders",
    "Nonprofit + Organization Discount",
    "Police",
    "Season Pass Holder",
    "State Park Pass Holders",
    "Student",
    "Teacher",
    "Tribal Members",
    "Youth Discount",
]

# REPLACED — 3 values
WIFI_OPTIONS = [
    "Free Wifi",
    "Paid Wifi",
    "No Public Wifi",
]

CELL_SERVICE_OPTIONS = [
    "Good",
    "Limited",
    "Unknown",
    "None",
]

AMENITIES_GENERAL = [
    "ATM",
    "Baby Changing Station",
    "Benches",
    "Bike Rack",
    "Bike Repair Station",
    "Bottle Filling Station",
    "Bug Spray Station",
    "Bulletin Board + Community Board",
    "Campfire Ring + Fire Pit",
    "Chargepoint Station + EV Charging",
    "Coat Check",
    "Covered Shelter + Pavilion",
    "Covered Trail Shelter",
    "Drinking Fountain",
    "Drinking Fountain At Trailhead",
    "Drinking Fountain On Trail",
    "Elevator",
    "Emergency Phone + Call Box",
    "First Aid Station",
    "Flag Pole",
    "Grill + BBQ",
    "Handicap Accessible Entrance",
    "Hand Sanitizer Station",
    "Information Kiosk + Visitor Center",
    "Lactation Room",
    "Lighting + Lit Pathways",
    "Lockers",
    "Lost and Found",
    "No Drinking Water on Trail",
    "Outdoor Classroom",
    "Outdoor Shower",
    "Picnic Area - Covered",
    "Picnic Area - Uncovered",
    "Public Phone + Payphone",
    "Recycling Station",
    "Rental Equipment",
    "Rental Space",
    "Shade Structures",
    "Sunscreen Station",
    "Trash Cans",
    "Vending Machines",
    "Water Fountain + Splash Pad",
    "Weather Shelter",
]

AMENITIES_FAMILY_YOUTH = [
    "Booster Seat",
    "Childcare Available",
    "Cribs",
    "Family Spaces",
    "High Chair",
    "Kid Friendly Menus",
    "Lactation Room",
    "Play Area - Indoor",
    "Play Area - Outdoor",
    "Playpens",
    "Stroller Friendly",
    "Stroller Parking",
    "Stroller Rental",
    "Youth Program",
]

AMENITIES_WATER_BOATING = [
    "Boat Dock",
    "Boat Launch",
    "Boat Ramp",
    "Canoe + Kayak Access",
    "Fishing Pier",
    "Fishing Access",
    "Marina",
    "Paddle Craft Rental",
    "Swim Area",
    "Swim Beach",
]

AMENITIES_DINING_SEATING = [
    "Bar Seating",
    "Booth Seating",
    "Communal Tables",
    "Counter Seating",
    "Dining Room",
    "Food Court",
    "Indoor Seating",
    "Outdoor Seating",
    "Patio",
    "Picnic Tables",
    "Private Dining Room",
    "Rooftop Seating",
    "Standing Room",
    "Sidewalk Seating",
    "Waterfront Seating",
]

ALCOHOL_AVAILABLE_OPTIONS = [
    {"value": "full_bar", "label": "Full Bar"},
    {"value": "beer_wine", "label": "Beer + Wine Only"},
    {"value": "byob", "label": "BYOB"},
    {"value": "no_alcohol", "label": "No Alcohol"},
    {"value": "seasonal", "label": "Seasonal/Event Only"},
    {"value": "nearby", "label": "Adjacent/Nearby Available"},
]

# REPLACED — 38 values
PET_OPTIONS = [
    "Pet Friendly",
    "Dogs Welcome",
    "Cats Welcome",
    "Small Pets Welcome",
    "Dogs On Leash Required",
    "Dogs Off Leash Permitted",
    "Dog Park On Site",
    "Dog Waste Bags Provided",
    "Dog Waste Stations",
    "Dog Water Bowls Provided",
    "Dog Treats Available",
    "Dog Menu Available",
    "Pet Patio + Outdoor Only",
    "Pet Patio + Covered",
    "Service Animals Welcome",
    "Emotional Support Animals Welcome",
    "No Pets Allowed",
    "No Dogs Allowed",
    "No Cats Allowed",
    "Small Dogs Only",
    "Large Dogs Welcome",
    "Breed Restrictions Apply",
    "Weight Limits Apply",
    "Vaccination Records Required",
    "Pet Deposit Required",
    "Pet Fee Required",
    "Pet Sitting Available",
    "Pet Boarding Available",
    "Pet Grooming Available",
    "Horses Welcome",
    "Horse Boarding",
    "Livestock Permitted",
    "Exotic Pets Welcome",
    "Pet Washing Station",
    "Pet Relief Area",
    "Pet Photo Ops",
    "Pet Events Hosted",
    "Pets in Carriers Only",
]

# REPLACED — 18 values
PUBLIC_TOILET_OPTIONS = [
    "Accessible Restroom",
    "Men's Restroom",
    "Women's Restroom",
    "All-Gender / Unisex",
    "Family Restroom",
    "Baby Changing Station",
    "Flush Toilets",
    "Vault Toilet",
    "Pit Toilet",
    "Portable Toilet",
    "Composting Toilet",
    "Seasonal Restroom",
    "Restroom at Trailhead",
    "Restroom On Trail",
    "Outdoor Shower",
    "Indoor Shower",
    "Key/Code Required",
    "No Public Restroom",
]

RESTROOM_ADA_CHECKLIST = [
    "Accessible stall present",
    "Stall 60 in. turning radius or greater",
    "Grab bars installed",
    "Accessible route to restroom",
    "Door hardware lever or auto",
    "Sink height 34 in. or lower",
    "Sink knee clearance",
    "Mirror 40 in. to bottom edge or lower",
    "Accessible soap + towel dispenser",
    "Accessible baby changing",
    "Emergency pull cord",
    "Firm stable flooring",
    "Signage with braille",
    "Lighting adequate",
    "Adult changing table",
]

# REPLACED — 16 values
PLAYGROUND_TYPES = [
    "Traditional Structure",
    "Nature Play",
    "Adventure / Ropes",
    "Inclusive / Universal",
    "Splash Pad",
    "Water Play",
    "Sensory Play",
    "Musical Play",
    "Swings",
    "Slides",
    "Climbing Structure",
    "Zip Line",
    "Sandbox",
    "Spinners",
    "Seesaw",
    "Ninja Course",
]

# REPLACED — 9 values
PLAYGROUND_SURFACE_TYPES = [
    "Engineered Wood Fiber",
    "Poured-in-Place Rubber",
    "Rubber Tiles",
    "Sand",
    "Pea Gravel",
    "Grass",
    "Artificial Turf",
    "Concrete",
    "Mulch",
]

PLAYGROUND_AGE_GROUPS = [
    "6–23 months",
    "2–5 years",
    "5–12 years",
    "All Ages",
]

PLAYGROUND_ADA_CHECKLIST = [
    "Accessible route to play area",
    "Accessible route onto play surface",
    "Unitary surface (poured-rubber/tiles)",
    "Ground-level play components accessible",
    "Elevated play components with transfer system",
    "Ramp access to composite structure",
    "Accessible swing (bucket/harness)",
    "Sensory play components",
    "Quiet / retreat space",
    "Shade over play area",
    "Accessible seating for caregivers",
    "Accessible drinking fountain nearby",
    "Accessible restroom nearby",
    "Signage with braille / tactile",
]

IDEAL_FOR_ATMOSPHERE = [
    "Authentic + Local",
    "Casual + Welcoming",
    "Community Gathering Spot",
    "Cozy + Intimate",
    "Country + Rural",
    "Fast Paced + Energetic",
    "Formal + Refined",
    "Historic + Heritage",
    "Loud + Lively",
    "Modern + Trendy",
    "Nature Immersed",
    "Off the Beaten Path",
    "Open + Inclusive",
    "Outdoor Seating + Open Air",
    "Peaceful + Secluded",
    "Pet Friendly",
    "Quiet + Reflective",
    "Quirky + Unique",
    "Rustic + Natural",
    "Spiritual + Reflective",
    "Visitor Friendly",
    "Wide Open Spaces",
]

IDEAL_FOR_AGE_GROUP = [
    "All Ages",
    "Families",
    "Infant + Toddler",
    "Pre K",
    "Stroller Friendly",
    "Elementary School (Age 5-10)",
    "Middle School (Age 10-14)",
    "High School (Age 14-18)",
    "Ages 18+",
    "Ages 21+",
    "College Age",
    "Golden Years Ages 55+",
    "Seniors 65+",
]

IDEAL_FOR_SOCIAL_SETTINGS = [
    "Solo Friendly",
    "Small Groups",
    "School Groups + Field Trips",
    "Corporate + Team Building",
    "First Date",
    "Anniversary",
    "Birthday Celebration",
    "Reunion",
    "Bachelorette + Bachelor",
    "Wedding Related",
    "Networking",
]

IDEAL_FOR_LOCAL_SPECIAL = [
    "Award Winning",
    "By Appointment Only",
    "Budget Friendly",
    "Catering Available",
    "Community Centered",
    "Curbside Pickup",
    "Drive Through",
    "Eco Friendly",
    "Leave No Trace",
    "Local Artists",
    "Local Delivery",
    "Locally Sourced Ingredients",
    "Luxury",
    "Made in NC",
    "Night Owls Open Late (past 10pm)",
    "Photography Friendly",
    "Reservations",
    "Seasonal",
    "Ships Nationwide",
    "Stewardship + Conservation",
    "Supports Local Farms",
    "Takeout Available",
    "Veteran Owned",
    "Virtual Consults Available",
    "Virtual Events Available",
    "Virtual Services Available",
    "Walk Ins Welcome",
    "We Come to You",
    "Volunteer Opportunities",
]

TRAIL_ROUTE_TYPES = [
    {"value": "loop", "label": "Loop"},
    {"value": "out_and_back", "label": "Out and Back"},
    {"value": "point_to_point", "label": "Point to Point"},
    {"value": "lollipop", "label": "Lollipop"},
    {"value": "stacked_loops", "label": "Stacked Loops"},
    {"value": "thru_trail", "label": "Thru-Trail"},
    {"value": "water_trail", "label": "Water Trail"},
]

GRANDFATHERED_ROUTE_TYPES = [
    {"value": "connecting_network", "label": "Connecting Network (Legacy)"},
]

TRAIL_LIGHTING_OPTIONS = [
    {"value": "partial", "label": "Partial"},
    {"value": "full", "label": "Full"},
    {"value": "seasonal", "label": "Seasonal"},
    {"value": "dusk_to_dawn", "label": "Dusk-to-Dawn"},
]

# IDEAL_FOR_KEY_OPTIONS: flat union so existing importers keep working.
IDEAL_FOR_KEY_OPTIONS = (
    IDEAL_FOR_ATMOSPHERE
    + IDEAL_FOR_AGE_GROUP
    + IDEAL_FOR_SOCIAL_SETTINGS
    + IDEAL_FOR_LOCAL_SPECIAL
)

# ============================================================================
# LEGACY / DEPRECATED — retained for data preservation. New forms no longer
# surface these lists, but existing DB rows and importers still reference them.
# ============================================================================

KEY_FACILITIES = [
    "Public Restroom",
    "Wheelchair Friendly",
    "Wifi",
    "Pet Friendly",
    "None of the above",
]

ALCOHOL_OPTIONS = [
    "Yes",
    "BYOB",
    "Available for Purchase",
    "Bar & Wine Only",
    "Brewery",
    "Local Brew",
    "Local Wine",
    "Winery",
    "Beer",
    "Wine",
    "Hard Drinks",
    "Mixed Drinks",
    "Martini Bar",
    "Bar Area",
    "Full Bar",
    "Bottle Service",
    "Good For Happy Hour",
    "Happy Hour Specials",
    "No Alcohol Allowed",
    "Other",
]

WHEELCHAIR_OPTIONS = [
    "No",
    "Unknown",
    "Yes",
]

SMOKING_OPTIONS = [
    "Yes",
    "Outdoor Area",
    "Indoor Lounge/Sitting Area",
    "Specified Area",
    "No",
]

COAT_CHECK_OPTIONS = [
    "Yes",
    "No",
    "Private Lockers",
]

DRONE_USAGE_OPTIONS = [
    "Yes, follow all current Drone Laws",
    "Yes, With Permit from Park",
    "No",
]

PRICE_RANGE_OPTIONS = [
    "$10 and under",
    "$15 and under",
    "$25 and under",
    "$30 and under",
    "$40 and under",
    "$50 and under",
    "$60 and under",
    "$80 and under",
    "$100 and under",
    "Over $101",
]

GIFT_CARD_OPTIONS = [
    {"value": "yes_this_only", "label": "Yes, for this business only"},
    {"value": "no", "label": "No"},
    {"value": "yes_select_others", "label": "Yes, for select other businesses"},
]

YOUTH_AMENITIES = [
    "Booster Seat",
    "Childcare Available",
    "Cribs",
    "Playpens",
    "High Chair",
    "Kid Friendly Menus",
    "Lactation Room",
    "Family Spaces",
    "Play Area - Indoor",
    "Play Area - Outdoor",
    "Stroller Parking",
    "Stroller Rental",
]

BUSINESS_AMENITIES = [
    "By Appointment Only",
    "Catering",
    "Curbside Pickup",
    "Drive Through",
    "In Store Shopping Assistant",
    "Large Group Friendly",
    "Local Delivery",
    "Shipping",
    "Takes Reservations",
    "Takeout",
    "Virtual Services",
    "Virtual Consults",
    "Walk Ins Welcome",
    "We Come to You",
    "24/7 Availability",
    "Indoor Seating",
    "Outdoor Seating",
    "Cooled Outdoor Seating",
    "Covered Outdoor Seating",
    "Heated Outdoor Seating",
    "Private Events",
]

ENTERTAINMENT_OPTIONS = [
    "Live Music",
    "Live Comedy",
    "Sports on TV",
    "Free Wifi",
    "Paid Wifi",
    "Karaoke",
    "Game Night",
    "Special Events",
    "No Public Wifi",
]

PARK_FACILITIES = [
    "Amphitheater",
    "Benches",
    "Bike Rack",
    "Boat Ramp or Launch",
    "Chargepoint Station",
    "Drinking Fountain",
    "Fire Pit",
    "Fishing",
    "Grill",
    "Outdoor Classroom",
    "Picnic Area - Uncovered",
    "Picnic Area - Covered",
    "Public Toilet",
    "Rental Equipment",
    "Rental Space",
    "Wifi - Free Wifi",
    "Wifi - Paid Wifi",
    "Wifi - No Public Wifi",
]

VENUE_SETTINGS = [
    "Indoor",
    "Outdoor",
    "Hybrid (In-Person and Online)",
    "Online Only",
]

BUSINESS_STATUS_OPTIONS = [
    "Fully Open",
    "Partly Open",
    "Temporary Hour Changes",
    "Temporarily Closed",
    "Call Ahead",
    "Permanently Closed",
    "Warning",
    "Limited Capacity",
    "Coming Soon",
    "Under Development",
    "Alert",
]

EVENT_STATUS_OPTIONS = [
    "Scheduled",
    "Canceled",
    "Postponed",
    "Updated Date and/or Time",
    "Rescheduled",
    "Moved Online",
    "Unofficial Proposed Date",
]

EVENT_STATUS_HELPER_TEXT = {
    "Scheduled": "Event is confirmed and happening as planned.",
    "Canceled": "Event has been permanently canceled and will not be rescheduled.",
    "Postponed": "Event is temporarily on hold. A new date has not been set yet.",
    "Updated Date and/or Time": "The event date or time has changed from the original listing.",
    "Rescheduled": "Event has been moved to a new confirmed date.",
    "Moved Online": "Event has been moved from in-person to an online/virtual format.",
    "Unofficial Proposed Date": "A date has been suggested but is not yet confirmed by the organizer.",
}

EVENT_STATUS_EXPLANATION_REQUIRED = [
    "Updated Date and/or Time",
    "Postponed",
    "Moved Online",
]

EVENT_COST_TYPES = ["free", "single_price", "range"]

IMAGE_FUNCTION_TAGS = [
    "storefront", "entrance", "interior", "exterior", "signage",
    "parking", "restrooms", "playground", "aerial", "food_drink",
    "menu", "staff", "product", "trail_marker", "scenic",
    "map", "floorplan", "event_setup", "stage", "vendor_area",
]
