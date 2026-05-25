// Constants for POI system

// ---------------------------------------------------------------------------
// Phase 1 (May Launch) — new Ideal For groups. Flat union is exported below
// as IDEAL_FOR_KEY_OPTIONS so existing importers don't break.
// ---------------------------------------------------------------------------
export const IDEAL_FOR_ATMOSPHERE = [
  'Authentic + Local',
  'Casual + Welcoming',
  'Community Gathering Spot',
  'Cozy + Intimate',
  'Country + Rural',
  'Fast Paced + Energetic',
  'Formal + Refined',
  'Historic + Heritage',
  'Loud + Lively',
  'Modern + Trendy',
  'Nature Immersed',
  'Off the Beaten Path',
  'Open + Inclusive',
  'Outdoor Seating + Open Air',
  'Peaceful + Secluded',
  'Pet Friendly',
  'Quiet + Reflective',
  'Quirky + Unique',
  'Rustic + Natural',
  'Spiritual + Reflective',
  'Visitor Friendly',
  'Wide Open Spaces'
];

export const IDEAL_FOR_AGE_GROUP = [
  'All Ages',
  'Families',
  'Infant + Toddler',
  'Pre K',
  'Stroller Friendly',
  'Elementary School (Age 5-10)',
  'Middle School (Age 10-14)',
  'High School (Age 14-18)',
  'Ages 18+',
  'Ages 21+',
  'College Age',
  'Golden Years Ages 55+',
  'Seniors 65+'
];

export const IDEAL_FOR_SOCIAL_SETTINGS = [
  'Solo Friendly',
  'Small Groups',
  'School Groups + Field Trips',
  'Corporate + Team Building',
  'First Date',
  'Anniversary',
  'Birthday Celebration',
  'Reunion',
  'Bachelorette + Bachelor',
  'Wedding Related',
  'Networking'
];

export const IDEAL_FOR_LOCAL_SPECIAL = [
  'Award Winning',
  'By Appointment Only',
  'Budget Friendly',
  'Catering Available',
  'Community Centered',
  'Curbside Pickup',
  'Drive Through',
  'Eco Friendly',
  'Leave No Trace',
  'Local Artists',
  'Local Delivery',
  'Locally Sourced Ingredients',
  'Luxury',
  'Made in NC',
  'Night Owls Open Late (past 10pm)',
  'Photography Friendly',
  'Reservations',
  'Seasonal',
  'Ships Nationwide',
  'Stewardship + Conservation',
  'Supports Local Farms',
  'Takeout Available',
  'Veteran Owned',
  'Virtual Consults Available',
  'Virtual Events Available',
  'Virtual Services Available',
  'Walk Ins Welcome',
  'We Come to You',
  'Volunteer Opportunities'
];

// Ideal For Key Box options — flat union of the 4 Phase-1 groups so existing
// importers (KeyIdealFor pickers, etc.) keep working.
export const IDEAL_FOR_KEY_OPTIONS = [
  ...IDEAL_FOR_ATMOSPHERE,
  ...IDEAL_FOR_AGE_GROUP,
  ...IDEAL_FOR_SOCIAL_SETTINGS,
  ...IDEAL_FOR_LOCAL_SPECIAL
];

// Parking options — Phase 1 replaced list (24 values)
export const PARKING_OPTIONS = [
  'Accessible Parking',
  'ATV + UTV Trailer Parking',
  'Bike Rack + Bicycle Parking',
  'Boat Trailer Parking',
  'Bus + Charter Bus Parking',
  'Carpool + Rideshare Parking',
  'Day Use Only (no overnight parking)',
  'Dedicated On-Site Parking Lot',
  'Garage',
  'Horse Trailer Parking',
  'Motorcycle + Motorbike Parking',
  'Nearby Public Parking Lot',
  'Overflow Parking',
  'Overnight Parking Permitted',
  'Oversized + Wide Load Vehicle',
  'Pull-Through Parking',
  'RV Parking (parking only — no hookups)',
  'Seasonal Parking Only',
  'Semi Truck + 18 Wheeler (cab and trailer)',
  'Semi Truck Cab Only (no trailer)',
  'Street Parking',
  'Trailer Parking — General',
  'Unpaved + Gravel Parking',
  'Valet Parking'
];

// Phase 1 — ADA parking checklist
export const PARKING_ADA_CHECKLIST = [
  'Dedicated accessible parking spaces on site',
  'Accessible spaces closest to main entrance',
  'Van accessible space available (8 foot access aisle)',
  'Accessible parking within reasonable distance',
  'Accessible route from parking to main entrance',
  'Accessible parking on firm stable surface'
];

