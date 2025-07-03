// Mock data for demo mode
export const mockPois = [
  {
    id: 1,
    name: "Downtown Coffee Shop",
    poi_type: "business",
    address_city: "Pittsboro",
    is_verified: true,
    description_short: "Cozy coffee shop in the heart of downtown",
    address_full: "123 Main St, Pittsboro, NC 27312"
  },
  {
    id: 2,
    name: "Jordan Lake State Park",
    poi_type: "park",
    address_city: "Apex",
    is_verified: true,
    description_short: "Beautiful state park with hiking trails and lake access",
    address_full: "280 State Park Rd, Apex, NC 27523"
  },
  {
    id: 3,
    name: "Chatham County Farmers Market",
    poi_type: "event",
    address_city: "Pittsboro",
    is_verified: false,
    description_short: "Weekly farmers market featuring local produce",
    address_full: "45 Hillsboro St, Pittsboro, NC 27312"
  },
  {
    id: 4,
    name: "Haw River Trail",
    poi_type: "trail",
    address_city: "Saxapahaw",
    is_verified: true,
    description_short: "Scenic hiking trail along the Haw River",
    address_full: "Haw River Trail, Saxapahaw, NC 27340"
  }
];

export const mockCategories = [
  { id: 1, name: "Restaurants", parent_id: null, applicable_to: ["business"] },
  { id: 2, name: "Coffee Shops", parent_id: 1, applicable_to: ["business"] },
  { id: 3, name: "State Parks", parent_id: null, applicable_to: ["park"] },
  { id: 4, name: "Hiking Trails", parent_id: null, applicable_to: ["trail"] },
  { id: 5, name: "Farmers Markets", parent_id: null, applicable_to: ["event"] }
];

export const mockAttributes = [
  { id: 1, name: "Pet Friendly", type: "AMENITY", applicable_to: ["business", "park"] },
  { id: 2, name: "Wheelchair Accessible", type: "AMENITY", applicable_to: ["business", "park", "trail"] },
  { id: 3, name: "Free Parking", type: "AMENITY", applicable_to: ["business", "park"] },
  { id: 4, name: "Credit Card", type: "PAYMENT_METHOD", applicable_to: ["business"] },
  { id: 5, name: "Cash Only", type: "PAYMENT_METHOD", applicable_to: ["business"] }
]; 