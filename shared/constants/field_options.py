"""Python source of truth for field option lists.

These mirror the values in nearby-admin/frontend/src/utils/constants.js.
Backend validation and future API serving can use these directly.
"""

IDEAL_FOR_KEY_OPTIONS = [
    "Casual + Welcoming",
    "Formal + Refined",
    "Loud + Lively",
    "Quiet + Reflective",
    "Ages 18+",
    "Ages 21+",
    "All Ages",
    "Families",
    "Golden Years Ages 55+",
    "PreK",
    "School Age",
    "Teens",
    "Youth",
]

PARKING_OPTIONS = [
    "Public Parking Lot",
    "Dedicated Parking Lot",
    "Private Parking Lot",
    "Street",
    "Valet",
    "Garage",
    "Validated",
    "Oversized Vehicles",
    "Pay to Park",
    "Free Parking",
    "Dedicated Motorcycle or Motorbike Parking",
    "Dedicated Bicycle Parking",
    "RV Parking",
    "Big Rig Parking",
    "Parking Garage",
]

PAYMENT_METHODS = [
    "Cash",
    "Check",
    "Online Payments",
    "Credit Cards",
    "Apple Pay",
    "Google Pay",
    "Cryptocurrency",
    "Contactless Payments",
    "Payment Plans",
    "Has ATM",
    "Varies with Vendors",
    "Once Entered there is no place to spend money",
]

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

WIFI_OPTIONS = [
    "Free Public Wifi",
    "No Public Wifi",
    "Paid Public Wifi",
]

DRONE_USAGE_OPTIONS = [
    "Yes, follow all current Drone Laws",
    "Yes, With Permit from Park",
    "No",
]

PET_OPTIONS = [
    "Allowed",
    "Not Allowed",
    "Any Well Behaved Pet",
    "Cats Allowed",
    "Clean Up Stations",
    "Dogs Allowed",
    "Fenced in Area",
    "Kennels Available for Rent",
    "Leashed",
    "Off Leash",
    "Water Source",
]

PUBLIC_TOILET_OPTIONS = [
    "Yes",
    "Family",
    "Baby Changing Station",
    "Wheelchair/Handicap Accessible",
    "Porta Potti",
    "Porta Potti Only",
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

DISCOUNT_TYPES = [
    "Golden Years (55+)",
    "Military",
    "Veteran",
    "First Responder",
    "Police",
    "Fire Firefighter",
    "EMT",
    "Teacher",
    "Student",
    "Local Resident/In-County Discount",
    "Healthcare Workers",
    "Farmers",
    "Tribal Members",
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

LISTING_TYPES = [
    {"value": "free", "label": "Free Listing"},
    {"value": "paid", "label": "Paid Listing"},
    {"value": "paid_founding", "label": "Paid Founding Listing"},
    {"value": "sponsor", "label": "Sponsor Listing"},
    {"value": "community_comped", "label": "Community-Comped"},
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

IMAGE_FUNCTION_TAGS = [
    "storefront", "entrance", "interior", "exterior", "signage",
    "parking", "restrooms", "playground", "aerial", "food_drink",
    "menu", "staff", "product", "trail_marker", "scenic",
    "map", "floorplan", "event_setup", "stage", "vendor_area",
]