// Phase 1 — arrival methods (how users physically get to a POI)
export const ARRIVAL_METHOD_OPTIONS = [
  'Bike-In Access',
  'Boat Access',
  'Dedicated Parking On Site',
  'Gate Access + Controlled Entry',
  'Nearby Public Parking',
  'Public Transit',
  'Roadside Pull-Off',
  'Shuttle + Drop-Off',
  'Street Parking'
];

// Payment methods — Phase 1 replaced list (17 values)
export const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Online Payments',
  'Credit Cards',
  'Coin Operated',
  'Apple Pay',
  'Google Pay',
  'Samsung Pay',
  'Cryptocurrency',
  'Contactless Payments',
  'PayPal',
  'Venmo',
  'Zelle',
  'Payment Plans',
  'Fee Station + Self-Pay Envelope',
  'Varies with Vendors',
  'Once Entered there is no place to spend money'
];

// Key facilities for all POI types
export const KEY_FACILITIES = [
  'Public Restroom',
  'Wheelchair Friendly',
  'Wifi',
  'Pet Friendly',
  'None of the above'
];

// Alcohol options
export const ALCOHOL_OPTIONS = [
  'Yes',
  'BYOB',
  'Available for Purchase',
  'Bar & Wine Only',
  'Brewery',
  'Local Brew',
  'Local Wine',
  'Winery',
  'Beer',
  'Wine',
  'Hard Drinks',
  'Mixed Drinks',
  'Martini Bar',
  'Bar Area',
  'Full Bar',
  'Bottle Service',
  'Good For Happy Hour',
  'Happy Hour Specials',
  'No Alcohol Allowed',
  'Other'
];

// Wheelchair accessibility
export const WHEELCHAIR_OPTIONS = [
  'No',
  'Unknown',
  'Yes'
];

// Smoking options
export const SMOKING_OPTIONS = [
  'Yes',
  'Outdoor Area',
  'Indoor Lounge/Sitting Area',
  'Specified Area',
  'No'
];

// Coat check options (Events only)
export const COAT_CHECK_OPTIONS = [
  'Yes',
  'No',
  'Private Lockers'
];

// WiFi options — Phase 1 replaced (3 values)
export const WIFI_OPTIONS = [
  'Free Wifi',
  'Paid Wifi',
  'No Public Wifi'
];

// Phase 1 — Cell service
export const CELL_SERVICE_OPTIONS = [
  'Good',
  'Limited',
  'Unknown',
  'None'
];

// Phase 1 — Amenities (grouped for new forms)
export const AMENITIES_GENERAL = [
  'ATM',
  'Baby Changing Station',
  'Benches',
  'Bike Rack',
  'Bike Repair Station',
  'Bottle Filling Station',
  'Bug Spray Station',
  'Bulletin Board + Community Board',
  'Campfire Ring + Fire Pit',
  'Chargepoint Station + EV Charging',
  'Coat Check',
  'Covered Shelter + Pavilion',
  'Covered Trail Shelter',
  'Drinking Fountain',
  'Drinking Fountain At Trailhead',
  'Drinking Fountain On Trail',
  'Elevator',
  'Emergency Phone + Call Box',
  'First Aid Station',
  'Flag Pole',
  'Grill + BBQ',
  'Handicap Accessible Entrance',
  'Hand Sanitizer Station',
  'Information Kiosk + Visitor Center',
  'Lactation Room',
  'Lighting + Lit Pathways',
  'Lockers',
  'Lost and Found',
  'No Drinking Water on Trail',
  'Outdoor Classroom',
  'Outdoor Shower',
  'Picnic Area - Covered',
  'Picnic Area - Uncovered',
  'Public Phone + Payphone',
  'Recycling Station',
  'Rental Equipment',
  'Rental Space',
  'Shade Structures',
  'Sunscreen Station',
  'Trash Cans',
  'Vending Machines',
  'Water Fountain + Splash Pad',
  'Weather Shelter'
];

export const AMENITIES_FAMILY_YOUTH = [
  'Booster Seat',
  'Childcare Available',
  'Cribs',
  'Family Spaces',
  'High Chair',
  'Kid Friendly Menus',
  'Lactation Room',
  'Play Area - Indoor',
  'Play Area - Outdoor',
  'Playpens',
  'Stroller Friendly',
  'Stroller Parking',
  'Stroller Rental',
  'Youth Program'
];

export const AMENITIES_WATER_BOATING = [
  'Boat Dock',
  'Boat Launch',
  'Boat Ramp',
  'Canoe + Kayak Access',
  'Fishing Pier',
  'Fishing Access',
  'Marina',
  'Paddle Craft Rental',
  'Swim Area',
  'Swim Beach'
];

