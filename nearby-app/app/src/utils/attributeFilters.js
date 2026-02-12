/**
 * Attribute-based search filters for POIs
 * Maps search keywords to POI data fields for intelligent filtering
 */

/**
 * Define attribute mappings: search keywords -> POI field checks
 * Each mapping includes:
 * - keywords: array of search terms that trigger this filter
 * - check: function that returns true if POI matches the attribute
 */
const ATTRIBUTE_FILTERS = [
  // Pet-related
  {
    keywords: ['pet', 'pets', 'pet friendly', 'pet-friendly', 'dog', 'dogs', 'dog friendly', 'dog-friendly', 'animal', 'animals'],
    check: (poi) => {
      // Check key_facilities for "Pet Friendly" (set via admin panel)
      if (poi.key_facilities && Array.isArray(poi.key_facilities)) {
        if (poi.key_facilities.some(f => f && f.toLowerCase().includes('pet'))) {
          return true;
        }
      }
      // Check pet_options and pet_policy
      if (poi.pet_options && Array.isArray(poi.pet_options) && poi.pet_options.length > 0) return true;
      if (typeof poi.pet_options === 'string' && poi.pet_options.trim().length > 0) return true;
      if (poi.pet_policy && typeof poi.pet_policy === 'string' && poi.pet_policy.trim().length > 0) return true;
      return false;
    }
  },

  // WiFi
  {
    keywords: ['wifi', 'wi-fi', 'wi fi', 'internet', 'wireless'],
    check: (poi) => {
      // Check key_facilities for "Wifi" (set via admin panel)
      if (poi.key_facilities && Array.isArray(poi.key_facilities)) {
        if (poi.key_facilities.some(f => f && f.toLowerCase() === 'wifi')) {
          return true;
        }
      }
      // Check wifi_options (for Events or manually set)
      if (poi.wifi_options) {
        if (Array.isArray(poi.wifi_options) && poi.wifi_options.length > 0) {
          return poi.wifi_options.some(opt => {
            const lower = (typeof opt === 'string' ? opt : '').toLowerCase();
            return lower !== 'no' && lower !== 'none' && lower !== 'no wifi' && lower.length > 0;
          });
        }
        if (typeof poi.wifi_options === 'string' && poi.wifi_options.trim().length > 0 && poi.wifi_options.toLowerCase() !== 'no' && poi.wifi_options.toLowerCase() !== 'none') return true;
      }
      // Check amenities arrays
      if (poi.amenities && Array.isArray(poi.amenities)) {
        return poi.amenities.some(a => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('wi-fi'));
      }
      if (poi.business_amenities && Array.isArray(poi.business_amenities)) {
        return poi.business_amenities.some(a => a.toLowerCase().includes('wifi') || a.toLowerCase().includes('wi-fi'));
      }
      return false;
    }
  },

  // Parking
  {
    keywords: ['parking', 'park', 'lot', 'garage', 'valet'],
    check: (poi) => {
      if (poi.parking_types && Array.isArray(poi.parking_types) && poi.parking_types.length > 0) return true;
      if (typeof poi.parking_types === 'string' && poi.parking_types.trim().length > 0) return true;
      if (poi.parking_notes && typeof poi.parking_notes === 'string' && poi.parking_notes.trim().length > 0) return true;
      if (poi.amenities && Array.isArray(poi.amenities)) {
        return poi.amenities.some(a => a.toLowerCase().includes('parking'));
      }
      return false;
    }
  },

  // Wheelchair/Accessibility
  {
    keywords: ['wheelchair', 'accessible', 'accessibility', 'handicap', 'disabled', 'ada', 'ramp'],
    check: (poi) => {
      // Check key_facilities for "Wheelchair Friendly"
      if (poi.key_facilities && Array.isArray(poi.key_facilities)) {
        if (poi.key_facilities.some(f => f && f.toLowerCase().includes('wheelchair'))) {
          return true;
        }
      }
      // Check wheelchair fields
      if (poi.wheelchair_accessible === true || poi.wheelchair_accessible === 'yes') return true;
      if (Array.isArray(poi.wheelchair_accessible) && poi.wheelchair_accessible.length > 0) return true;
      if (typeof poi.wheelchair_accessible === 'string' && poi.wheelchair_accessible.toLowerCase() !== 'no' && poi.wheelchair_accessible.trim().length > 0) return true;
      if (poi.wheelchair_details && typeof poi.wheelchair_details === 'string' && poi.wheelchair_details.trim().length > 0) return true;
      return false;
    }
  },

  // Restrooms/Bathrooms
  {
    keywords: ['restroom', 'restrooms', 'bathroom', 'bathrooms', 'toilet', 'toilets', 'washroom'],
    check: (poi) => {
      // Check key_facilities for "Public Restroom"
      if (poi.key_facilities && Array.isArray(poi.key_facilities)) {
        if (poi.key_facilities.some(f => f && (f.toLowerCase().includes('restroom') || f.toLowerCase().includes('bathroom') || f.toLowerCase().includes('toilet')))) {
          return true;
        }
      }
      // Check restroom fields
      if (poi.public_toilets === true || poi.public_toilets === 'yes') return true;
      if (Array.isArray(poi.public_toilets) && poi.public_toilets.length > 0) return true;
      if (typeof poi.public_toilets === 'string' && poi.public_toilets.toLowerCase() !== 'no' && poi.public_toilets.trim().length > 0) return true;
      if (poi.toilet_description && typeof poi.toilet_description === 'string' && poi.toilet_description.trim().length > 0) return true;
      if (poi.toilet_locations && typeof poi.toilet_locations === 'string' && poi.toilet_locations.trim().length > 0) return true;
      if (poi.amenities && Array.isArray(poi.amenities)) {
        return poi.amenities.some(a => a.toLowerCase().includes('restroom') || a.toLowerCase().includes('bathroom') || a.toLowerCase().includes('toilet'));
      }
      return false;
    }
  },

  // Playground
  {
    keywords: ['playground', 'play area', 'playarea', 'play ground', 'play structure'],
    check: (poi) => {
      if (poi.playground_available === true || poi.playground_available === 'yes') return true;
      if (poi.playground_types && Array.isArray(poi.playground_types) && poi.playground_types.length > 0) return true;
      if (typeof poi.playground_types === 'string' && poi.playground_types.trim().length > 0) return true;
      if (poi.playground_notes && typeof poi.playground_notes === 'string' && poi.playground_notes.trim().length > 0) return true;
      if (poi.amenities && Array.isArray(poi.amenities)) {
        return poi.amenities.some(a => a.toLowerCase().includes('playground') || a.toLowerCase().includes('play'));
      }
      return false;
    }
  },

  // Alcohol
  {
    keywords: ['alcohol', 'beer', 'wine', 'liquor', 'bar', 'drinks', 'cocktails', 'spirits'],
    check: (poi) => {
      if (poi.alcohol_options && Array.isArray(poi.alcohol_options) && poi.alcohol_options.length > 0) return true;
      if (typeof poi.alcohol_options === 'string' && poi.alcohol_options.toLowerCase() !== 'no' && poi.alcohol_options.toLowerCase() !== 'none' && poi.alcohol_options.trim().length > 0) return true;
      if (poi.alcohol_description && typeof poi.alcohol_description === 'string' && poi.alcohol_description.trim().length > 0) return true;
      return false;
    }
  },

  // Outdoor seating / patio
  {
    keywords: ['outdoor', 'outdoor seating', 'patio', 'terrace', 'outside', 'al fresco'],
    check: (poi) => {
      if (poi.amenities && Array.isArray(poi.amenities)) {
        return poi.amenities.some(a => {
          const lower = a.toLowerCase();
          return lower.includes('outdoor') || lower.includes('patio') || lower.includes('terrace') || lower.includes('outside');
        });
      }
      if (poi.business_amenities && Array.isArray(poi.business_amenities)) {
        return poi.business_amenities.some(a => {
          const lower = a.toLowerCase();
          return lower.includes('outdoor') || lower.includes('patio') || lower.includes('terrace') || lower.includes('outside');
        });
      }
      return false;
    }
  },

  // Bike-related
  {
    keywords: ['bike', 'bicycle', 'cycling', 'bike rack', 'bike parking'],
    check: (poi) => {
      if (poi.amenities && Array.isArray(poi.amenities)) {
        return poi.amenities.some(a => a.toLowerCase().includes('bike') || a.toLowerCase().includes('bicycle'));
      }
      if (poi.business_amenities && Array.isArray(poi.business_amenities)) {
        return poi.business_amenities.some(a => a.toLowerCase().includes('bike') || a.toLowerCase().includes('bicycle'));
      }
      return false;
    }
  },

  // Rental/Available for rent
  {
    keywords: ['rental', 'rent', 'for rent', 'book', 'booking', 'reserve space'],
    check: (poi) => {
      if (poi.available_for_rent === true || poi.available_for_rent === 'yes') return true;
      if (poi.rental_info && typeof poi.rental_info === 'string' && poi.rental_info.trim().length > 0) return true;
      if (poi.rental_pricing && typeof poi.rental_pricing === 'string' && poi.rental_pricing.trim().length > 0) return true;
      if (poi.rental_link && typeof poi.rental_link === 'string' && poi.rental_link.trim().length > 0) return true;
      return false;
    }
  },

  // Food/Dining
  {
    keywords: ['food', 'dining', 'restaurant', 'eat', 'eating', 'meal', 'menu'],
    check: (poi) => {
      if (poi.menu_link && typeof poi.menu_link === 'string' && poi.menu_link.trim().length > 0) return true;
      if (poi.categories && Array.isArray(poi.categories)) {
        return poi.categories.some(cat => {
          const name = cat.name || cat.category?.name || '';
          const lower = name.toLowerCase();
          return lower.includes('restaurant') || lower.includes('food') || lower.includes('dining') || lower.includes('cafe') || lower.includes('eatery');
        });
      }
      return false;
    }
  },

  // Coffee/Cafe
  {
    keywords: ['coffee', 'cafe', 'café', 'espresso', 'latte', 'cappuccino'],
    check: (poi) => {
      if (poi.categories && Array.isArray(poi.categories)) {
        return poi.categories.some(cat => {
          const name = cat.name || cat.category?.name || '';
          const lower = name.toLowerCase();
          return lower.includes('coffee') || lower.includes('cafe') || lower.includes('café');
        });
      }
      const poiName = poi.name || '';
      return poiName.toLowerCase().includes('coffee') || poiName.toLowerCase().includes('cafe') || poiName.toLowerCase().includes('café');
    }
  },

  // Reservations/Appointments
  {
    keywords: ['reservation', 'reservations', 'appointment', 'appointments', 'booking'],
    check: (poi) => {
      if (poi.reservation_links && Array.isArray(poi.reservation_links) && poi.reservation_links.length > 0) return true;
      if (typeof poi.reservation_links === 'string' && poi.reservation_links.trim().length > 0) return true;
      if (poi.appointment_links && Array.isArray(poi.appointment_links) && poi.appointment_links.length > 0) return true;
      if (poi.appointment_booking_url && typeof poi.appointment_booking_url === 'string' && poi.appointment_booking_url.trim().length > 0) return true;
      if (poi.appointment_url && typeof poi.appointment_url === 'string' && poi.appointment_url.trim().length > 0) return true;
      return false;
    }
  },

  // Delivery
  {
    keywords: ['delivery', 'deliver', 'delivered', 'takeout', 'take out', 'to go'],
    check: (poi) => {
      if (poi.delivery_links && Array.isArray(poi.delivery_links) && poi.delivery_links.length > 0) return true;
      if (typeof poi.delivery_links === 'string' && poi.delivery_links.trim().length > 0) return true;
      if (poi.online_ordering_links && Array.isArray(poi.online_ordering_links) && poi.online_ordering_links.length > 0) return true;
      if (typeof poi.online_ordering_links === 'string' && poi.online_ordering_links.trim().length > 0) return true;
      return false;
    }
  },

  // Gift cards
  {
    keywords: ['gift card', 'gift cards', 'giftcard', 'giftcards'],
    check: (poi) => {
      if (poi.gift_cards_available === true || poi.gift_cards_available === 'yes') return true;
      if (typeof poi.gift_cards_available === 'string' && poi.gift_cards_available.toLowerCase() !== 'no' && poi.gift_cards_available.toLowerCase() !== 'none' && poi.gift_cards_available.trim().length > 0) return true;
      return false;
    }
  },

  // Discounts
  {
    keywords: ['discount', 'discounts', 'deal', 'deals', 'special', 'specials', 'promotion'],
    check: (poi) => {
      if (poi.discounts_offered && Array.isArray(poi.discounts_offered) && poi.discounts_offered.length > 0) return true;
      if (typeof poi.discounts_offered === 'string' && poi.discounts_offered.trim().length > 0) return true;
      if (poi.discount_description && typeof poi.discount_description === 'string' && poi.discount_description.trim().length > 0) return true;
      return false;
    }
  },

  // Family-friendly
  {
    keywords: ['family', 'family friendly', 'family-friendly', 'kid friendly', 'kid-friendly', 'kids', 'children'],
    check: (poi) => {
      if (poi.ideal_for) {
        const idealFor = Array.isArray(poi.ideal_for) ? poi.ideal_for : [poi.ideal_for];
        if (idealFor.some(i => i.toLowerCase().includes('family') || i.toLowerCase().includes('kid') || i.toLowerCase().includes('children'))) return true;
      }
      if (poi.categories && Array.isArray(poi.categories)) {
        return poi.categories.some(cat => {
          const name = cat.name || cat.category?.name || '';
          const lower = name.toLowerCase();
          return lower.includes('family') || lower.includes('kid') || lower.includes('children') || lower.includes('youth');
        });
      }
      if (poi.playground_available === true || poi.playground_available === 'yes') return true;
      return false;
    }
  },

  // Smoking
  {
    keywords: ['smoking', 'smoke', 'cigarette', 'cigar', 'tobacco'],
    check: (poi) => {
      if (poi.smoking_options && Array.isArray(poi.smoking_options) && poi.smoking_options.length > 0) {
        // Check if any option allows smoking (not just "no smoking")
        return poi.smoking_options.some(opt => {
          const lower = opt.toLowerCase();
          return !lower.includes('no') && (lower.includes('yes') || lower.includes('allowed') || lower.includes('permitted'));
        });
      }
      if (typeof poi.smoking_options === 'string' && poi.smoking_options.toLowerCase().includes('yes')) return true;
      if (poi.smoking_details && typeof poi.smoking_details === 'string' && poi.smoking_details.trim().length > 0) return true;
      return false;
    }
  },

  // Price-related (cheap, affordable, expensive, etc.)
  {
    keywords: ['cheap', 'affordable', 'budget', 'inexpensive', 'low cost', 'value'],
    check: (poi) => {
      if (poi.price_range_per_person) {
        const price = poi.price_range_per_person.toLowerCase();
        return price.includes('$') && !price.includes('$$'); // Single $ sign
      }
      return false;
    }
  },
  {
    keywords: ['expensive', 'upscale', 'fine dining', 'luxury', 'high end', 'pricey'],
    check: (poi) => {
      if (poi.price_range_per_person) {
        const price = poi.price_range_per_person.toLowerCase();
        return price.includes('$$$') || price.includes('$$$$'); // 3 or 4 dollar signs
      }
      return false;
    }
  },

  // Open now / hours-related
  {
    keywords: ['open now', 'open today', 'currently open'],
    check: (poi) => {
      if (!poi.hours || !poi.hours.regular) return false;

      const now = new Date();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[now.getDay()];
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const dayHours = poi.hours.regular[dayName];
      if (!dayHours || dayHours.status === 'closed') return false;

      if (dayHours.status === 'open_24_hours' || dayHours.status === '24_hours') return true;

      if (dayHours.open_time && dayHours.close_time) {
        const [openHour, openMin] = dayHours.open_time.split(':').map(Number);
        const [closeHour, closeMin] = dayHours.close_time.split(':').map(Number);
        const openMinutes = openHour * 60 + openMin;
        const closeMinutes = closeHour * 60 + closeMin;

        if (closeMinutes < openMinutes) {
          // Crosses midnight
          return currentTime >= openMinutes || currentTime <= closeMinutes;
        } else {
          return currentTime >= openMinutes && currentTime <= closeMinutes;
        }
      }

      return false;
    }
  }
];

