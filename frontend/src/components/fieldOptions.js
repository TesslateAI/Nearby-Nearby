// This file centralizes the options for checkbox groups to keep POIForm.jsx cleaner.

export const amenities = [
    { value: 'by_appointment_only', label: 'By Appointment Only' },
    { value: 'catering', label: 'Catering' },
    { value: 'curbside_pickup', label: 'Curbside Pickup' },
    { value: 'drive_through', label: 'Drive Through' },
    { value: 'delivery', label: 'Local Delivery' },
    { value: 'outdoor_seating', label: 'Outdoor Seating' },
    { value: 'takes_reservations', label: 'Takes Reservations' },
    { value: 'walkins_welcome', label: 'Walk-ins Welcome' },
];

export const payment = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_cards', label: 'Credit Cards' },
    { value: 'apple_pay', label: 'Apple Pay' },
    { value: 'google_pay', label: 'Google Pay' },
    { value: 'online', label: 'Online Payments' },
    { value: 'contactless', label: 'Contactless Payments' },
];

export const parking = [
    { value: 'lot', label: 'Dedicated Parking Lot' },
    { value: 'street', label: 'Street' },
    { value: 'garage', label: 'Garage' },
    { value: 'valet', label: 'Valet' },
    { value: 'free', label: 'Free Parking' },
    { value: 'paid', label: 'Pay to Park' },
];

export const pets = [
    { value: 'allowed', label: 'Allowed' },
    { value: 'not_allowed', label: 'Not Allowed' },
    { value: 'dogs_allowed', label: 'Dogs Allowed' },
    { value: 'leashed', label: 'Leashed' },
    { value: 'water_source', label: 'Water Source' },
    { value: 'cleanup_stations', label: 'Clean Up Stations' },
];

export const publicToilets = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'family', label: 'Family' },
    { value: 'baby_changing_station', label: 'Baby Changing Station' },
    { value: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
    { value: 'porta_potti', label: 'Porta Potti' },
];

export const smoking = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'outdoor_area', label: 'Outdoor Area' },
    { value: 'specified_area', label: 'Specified Area' },
];

export const entertainment = [
    { value: 'live_music', label: 'Live Music' },
    { value: 'sports_on_tv', label: 'Sports on TV' },
    { value: 'free_wifi', label: 'Free Wifi' },
    { value: 'paid_wifi', label: 'Paid Wifi' },
    { value: 'game_night', label: 'Game Night' },
    { value: 'special_events', label: 'Special Events' },
];

export const alcohol = [
    { value: 'byob', label: 'BYOB' },
    { value: 'available_for_purchase', label: 'Available for Purchase' },
    { value: 'full_bar', label: 'Full Bar' },
    { value: 'beer_wine_only', label: 'Beer & Wine Only' },
    { value: 'happy_hour', label: 'Happy Hour' },
    { value: 'no_alcohol', label: 'No Alcohol Allowed' },
];

export const idealFor = [
    { value: 'all_ages', label: 'All Ages' },
    { value: 'families', label: 'Families' },
    { value: 'for_the_kids', label: 'For the Kids' },
    { value: 'pet_friendly', label: 'Pet Friendly' },
    { value: '18_plus', label: 'Ages 18+' },
    { value: '21_plus', label: 'Ages 21+' },
    { value: 'date_night', label: 'Date Night' },
    { value: 'large_groups', label: 'Large Groups (10+)' },
    { value: 'budget_friendly', label: 'Budget Friendly' },
    { value: 'luxury', label: 'Luxury' },
];

export const discounts = [
    { value: 'military', label: 'Military' },
    { value: 'veteran', label: 'Veteran' },
    { value: 'first_responder', label: 'First Responder' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
    { value: 'senior_55', label: 'Golden Years (55+)' },
];

export const businessTypes = [
    { value: 'brick_mortar', label: 'Brick and Mortar' },
    { value: 'online_only', label: 'Online Only' },
    { value: 'food_truck', label: 'Food Truck' },
    { value: 'pop_up', label: 'Pop Up' },
    { value: 'service_provider', label: 'Service Provider' },
    { value: 'retail_chain', label: 'Retail Chain' },
];


// --- OUTDOORS ---
export const outdoorTypes = [
    { value: 'boat_launch', label: 'Boat Launch' },
    { value: 'city_park', label: 'City Park' },
    { value: 'county_park', label: 'County Park' },
    { value: 'dog_park', label: 'Dog Park' },
    { value: 'historical', label: 'Historical' },
    { value: 'national_park', label: 'National Park' },
    { value: 'nature_preserve', label: 'Nature Preserve' },
    { value: 'state_park', label: 'State Park' },
    { value: 'trail', label: 'Trail' },
    { value: 'wildlife_refuge', label: 'Wildlife Refuge' },
];

export const facilities = [
    { value: 'amphitheater', label: 'Amphitheater' },
    { value: 'benches', label: 'Benches' },
    { value: 'bike_rack', label: 'Bike Rack' },
    { value: 'boat_ramp', label: 'Boat Ramp / Launch' },
    { value: 'drinking_fountain', label: 'Drinking Fountain' },
    { value: 'fire_pit', label: 'Fire Pit' },
    { value: 'fishing', label: 'Fishing Access' },
    { value: 'grill', label: 'Grill' },
    { value: 'picnic_area', label: 'Picnic Area' },
    { value: 'public_toilet', label: 'Public Toilet' },
    { value: 'wifi', label: 'Wifi' },
];

export const naturalFeatures = [
    { value: 'beach', label: 'Beach' },
    { value: 'cave', label: 'Cave' },
    { value: 'creek_stream', label: 'Creek / Stream' },
    { value: 'dam', label: 'Dam' },
    { value: 'island', label: 'Island' },
    { value: 'lake', label: 'Lake' },
    { value: 'mountain', label: 'Mountain' },
    { value: 'ocean', label: 'Ocean' },
    { value: 'pond', label: 'Pond' },
    { value: 'river', label: 'River' },
    { value: 'waterfall', label: 'Waterfall' },
    { value: 'wildflowers', label: 'Wildflowers' },
    { value: 'wooded', label: 'Wooded' },
];

export const thingsToDo = [
    { value: 'atv_dirt_bike', label: 'ATV & Dirt Bike Trail' },
    { value: 'baseball_softball', label: 'Baseball & Softball Fields' },
    { value: 'basketball', label: 'Basketball Courts' },
    { value: 'biking', label: 'Biking' },
    { value: 'boating', label: 'Boating' },
    { value: 'camping', label: 'Camping' },
    { value: 'canoeing', label: 'Canoeing' },
    { value: 'disc_golf', label: 'Disc Golf' },
    { value: 'fishing', label: 'Fishing' },
    { value: 'horseback_riding', label: 'Horseback Riding' },
    { value: 'kayaking', label: 'Kayaking' },
    { value: 'playground', label: 'Playground' },
    { value: 'rock_climbing', label: 'Rock Climbing' },
    { value: 'skateboarding', label: 'Skateboard Park' },
    { value: 'swimming', label: 'Swimming' },
    { value: 'tennis', label: 'Tennis Courts' },
    { value: 'trail_running_hiking', label: 'Trail Running / Hiking' },
    { value: 'volleyball', label: 'Volleyball' },
];