export const AMENITIES_DINING_SEATING = [
  'Bar Seating',
  'Booth Seating',
  'Communal Tables',
  'Counter Seating',
  'Dining Room',
  'Food Court',
  'Indoor Seating',
  'Outdoor Seating',
  'Patio',
  'Picnic Tables',
  'Private Dining Room',
  'Rooftop Seating',
  'Standing Room',
  'Sidewalk Seating',
  'Waterfront Seating'
];

export const ALCOHOL_AVAILABLE_OPTIONS = [
  { value: 'full_bar', label: 'Full Bar' },
  { value: 'beer_wine', label: 'Beer + Wine Only' },
  { value: 'byob', label: 'BYOB' },
  { value: 'no_alcohol', label: 'No Alcohol' },
  { value: 'seasonal', label: 'Seasonal/Event Only' },
  { value: 'nearby', label: 'Adjacent/Nearby Available' }
];

export const SPONSOR_LEVEL_OPTIONS = [
  { value: 'platform', label: 'Platform' },
  { value: 'state', label: 'State' },
  { value: 'county', label: 'County' },
  { value: 'town', label: 'Town' }
];

// Drone usage
export const DRONE_USAGE_OPTIONS = [
  'Yes, follow all current Drone Laws',
  'Yes, With Permit from Park',
  'No'
];

// Pet options — Issue #48 replaced (43 values)
export const PET_OPTIONS = [
  'Any Well Behaved Pet',
  'Breed Restriction — see notes',
  'Cats Allowed',
  'Clean Up Stations',
  'Dogs Allowed',
  'Dogs Only',
  'Fenced in Area',
  'Hot Surface Warning',
  'Horse Boarding',
  'Horses Welcome',
  'Kennels Available for Rent',
  'Leash Required — 6 Feet Maximum',
  'Leash Required — Length Not Specified',
  'Livestock Permitted',
  'Maximum Number of Dogs Per Person — see notes',
  'No Pets Left Unattended',
  'Off Leash',
  'Pet Friendly Seating Areas',
  'Pack Out Waste — No Trash Cans Available',
  'Pet Relief Area',
  'Pet Waste Bags Available',
  'Trash Cans Available for Waste Bags',
  'Pet Fee Required',
  'Pet Swimming Area — Beach Access',
  'Pet Swimming Area — Designated + Marked',
  'Pet Swimming Area — Lake or Pond Access',
  'Pet Swimming Area — River or Creek Access',
  'Pet Washing Station',
  'Pets Allowed in Designated Areas Only',
  'Small Pets Only',
  'Size Restriction — Under 25 lbs',
  'Size Restriction — Under 50 lbs',
  'Size Restriction — No Size Restriction',
  'Pets Must Stay on Trail',
  'Pets Not Allowed in Buildings',
  'Seasonal Restrictions Apply — see notes',
  'Shade Available Along Route',
  'Spayed + Neutered Required',
  'Toxic Plant Warning',
  'Vaccination Proof Required',
  'Voice Control Accepted in Designated Areas',
  'Water Source',
  'Wildlife Hazard Area — see notes'
];

// Public toilet options — Wave 3 #47 (19 values; "Wheelchair + ADA Accessible"
// triggers the inline AccessibleRestroomChecklist below).
export const PUBLIC_TOILET_OPTIONS = [
  'Single Stall',
  'Multi Stall',
  'Family Restroom',
  'Baby Changing Station',
  'Wheelchair + ADA Accessible',
  'All Gender',
  'Climate Controlled Restroom',
  'Key Required',
  'Code Required',
  'Customers Only',
  'Attendant on Duty',
  'Pay Toilet',
  'Porta Potti',
  'Outdoor + Pit Toilet',
  'Vault Toilet',
  'Trailer Restroom',
  'Seasonal Only',
  '24 Hour Access'
];

// Wave 3 #47 — grouped ADA restroom checklist (15 items, 6 groups). Each entry
// is { group, label }. Renderer groups by `group`. Label wording must match
// shared/constants/field_options.py RESTROOM_ADA_CHECKLIST exactly because
// backend compute_accessible_restroom substring-matches on it.
export const RESTROOM_ADA_CHECKLIST = [
  // Space + Size
  { group: 'Space + Size', label: 'Accessible stall size — minimum 60" x 56" (wall-mounted toilet) or 60" x 59" (floor-mounted)' },
  { group: 'Space + Size', label: '60 inch turning radius clear floor space' },
  // Grab Bars
  { group: 'Grab Bars', label: 'Side grab bar installed' },
  { group: 'Grab Bars', label: 'Rear grab bar installed' },
  { group: 'Grab Bars', label: 'Grab bars mounted 33-36 inches from floor' },
  // Door
  { group: 'Door', label: 'Wide door — minimum 32 inches clear width' },
  { group: 'Door', label: 'Outward swinging or sliding door' },
  { group: 'Door', label: 'Lever or loop door handle' },
  // Toilet
  { group: 'Toilet', label: 'Accessible toilet height — 17-19 inches from floor' },
  // Sink + Fixtures
  { group: 'Sink + Fixtures', label: 'Sink height 34 inches or lower' },
  { group: 'Sink + Fixtures', label: 'Clear knee space under sink' },
  { group: 'Sink + Fixtures', label: 'Lever or sensor faucet' },
  { group: 'Sink + Fixtures', label: 'No exposed hot water or drain pipes under sink' },
  // General
  { group: 'General', label: 'Level entry — no lip or step' },
  { group: 'General', label: 'Accessible route to restroom' }
];

