// Constants for POI system

// Ideal For Key Box options (simplified list for free listings)
export const IDEAL_FOR_KEY_OPTIONS = [
  'Casual + Welcoming',
  'Formal + Refined',
  'Loud + Lively',
  'Quiet + Reflective',
  'Adult Only (18+)',
  'All Ages',
  'Family Friendly',
  'Golden Generation (55+)',
  'PreK',
  'School Age',
  'Teens',
  'Youth'
];

// Parking options
export const PARKING_OPTIONS = [
  'Public Parking Lot',
  'Dedicated Parking Lot',
  'Private Parking Lot',
  'Street',
  'Valet',
  'Garage',
  'Validated',
  'Oversized Vehicles',
  'Pay to Park',
  'Free Parking',
  'Dedicated Motorcycle or Motorbike Parking',
  'Dedicated Bicycle Parking',
  'RV Parking',
  'Big Rig Parking',
  'Parking Garage'
];

// Payment methods
export const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Online Payments',
  'Credit Cards',
  'Apple Pay',
  'Google Pay',
  'Cryptocurrency',
  'Contactless Payments',
  'Payment Plans',
  'Has ATM',
  'Varies with Vendors',
  'Once Entered there is no place to spend money'
];

// Key facilities for Events, Parks, Trails
export const KEY_FACILITIES = [
  'Public Toilet',
  'NO Public Toilet',
  'Drinking Fountain',
  'NO Drinking Fountain',
  'Picnic Area',
  'NO Picnic Area',
  'Wheelchair Friendly',
  'NOT Wheelchair Friendly'
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

// WiFi options (Events only)
export const WIFI_OPTIONS = [
  'Free Public Wifi',
  'No Public Wifi',
  'Paid Public Wifi'
];

// Drone usage
export const DRONE_USAGE_OPTIONS = [
  'Yes, follow all current Drone Laws',
  'Yes, With Permit from Park',
  'No'
];

// Pet options
export const PET_OPTIONS = [
  'Allowed',
  'Not Allowed',
  'Any Well Behaved Pet',
  'Cats Allowed',
  'Clean Up Stations',
  'Dogs Allowed',
  'Fenced in Area',
  'Kennels Available for Rent',
  'Leashed',
  'Off Leash',
  'Water Source'
];

// Public toilet options
export const PUBLIC_TOILET_OPTIONS = [
  'Yes',
  'Family',
  'Baby Changing Station',
  'Wheelchair/Handicap Accessible',
  'Porta Potti',
  'Porta Potti Only',
  'No'
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

// Discount Types (Business, Parks, Trails)
export const DISCOUNT_TYPES = [
  'Golden Years (55+)',
  'Military',
  'Veteran',
  'First Responder',
  'Police',
  'Fire Firefighter',
  'EMT',
  'Teacher',
  'Student',
  'Local Resident/In-County Discount',
  'Healthcare Workers',
  'Farmers',
  'Tribal Members'
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

export const LISTING_TYPES = [
  { value: 'free', label: 'Free Listing' },
  { value: 'paid', label: 'Paid Listing' },
  { value: 'paid_founding', label: 'Paid Founding Listing' },
  { value: 'sponsor', label: 'Sponsor Listing' },
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

// Helper function to get status options based on POI type
export const getStatusOptions = (poiType) => {
  if (poiType === 'EVENT') {
    return EVENT_STATUS_OPTIONS;
  }
  return BUSINESS_STATUS_OPTIONS;
};

// Helper function to determine which fields to show based on listing type
export const getFieldsForListingType = (listingType, poiType) => {
  const isPaid = ['paid', 'paid_founding', 'sponsor', 'community_comped'].includes(listingType);
  
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