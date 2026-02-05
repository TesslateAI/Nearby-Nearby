// Outdoor and Recreation Constants

// Playground Types
export const PLAYGROUND_TYPES = [
  'Art & Play Sculptures',
  'Toddler (6-23 months)',
  'Pre School (2-5 years)',
  'Grade School (5-12 years)',
  'Inclusive (ADA Accessible)',
  'Natural Playground (uses natural materials like logs/rocks)',
  'Sand Pit',
  'Fence Around Playground',
  'Separate Areas by Age Group'
];

// Playground Surface Types
export const PLAYGROUND_SURFACES = [
  'Rubber (poured or tiles)',
  'Wood Chips',
  'Sand',
  'Grass',
  'Concrete',
  'Dirt/Natural'
];

// Natural Features
export const NATURAL_FEATURES = [
  'Bay',
  'Beach',
  'Cape',
  'Cave',
  'Creek or Stream',
  'Dam',
  'Hot Springs',
  'Island',
  'Lake',
  'Mountain',
  'Ocean',
  'Pond',
  'Reservoir',
  'River',
  'Spring',
  'Waterfall',
  'Wildflowers',
  'Wooded'
];

// Outdoor Types
export const OUTDOOR_TYPES = [
  'Arboretum',
  'Boat Launch Parking',
  'Botanical Garden',
  'Byway',
  'City Park',
  'Community Park',
  'County Park',
  'Dog Park',
  'Historical',
  'Marine Sanctuaries',
  'Memorial',
  'National Park',
  'National Forest',
  'Nature Preserve',
  'Neighborhood Park',
  'Open Land',
  'Pocket Park',
  'Public Square & Plaza',
  'Recreational Park & Facilities',
  'Roadside Park',
  'Sculpture Garden',
  'State Park',
  'Trailhead Parking',
  'Wilderness Area',
  'Wildlife Refuges'
];

// Things to Do (Parks Categories)
export const THINGS_TO_DO = [
  'ATV & Dirt Bike Trail',
  'Baseball & Softball Fields',
  'Basketball Courts',
  'Bike Path',
  'Boating',
  'Camping',
  'Canoe',
  'Disc Golf',
  'Education',
  'Fishing Spot',
  'Floating',
  'Football Field',
  'Horseback Riding',
  'Jet Ski',
  'Kayaking',
  'Multi-use Field',
  'Paddleboard',
  'Picnic',
  'Playground',
  'Reflection',
  'Rock Climbing',
  'Sailboat',
  'Skateboard Park',
  'Snow Ski',
  'Soccer Field',
  'Splash Pads',
  'Surfing',
  'Swimming Pool',
  'Tennis Courts',
  'Trail',
  'Volleyball',
  'Visitor Center',
  'WaterSki',
  'Whitewater Rafting'
];

// Hunting Types
export const HUNTING_TYPES = [
  'None',
  'Deer',
  'Turkey',
  'Waterfowl',
  'Small Game (e.g., rabbit, squirrel)',
  'Bear',
  'Wild Boar/Feral Hog',
  'Upland Birds (e.g., quail, pheasant)',
  'Archery Only',
  'Muzzleloader Only',
  'Rifle Allowed',
  'Shotgun Only',
  'Disabled Hunter Access'
];

// Fishing Types
export const FISHING_TYPES = [
  'Pond',
  'Lake',
  'River',
  'Stream',
  'Fly Fishing',
  'Bank Fishing',
  'Boat Access',
  'Pier Fishing',
  'Ice Fishing',
  'ADA-Accessible Fishing Dock'
];

// Licenses Required
export const LICENSE_TYPES = [
  'State Hunting License',
  'State Fishing License',
  'Special Park Permit Required',
  'None (Private Property Access Only)',
  'Other'
];

// Trail Difficulty with Descriptions
export const TRAIL_DIFFICULTIES = [
  {
    value: 'easy',
    label: 'Easy',
    description: `Great for young kids, older adults, or beginners
Well-marked, maintained trails with little to no elevation gain
Typically under 3 miles
Surface is mostly flat, firm, and stable`
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: `Best for people in fair to good hiking condition
Some inclines and uneven terrain
May include small creek crossings or roots
Typically 3–5 miles with up to 800 feet elevation gain`
  },
  {
    value: 'challenging',
    label: 'Challenging',
    description: `Requires good physical fitness
Steeper inclines and more rugged terrain
Typically 5–8 miles with 800–1500 feet elevation gain
May include switchbacks or rough footing`
  },
  {
    value: 'difficult',
    label: 'Difficult',
    description: `For experienced hikers in strong physical condition
Steep or sustained climbs, possibly loose or rocky terrain
Typically over 8 miles or over 1500 feet elevation gain
May include narrow paths, rock scrambles, or ledges`
  },
  {
    value: 'very_difficult',
    label: 'Very Difficult',
    description: `For very fit and experienced hikers only
Long mileage, intense elevation gain (2000+ ft)
Technical sections may require hands or basic climbing
Remote, exposed, or poorly marked areas possible`
  },
  {
    value: 'extreme',
    label: 'Extreme',
    description: `For expert hikers or climbers in peak physical condition
May require route finding, scrambling, or technical climbing
Often unmaintained or primitive trails
Very steep elevation gain (3000+ ft) and high mileage
Weather, altitude, and navigation skills can be critical`
  }
];

// Trail Route Types
export const TRAIL_ROUTE_TYPES = [
  { value: 'loop', label: 'Loop' },
  { value: 'out_and_back', label: 'Out and Back' },
  { value: 'point_to_point', label: 'Point to Point' },
  { value: 'connecting_network', label: 'Connecting Network' }
];

// Trail Surfaces
export const TRAIL_SURFACES = {
  'Natural & Soft': [
    'Dirt & Soil',
    'Grass',
    'Sand',
    'Wood Chips & Mulch',
    'Leaf Litter & Forest Floor',
    'Natural Rock',
    'Boulder Fields'
  ],
  'Hardened & Improved': [
    'Gravel & Crushed Stone',
    'Cinder & Fine Crushed Rock',
    'Boardwalk & Wood Planks',
    'Paved Asphalt',
    'Concrete',
    'Cobblestone & Brick'
  ],
  'Specialty': [
    'Rubber Mat',
    'Composite Decking',
    'Railroad Tie & Log Steps',
    'Handicap (ADA)',
    'Water (Canoe/Kayak Trails)'
  ]
};

// Trail Conditions
export const TRAIL_CONDITIONS = [
  'Mixed Surface',
  'Unmaintained in Winter',
  'Flood-Prone Routes',
  'Washed Out Areas',
  'Muddy Seasons'
];

// Trail Experiences
export const TRAIL_EXPERIENCES = [
  'Dog Walks',
  'Pub Walks',
  'Family Walks',
  'Stroller-Friendly',
  'Kid Friendly/Beginner Friendly',
  'Night Hike',
  'Stargazing',
  'Accessible Walks',
  'ATV',
  'Horse',
  'Guided',
  'Coastal',
  'Historic',
  'Town and Village',
  'Cycling',
  'Water/Canoe Trails',
  'Backpacking',
  'Snowshoe/Winter Hike',
  'Trail Running',
  'Bike Riding',
  'Camping Access'
];

// Hunting & Fishing Options
export const HUNTING_FISHING_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'seasonal', label: 'Yes - Seasonal' },
  { value: 'year_round', label: 'Yes - Year-round' }
];

export const FISHING_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'catch_release', label: 'Yes - Catch & Release Only' },
  { value: 'catch_keep', label: 'Yes - Catch & Keep Permitted' },
  { value: 'other', label: 'Other' }
];