// Price Range Per Person (Business only)
export const PRICE_RANGE_OPTIONS = [
  '$10 and under',
  '$15 and under',
  '$25 and under',
  '$30 and under',
  '$40 and under',
  '$50 and under',
  '$60 and under',
  '$80 and under',
  '$100 and under',
  'Over $101'
];

// Discount Types — Phase 1 replaced (26 values)
export const DISCOUNT_TYPES = [
  'AAA Members',
  'AARP Members',
  'Access Pass Holders',
  'Active Duty Military',
  'Military Veteran',
  'Annual Pass Holder',
  'Children Free (age specified in notes)',
  'EMT',
  'Farmers',
  'Fire + Firefighter',
  'First Responder',
  'Golden Years (55+)',
  'Senior Discount (65+)',
  'Group Discount (10+)',
  'Healthcare Workers',
  'Homeschool Groups',
  'Local Resident + In-County Discount',
  'National Park Pass Holders',
  'Nonprofit + Organization Discount',
  'Police',
  'Season Pass Holder',
  'State Park Pass Holders',
  'Student',
  'Teacher',
  'Tribal Members',
  'Youth Discount'
];

// Gift Card Options
export const GIFT_CARD_OPTIONS = [
  { value: 'yes_this_only', label: 'Yes, for this business only' },
  { value: 'no', label: 'No' },
  { value: 'yes_select_others', label: 'Yes, for select other businesses' }
];

// Youth Amenities (Business only)
export const YOUTH_AMENITIES = [
  'Booster Seat',
  'Childcare Available',
  'Cribs',
  'Playpens',
  'High Chair',
  'Kid Friendly Menus',
  'Lactation Room',
  'Family Spaces',
  'Play Area - Indoor',
  'Play Area - Outdoor',
  'Stroller Parking',
  'Stroller Rental'
];

// Business Amenities/Services
export const BUSINESS_AMENITIES = [
  'By Appointment Only',
  'Catering',
  'Curbside Pickup',
  'Drive Through',
  'In Store Shopping Assistant',
  'Large Group Friendly',
  'Local Delivery',
  'Shipping',
  'Takes Reservations',
  'Takeout',
  'Virtual Services',
  'Virtual Consults',
  'Walk Ins Welcome',
  'We Come to You',
  '24/7 Availability',
  'Indoor Seating',
  'Outdoor Seating',
  'Cooled Outdoor Seating',
  'Covered Outdoor Seating',
  'Heated Outdoor Seating',
  'Private Events'
];

// Entertainment Options (Business, Parks, Trails)
export const ENTERTAINMENT_OPTIONS = [
  'Live Music',
  'Live Comedy',
  'Sports on TV',
  'Free Wifi',
  'Paid Wifi',
  'Karaoke',
  'Game Night',
  'Special Events',
  'No Public Wifi'
];

// Park Facilities Options (separate from key_facilities)
export const PARK_FACILITIES = [
  'Amphitheater',
  'Benches',
  'Bike Rack',
  'Boat Ramp or Launch',
  'Chargepoint Station',
  'Drinking Fountain',
  'Fire Pit',
  'Fishing',
  'Grill',
  'Outdoor Classroom',
  'Picnic Area - Uncovered',
  'Picnic Area - Covered',
  'Public Toilet',
  'Rental Equipment',
  'Rental Space',
  'Wifi - Free Wifi',
  'Wifi - Paid Wifi',
  'Wifi - No Public Wifi'
];

// Event Venue Settings
export const VENUE_SETTINGS = [
  'Indoor',
  'Outdoor',
  'Hybrid (In-Person and Online)',
  'Online Only'
];