/**
 * Check if a search query matches any attribute filters
 * @param {string} query - The search query
 * @param {object} poi - The POI object to check
 * @returns {boolean} - True if POI matches the attribute query
 */
export function matchesAttributeFilter(query, poi) {
  if (!query || !poi) return false;

  const lowerQuery = query.toLowerCase().trim();

  // Find matching attribute filters
  const matchingFilters = ATTRIBUTE_FILTERS.filter(filter =>
    filter.keywords.some(keyword => lowerQuery.includes(keyword))
  );

  // If no attribute filters match, return true (allow text search to handle it)
  if (matchingFilters.length === 0) return true;

  // Check if POI matches ALL matching attribute filters
  return matchingFilters.every(filter => filter.check(poi));
}

/**
 * Detect if a query contains attribute keywords
 * @param {string} query - The search query
 * @returns {boolean} - True if query contains attribute keywords
 */
export function hasAttributeKeywords(query) {
  if (!query) return false;

  const lowerQuery = query.toLowerCase().trim();

  return ATTRIBUTE_FILTERS.some(filter =>
    filter.keywords.some(keyword => lowerQuery.includes(keyword))
  );
}

/**
 * Apply attribute filtering to an array of POIs
 * @param {string} query - The search query
 * @param {array} pois - Array of POI objects
 * @returns {array} - Filtered array of POIs
 */
export function filterPOIsByAttributes(query, pois) {
  if (!query || !Array.isArray(pois)) return pois;

  return pois.filter(poi => matchesAttributeFilter(query, poi));
}
