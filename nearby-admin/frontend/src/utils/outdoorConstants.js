// Outdoor and Recreation Constants

// Playground Types — Phase 1 replaced (16 values)
export const PLAYGROUND_TYPES = [
  'Traditional Structure',
  'Nature Play',
  'Adventure / Ropes',
  'Inclusive / Universal',
  'Splash Pad',
  'Water Play',
  'Sensory Play',
  'Musical Play',
  'Swings',
  'Slides',
  'Climbing Structure',
  'Zip Line',
  'Sandbox',
  'Spinners',
  'Seesaw',
  'Ninja Course'
];

// Playground Surface Types — Phase 1 replaced (9 values)
export const PLAYGROUND_SURFACES = [
  'Engineered Wood Fiber',
  'Poured-in-Place Rubber',
  'Rubber Tiles',
  'Sand',
  'Pea Gravel',
  'Grass',
  'Artificial Turf',
  'Concrete',
  'Mulch'
];

// Alias used by Phase 1 frontend layouts
export const PLAYGROUND_SURFACE_TYPES = PLAYGROUND_SURFACES;

// Phase 1 — playground age groups
export const PLAYGROUND_AGE_GROUPS = [
  '6–23 months',
  '2–5 years',
  '5–12 years',
  'All Ages'
];

// Phase 1 — playground ADA checklist
export const PLAYGROUND_ADA_CHECKLIST = [
  'Accessible route to play area',
  'Accessible route onto play surface',
  'Unitary surface (poured-rubber/tiles)',
  'Ground-level play components accessible',
  'Elevated play components with transfer system',
  'Ramp access to composite structure',
  'Accessible swing (bucket/harness)',
  'Sensory play components',
  'Quiet / retreat space',
  'Shade over play area',
  'Accessible seating for caregivers',
  'Accessible drinking fountain nearby',
  'Accessible restroom nearby',
  'Signage with braille / tactile'
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

// Outdoor Types — Phase 1: consumer is now the categories API
// (GET /api/categories?applicable_to=PARK|TRAIL). Kept as empty export so
// existing importers don't crash.
export const OUTDOOR_TYPES = [];

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

// Trail Route Types — Phase 1 replaced (7 values)
export const TRAIL_ROUTE_TYPES = [
  { value: 'loop', label: 'Loop' },
  { value: 'out_and_back', label: 'Out and Back' },
  { value: 'point_to_point', label: 'Point to Point' },
  { value: 'lollipop', label: 'Lollipop' },
  { value: 'stacked_loops', label: 'Stacked Loops' },
  { value: 'thru_trail', label: 'Thru-Trail' },
  { value: 'water_trail', label: 'Water Trail' }
];

// Grandfathered — surfaced in a Select only when the current row value matches.
export const GRANDFATHERED_ROUTE_TYPES = [
  { value: 'connecting_network', label: 'Connecting Network (Legacy)' }
];

// Phase 1 — trail lighting
export const TRAIL_LIGHTING_OPTIONS = [
  { value: 'partial', label: 'Partial' },
  { value: 'full', label: 'Full' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'dusk_to_dawn', label: 'Dusk-to-Dawn' }
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