// Vendor types for events
export const VENDOR_TYPES = [
  { value: 'Food & Beverage', label: 'Food & Beverage', group: 'Food & Beverage' },
  { value: 'Food Trucks', label: 'Food Trucks', group: 'Food & Beverage' },
  { value: 'Mobile Grills', label: 'Mobile Grills', group: 'Food & Beverage' },
  { value: 'Concession Vendors', label: 'Concession Vendors', group: 'Food & Beverage' },
  { value: 'Beverage Stands', label: 'Beverage Stands', group: 'Food & Beverage' },
  { value: 'Crafts & Art', label: 'Crafts & Art', group: 'Crafts & Art' },
  { value: 'Handmade Goods', label: 'Handmade Goods', group: 'Crafts & Art' },
  { value: 'Jewelry', label: 'Jewelry', group: 'Crafts & Art' },
  { value: 'Pottery', label: 'Pottery', group: 'Crafts & Art' },
  { value: 'Paintings', label: 'Paintings', group: 'Crafts & Art' },
  { value: 'Seasonal', label: 'Seasonal', group: 'Seasonal' },
  { value: 'Agriculture', label: 'Agriculture', group: 'Agriculture' },
  { value: 'Produce', label: 'Produce', group: 'Agriculture' },
  { value: 'Plants', label: 'Plants', group: 'Agriculture' },
  { value: 'Flowers', label: 'Flowers', group: 'Agriculture' },
  { value: 'Honey', label: 'Honey', group: 'Agriculture' },
  { value: 'Herbal Products', label: 'Herbal Products', group: 'Agriculture' },
  { value: 'Retail/Local Goods', label: 'Retail/Local Goods', group: 'Retail' },
  { value: 'Clothing', label: 'Clothing', group: 'Retail' },
  { value: 'Boutique Items', label: 'Boutique Items', group: 'Retail' },
  { value: 'Antiques', label: 'Antiques', group: 'Retail' },
  { value: 'Local Shops', label: 'Local Shops', group: 'Retail' },
  { value: 'Health & Wellness', label: 'Health & Wellness', group: 'Health & Wellness' },
  { value: 'Wellness Products', label: 'Wellness Products', group: 'Health & Wellness' },
  { value: 'Massage', label: 'Massage', group: 'Health & Wellness' },
  { value: 'Fitness Demos', label: 'Fitness Demos', group: 'Health & Wellness' },
  { value: 'Herbalists', label: 'Herbalists', group: 'Health & Wellness' },
  { value: 'Informational', label: 'Informational', group: 'Informational' },
  { value: 'Nonprofits', label: 'Nonprofits', group: 'Informational' },
  { value: 'Community Groups', label: 'Community Groups', group: 'Informational' },
  { value: 'Outreach', label: 'Outreach', group: 'Informational' },
  { value: 'Local Services', label: 'Local Services', group: 'Informational' },
  { value: 'Kids & Family', label: 'Kids & Family', group: 'Kids & Family' },
  { value: 'Games', label: 'Games', group: 'Kids & Family' },
  { value: 'Face Painting', label: 'Face Painting', group: 'Kids & Family' },
  { value: 'Bounce Houses', label: 'Bounce Houses', group: 'Kids & Family' },
  { value: 'Activity Stations', label: 'Activity Stations', group: 'Kids & Family' },
  { value: 'Entertainment', label: 'Entertainment', group: 'Entertainment' },
  { value: 'Musicians', label: 'Musicians', group: 'Entertainment' },
  { value: "DJ's", label: "DJ's", group: 'Entertainment' },
  { value: 'Performers', label: 'Performers', group: 'Entertainment' },
  { value: 'Clowns', label: 'Clowns', group: 'Entertainment' },
  { value: 'Live Demos', label: 'Live Demos', group: 'Entertainment' },
  { value: 'Pet Focused', label: 'Pet Focused', group: 'Pet Focused' },
  { value: 'Pet Products', label: 'Pet Products', group: 'Pet Focused' },
  { value: 'Rescues', label: 'Rescues', group: 'Pet Focused' },
  { value: 'Animal Adoptions', label: 'Animal Adoptions', group: 'Pet Focused' },
  { value: 'Business Booths', label: 'Business Booths', group: 'Business' },
  { value: 'Real Estate', label: 'Real Estate', group: 'Business' },
  { value: 'Insurance', label: 'Insurance', group: 'Business' },
  { value: 'Financial', label: 'Financial', group: 'Business' },
  { value: 'Local Business Services', label: 'Local Business Services', group: 'Business' },
  { value: 'Faith Based', label: 'Faith Based', group: 'Faith Based' },
  { value: 'Church', label: 'Church', group: 'Faith Based' },
  { value: 'Youth Outreach', label: 'Youth Outreach', group: 'Faith Based' },
  { value: 'Faith Literature', label: 'Faith Literature', group: 'Faith Based' },
  { value: 'Prepared Food Sales', label: 'Prepared Food Sales', group: 'Food Sales' },
  { value: 'Baked Goods', label: 'Baked Goods', group: 'Food Sales' },
  { value: 'Jams', label: 'Jams', group: 'Food Sales' },
  { value: 'Packaged Snacks', label: 'Packaged Snacks', group: 'Food Sales' }
];

// Listing Types — Phase 1: sponsor levels moved to SPONSOR_LEVEL_OPTIONS + is_sponsor flag
export const LISTING_TYPES = [
  { value: 'free', label: 'Free Listing' },
  { value: 'paid', label: 'Paid Listing' },
  { value: 'paid_founding', label: 'Paid – Founding' },
  { value: 'community_comped', label: 'Community-Comped' }
];

export const BUSINESS_STATUS_OPTIONS = [
  'Fully Open',
  'Partly Open',
  'Temporary Hour Changes',
  'Temporarily Closed',
  'Call Ahead',
  'Permanently Closed',
  'Warning',
  'Limited Capacity',
  'Coming Soon',
  'Under Development',
  'Alert'
];

export const EVENT_STATUS_OPTIONS = [
  'Scheduled',
  'Canceled',
  'Postponed',
  'Updated Date and/or Time',
  'Rescheduled',
  'Moved Online',
  'Unofficial Proposed Date'
];

export const IDEAL_FOR_OPTIONS = [
  // Atmosphere
  { value: 'Casual + Welcoming', label: 'Casual + Welcoming', group: 'Atmosphere' },
  { value: 'Formal + Refined', label: 'Formal + Refined', group: 'Atmosphere' },
  { value: 'Loud + Lively', label: 'Loud + Lively', group: 'Atmosphere' },
  { value: 'Quiet + Reflective', label: 'Quiet + Reflective', group: 'Atmosphere' },
  
  // Age Groups
  { value: 'All Ages', label: 'All Ages', group: 'Age Groups' },
  { value: 'Families', label: 'Families', group: 'Age Groups' },
  { value: 'For the Kids', label: 'For the Kids', group: 'Age Groups' },
  { value: 'Pet Friendly', label: 'Pet Friendly', group: 'Age Groups' },
  { value: 'Ages 18+', label: 'Ages 18+', group: 'Age Groups' },
  { value: 'Ages 21+', label: 'Ages 21+', group: 'Age Groups' },
  { value: 'Golden Years Ages 55+', label: 'Golden Years Ages 55+', group: 'Age Groups' },
  
  // Social Settings
  { value: 'Date Night - Romance', label: 'Date Night - Romance', group: 'Social Settings' },
  { value: 'Girls Night - Hanging out with Girlfriends', label: 'Girls Night - Hanging out with Girlfriends', group: 'Social Settings' },
  { value: 'Guys Night - Hanging out with Guys', label: 'Guys Night - Hanging out with Guys', group: 'Social Settings' },
  { value: 'Large Groups 10+', label: 'Large Groups 10+', group: 'Social Settings' },
  
  // Local & Special
  { value: 'Local Artists', label: 'Local Artists', group: 'Local & Special' },
  { value: 'Locally Sourced Ingredients', label: 'Locally Sourced Ingredients', group: 'Local & Special' },
  { value: 'Budget Friendly', label: 'Budget Friendly', group: 'Local & Special' },
  { value: 'Eco Friendly', label: 'Eco Friendly', group: 'Local & Special' },
  { value: 'Luxury', label: 'Luxury', group: 'Local & Special' },
  { value: 'Night Owls Open Late (past 10pm)', label: 'Night Owls Open Late (past 10pm)', group: 'Local & Special' },
  { value: 'Reservations', label: 'Reservations', group: 'Local & Special' },
  
  // Special Needs Adult (18+)
  { value: 'Special Needs Adult (18+)', label: 'Special Needs Adult (18+)', group: 'Special Needs Adult' },
  { value: 'ADD Attention-Deficit-Disorder', label: 'ADD Attention-Deficit-Disorder', group: 'Special Needs Adult' },
  { value: 'ADHD Attention-Deficit-Hyperactivity Disorder', label: 'ADHD Attention-Deficit-Hyperactivity Disorder', group: 'Special Needs Adult' },
  { value: 'Asperger\'s Syndrome', label: 'Asperger\'s Syndrome', group: 'Special Needs Adult' },
  { value: 'Autism', label: 'Autism', group: 'Special Needs Adult' },
  { value: 'Behavioral Issues', label: 'Behavioral Issues', group: 'Special Needs Adult' },
  { value: 'Blind', label: 'Blind', group: 'Special Needs Adult' },
  { value: 'Deaf or Hard of Hearing', label: 'Deaf or Hard of Hearing', group: 'Special Needs Adult' },
  { value: 'Developmental Issues', label: 'Developmental Issues', group: 'Special Needs Adult' },
  { value: 'Down Syndrome', label: 'Down Syndrome', group: 'Special Needs Adult' },
  { value: 'Learning Issues', label: 'Learning Issues', group: 'Special Needs Adult' },
  { value: 'Medical Issues', label: 'Medical Issues', group: 'Special Needs Adult' },
  { value: 'Mental Health', label: 'Mental Health', group: 'Special Needs Adult' },
  { value: 'Processing Disorders', label: 'Processing Disorders', group: 'Special Needs Adult' },
  { value: 'PTSD (Post-Traumatic-Stress Disorder)', label: 'PTSD (Post-Traumatic-Stress Disorder)', group: 'Special Needs Adult' },
  { value: 'Sensory Impaired', label: 'Sensory Impaired', group: 'Special Needs Adult' },
  { value: 'Visually Impaired', label: 'Visually Impaired', group: 'Special Needs Adult' },
  { value: 'Wheelchair Friendly', label: 'Wheelchair Friendly', group: 'Special Needs Adult' },
  
  // Youth WITH Adult
  { value: 'Youth WITH Adult - All', label: 'All', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Infant (non walking)', label: 'Infant (non walking)', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Toddler', label: 'Toddler', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Pre K', label: 'Pre K', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Elementary School (Age 5yrs-10yrs)', label: 'Elementary School (Age 5yrs-10yrs)', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Middle School (Age 10yrs-14yrs)', label: 'Middle School (Age 10yrs-14yrs)', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - High School (Age 14yrs-18yrs)', label: 'High School (Age 14yrs-18yrs)', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Homeschooling', label: 'Homeschooling', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Special Needs', label: 'Special Needs', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - ADD', label: 'ADD', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - ADHD', label: 'ADHD', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Asperger\'s Syndrome', label: 'Asperger\'s Syndrome', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Autism', label: 'Autism', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Behavioral Issues', label: 'Behavioral Issues', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Blind', label: 'Blind', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Deaf or Hard of Hearing', label: 'Deaf or Hard of Hearing', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Developmental Issues', label: 'Developmental Issues', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Down Syndrome', label: 'Down Syndrome', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Learning Issues', label: 'Learning Issues', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Medical Issues', label: 'Medical Issues', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Mental Health', label: 'Mental Health', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Processing Disorders', label: 'Processing Disorders', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - PTSD', label: 'PTSD', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Sensory Impaired', label: 'Sensory Impaired', group: 'Youth WITH Adult' },
  { value: 'Youth WITH Adult - Visually Impaired', label: 'Visually Impaired', group: 'Youth WITH Adult' },
  
  // Youth WITHOUT Adult
  { value: 'Youth WITHOUT Adult - All', label: 'All', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Infant (non walking)', label: 'Infant (non walking)', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Toddler', label: 'Toddler', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Pre K', label: 'Pre K', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Elementary School (Age 5yrs-10yrs)', label: 'Elementary School (Age 5yrs-10yrs)', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Middle School (Age 10yrs-14yrs)', label: 'Middle School (Age 10yrs-14yrs)', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - High School (Age 14yrs-18yrs)', label: 'High School (Age 14yrs-18yrs)', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Homeschooling', label: 'Homeschooling', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Special Needs', label: 'Special Needs', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - ADD', label: 'ADD', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - ADHD', label: 'ADHD', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Asperger\'s Syndrome', label: 'Asperger\'s Syndrome', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Autism', label: 'Autism', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Behavioral Issues', label: 'Behavioral Issues', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Blind', label: 'Blind', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Deaf or Hard of Hearing', label: 'Deaf or Hard of Hearing', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Developmental Issues', label: 'Developmental Issues', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Down Syndrome', label: 'Down Syndrome', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Learning Issues', label: 'Learning Issues', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Medical Issues', label: 'Medical Issues', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Mental Health', label: 'Mental Health', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Processing Disorders', label: 'Processing Disorders', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - PTSD', label: 'PTSD', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Sensory Impaired', label: 'Sensory Impaired', group: 'Youth WITHOUT Adult' },
  { value: 'Youth WITHOUT Adult - Visually Impaired', label: 'Visually Impaired', group: 'Youth WITHOUT Adult' }
];

// Event Cost Types (Task 139)
export const EVENT_COST_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'single_price', label: 'Single Price' },
  { value: 'range', label: 'Price Range' },
];

// Event Disclaimer (Task 149)
export const EVENT_DISCLAIMER = "While we work to keep event information current and accurate, details may change. We recommend confirming directly with event organizers before making plans.";

// Helper function to get status options based on POI type
export const getStatusOptions = (poiType) => {
  if (poiType === 'EVENT') {
    return EVENT_STATUS_OPTIONS;
  }
  return BUSINESS_STATUS_OPTIONS;
};

// Venue Inheritance Sections — which venue fields an event can inherit
export const VENUE_INHERITANCE_SECTIONS = [
  { value: 'address', label: 'Address & Location' },
  { value: 'parking', label: 'Parking' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'restrooms', label: 'Restrooms' },
  { value: 'contact', label: 'Contact Info' },
  { value: 'hours', label: 'Hours' },
  { value: 'amenities', label: 'Amenities' },
];

// Venue Inheritance Modes — how each inherited section is used
export const VENUE_INHERITANCE_MODES = [
  { value: 'as_is', label: 'Use As Is' },
  { value: 'use_and_add', label: 'Use & Add' },
  { value: 'do_not_use', label: "Don't Use" },
];

// Recurrence frequency options for recurring events
export const REPEAT_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

// Sponsor tier options for event sponsors (Issue #51)
export const SPONSOR_TIERS = [
  { value: 'Tier 1', label: 'Tier 1' },
  { value: 'Tier 2', label: 'Tier 2' },
  { value: 'Tier 3', label: 'Tier 3' },
  { value: 'Tier 4', label: 'Tier 4' },
  { value: 'Tier 5', label: 'Tier 5' },
];

// Phase 1 helper — returns feature flags for a (poi_type, listing_type) pair.
// Used by layout files to gate which fields/sections render.
export function getFieldsForListingType(poi_type, listing_type) {
  const paid = ['paid', 'paid_founding', 'community_comped'];
  const isBusiness = poi_type === 'BUSINESS';
  const isPaid = isBusiness && paid.includes(listing_type);
  const isFree = isBusiness && (listing_type === 'free' || !listing_type);
  if (isPaid) {
    return {
      maxCategories: null,
      maxIdealFor: null,
      maxIdealForKey: 3,
      includeGallery: true,
      includeTeaser: true,
      includeDescriptionLong: true,
      includeSocials: true,
      includeMenu: true,
      includeRentals: true,
      includePlayground: true,
      includeHistory: true,
      includePaymentMethods: true,
      includeDiscounts: true,
      includeFullAmenities: true,
    };
  }
  if (isFree) {
    return {
      maxCategories: 1,
      maxIdealFor: 5,
      maxIdealForKey: 3,
      includeGallery: false,
      includeTeaser: false,
      includeDescriptionLong: false,
      includeSocials: false,
      includeMenu: false,
      includeRentals: false,
      includePlayground: false,
      includeHistory: false,
      includePaymentMethods: false,
      includeDiscounts: false,
      includeFullAmenities: false,
    };
  }
  return { maxIdealForKey: 3, includeGallery: true };
}

// Legacy helper (old arg order + legacy shape) retained for CategoriesSection + validationRules.
export const getLegacyFieldsForListingType = (listingType, poiType) => {
  const isPaid = ['paid', 'sponsor_platform', 'sponsor_state', 'sponsor_county', 'sponsor_town', 'community_comped'].includes(listingType);
  
  if (poiType === 'BUSINESS') {
    if (listingType === 'free') {
      return {
        showDescriptionLong: false,
        showDescriptionShort: true,
        descriptionShortMaxLength: 250,
        showHistoryParagraph: false,
        showGallery: false,
        showCustomFields: false,
        showIdealFor: false,  // Free business listings don't get ideal for
        showIdealForKey: true, // But they do get the key box (max 3)
        maxIdealForKey: 3,
        maxCategories: 1,  // Free listings get only 1 category
        featuredImageLabel: 'Logo'
      };
    }
    // Paid business listings
    return {
      showDescriptionLong: true,
      showDescriptionShort: false,
      showHistoryParagraph: true,
      showGallery: true,
      showCustomFields: true,
      showIdealFor: true,
      showIdealForKey: true,
      maxIdealForKey: null, // No limit for paid
      maxCategories: null,  // No limit for paid
      featuredImageLabel: 'Featured Image'
    };
  }
  
  // For Parks, Trails, Events
  return {
    showDescriptionLong: true,
    showDescriptionShort: false,
    showHistoryParagraph: (poiType === 'PARK' || poiType === 'TRAIL') && isPaid,
    showGallery: true,
    showCustomFields: true,
    showIdealFor: true,
    showIdealForKey: true,
    maxIdealForKey: null,
    maxCategories: null,
    featuredImageLabel: 'Featured Image'
  };
};