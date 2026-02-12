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
  },

  // ===== NEW COMPREHENSIVE FILTERS =====

  // Fishing
  {
    keywords: ['fishing', 'fish', 'fishing allowed', 'catch and release', 'catch and keep', 'angling'],
    check: (poi) => {
      if (poi.fishing_allowed && poi.fishing_allowed !== 'no') return true;
      if (poi.fishing_types && Array.isArray(poi.fishing_types) && poi.fishing_types.length > 0) return true;
      if (poi.hunting_fishing_info && typeof poi.hunting_fishing_info === 'string' && poi.hunting_fishing_info.toLowerCase().includes('fish')) return true;
      return false;
    }
  },

  // Hunting
  {
    keywords: ['hunting', 'hunt', 'hunting allowed', 'game', 'deer hunting', 'turkey hunting'],
    check: (poi) => {
      if (poi.hunting_fishing_allowed && poi.hunting_fishing_allowed !== 'no') return true;
      if (poi.hunting_types && Array.isArray(poi.hunting_types) && poi.hunting_types.length > 0) return true;
      if (poi.hunting_fishing_info && typeof poi.hunting_fishing_info === 'string' && poi.hunting_fishing_info.toLowerCase().includes('hunt')) return true;
      return false;
    }
  },

  // Drones
  {
    keywords: ['drone', 'drones', 'drone friendly', 'uav', 'quadcopter', 'drone allowed'],
    check: (poi) => {
      if (poi.drone_usage && poi.drone_usage !== 'no' && poi.drone_usage !== 'not allowed' && poi.drone_usage.trim().length > 0) return true;
      if (poi.drone_policy && typeof poi.drone_policy === 'string' && poi.drone_policy.trim().length > 0 && !poi.drone_policy.toLowerCase().includes('not allowed') && !poi.drone_policy.toLowerCase().includes('prohibited')) return true;
      return false;
    }
  },

  // Camping / Lodging
  {
    keywords: ['camping', 'camp', 'campground', 'campsite', 'lodging', 'overnight', 'overnight stay'],
    check: (poi) => {
      if (poi.camping_lodging && typeof poi.camping_lodging === 'string' && poi.camping_lodging.trim().length > 0) return true;
      if (poi.things_to_do && Array.isArray(poi.things_to_do)) {
        return poi.things_to_do.some(t => t.toLowerCase().includes('camp'));
      }
      return false;
    }
  },

  // Stargazing / Night Sky
  {
    keywords: ['stargazing', 'stars', 'night sky', 'astronomy', 'dark sky', 'star viewing'],
    check: (poi) => {
      if (poi.night_sky_viewing && typeof poi.night_sky_viewing === 'string' && poi.night_sky_viewing.trim().length > 0) return true;
      if (poi.things_to_do && Array.isArray(poi.things_to_do)) {
        return poi.things_to_do.some(t => {
          const lower = t.toLowerCase();
          return lower.includes('star') || lower.includes('astronomy') || lower.includes('night sky');
        });
      }
      return false;
    }
  },

  // Natural Features (waterfall, lake, mountain, etc.)
  {
    keywords: ['waterfall', 'waterfalls', 'lake', 'river', 'stream', 'mountain', 'mountain view', 'scenic', 'vista', 'overlook', 'viewpoint'],
    check: (poi) => {
      if (poi.natural_features && Array.isArray(poi.natural_features) && poi.natural_features.length > 0) return true;
      return false;
    }
  },

  // Bird Watching / Wildlife
  {
    keywords: ['bird watching', 'birding', 'birds', 'wildlife', 'wildlife viewing', 'nature watching', 'bird', 'birdwatching'],
    check: (poi) => {
      if (poi.birding_wildlife && typeof poi.birding_wildlife === 'string' && poi.birding_wildlife.trim().length > 0) return true;
      if (poi.things_to_do && Array.isArray(poi.things_to_do)) {
        return poi.things_to_do.some(t => {
          const lower = t.toLowerCase();
          return lower.includes('bird') || lower.includes('wildlife');
        });
      }
      return false;
    }
  },

  // Hiking / Trails
  {
    keywords: ['hiking', 'hike', 'trail', 'trails', 'walking', 'trekking', 'hiking trail'],
    check: (poi) => {
      if (poi.poi_type === 'trail') return true;
      if (poi.things_to_do && Array.isArray(poi.things_to_do)) {
        return poi.things_to_do.some(t => {
          const lower = t.toLowerCase();
          return lower.includes('hik') || lower.includes('trail') || lower.includes('walk');
        });
      }
      if (poi.associated_trails && Array.isArray(poi.associated_trails) && poi.associated_trails.length > 0) return true;
      return false;
    }
  },

  // Kayaking / Paddling / Water Activities
  {
    keywords: ['kayak', 'kayaking', 'canoe', 'canoeing', 'paddling', 'paddle', 'boating', 'boat', 'water sports', 'paddleboard'],
    check: (poi) => {
      if (poi.things_to_do && Array.isArray(poi.things_to_do)) {
        return poi.things_to_do.some(t => {
          const lower = t.toLowerCase();
          return lower.includes('kayak') || lower.includes('canoe') || lower.includes('paddle') || lower.includes('boat');
        });
      }
      return false;
    }
  },

  // Swimming
  {
    keywords: ['swimming', 'swim', 'swimming pool', 'pool', 'swim area'],
    check: (poi) => {
      if (poi.things_to_do && Array.isArray(poi.things_to_do)) {
        return poi.things_to_do.some(t => t.toLowerCase().includes('swim'));
      }
      if (poi.facilities_options && Array.isArray(poi.facilities_options)) {
        return poi.facilities_options.some(f => f.toLowerCase().includes('pool') || f.toLowerCase().includes('swim'));
      }
      return false;
    }
  },

  // Public Transit
  {
    keywords: ['public transit', 'bus', 'metro', 'subway', 'train', 'light rail', 'transit', 'public transportation'],
    check: (poi) => {
      if (poi.public_transit_info && typeof poi.public_transit_info === 'string' && poi.public_transit_info.trim().length > 0) return true;
      return false;
    }
  },

  // Paid Parking
  {
    keywords: ['paid parking', 'parking fee', 'parking cost', 'pay for parking'],
    check: (poi) => {
      if (poi.expect_to_pay_parking === 'yes') return true;
      if (poi.parking_notes && typeof poi.parking_notes === 'string') {
        const lower = poi.parking_notes.toLowerCase();
        return lower.includes('fee') || lower.includes('paid') || lower.includes('$');
      }
      return false;
    }
  },

  // Free Parking
  {
    keywords: ['free parking', 'no parking fee', 'complimentary parking'],
    check: (poi) => {
      if (poi.expect_to_pay_parking === 'no') return true;
      if (poi.parking_notes && typeof poi.parking_notes === 'string' && poi.parking_notes.toLowerCase().includes('free')) return true;
      if (poi.parking_types && Array.isArray(poi.parking_types) && poi.parking_types.length > 0 && poi.expect_to_pay_parking !== 'yes') return true;
      return false;
    }
  },

  // Picnic Areas / Pavilions
  {
    keywords: ['picnic', 'picnic area', 'pavilion', 'shelter', 'covered area', 'picnic table'],
    check: (poi) => {
      if (poi.facilities_options && Array.isArray(poi.facilities_options)) {
        return poi.facilities_options.some(f => {
          const lower = f.toLowerCase();
          return lower.includes('picnic') || lower.includes('pavilion') || lower.includes('shelter');
        });
      }
      if (poi.amenities && Array.isArray(poi.amenities)) {
        return poi.amenities.some(a => a.toLowerCase().includes('picnic'));
      }
      return false;
    }
  },

  // Youth Amenities (changing tables, high chairs, etc.)
  {
    keywords: ['changing table', 'high chair', 'highchair', 'kids menu', 'booster seat', 'diaper changing'],
    check: (poi) => {
      if (poi.youth_amenities && Array.isArray(poi.youth_amenities) && poi.youth_amenities.length > 0) return true;
      return false;
    }
  },

  // Entertainment / Live Music
  {
    keywords: ['live music', 'entertainment', 'trivia', 'karaoke', 'games', 'pool table', 'darts', 'live band', 'dj'],
    check: (poi) => {
      if (poi.entertainment_options && Array.isArray(poi.entertainment_options) && poi.entertainment_options.length > 0) return true;
      return false;
    }
  },

  // Membership / Pass Required
  {
    keywords: ['membership', 'pass', 'membership required', 'annual pass', 'member'],
    check: (poi) => {
      if (poi.membership_passes && Array.isArray(poi.membership_passes) && poi.membership_passes.length > 0) return true;
      if (poi.membership_details && typeof poi.membership_details === 'string' && poi.membership_details.trim().length > 0) return true;
      return false;
    }
  },

  // Maps / Trail Maps
  {
    keywords: ['map', 'trail map', 'downloadable map', 'park map', 'maps'],
    check: (poi) => {
      if (poi.downloadable_maps && Array.isArray(poi.downloadable_maps) && poi.downloadable_maps.length > 0) return true;
      return false;
    }
  },

  // Payphone
  {
    keywords: ['payphone', 'pay phone', 'phone', 'public phone'],
    check: (poi) => {
      if (poi.payphone_location) return true;
      if (poi.payphone_locations && Array.isArray(poi.payphone_locations) && poi.payphone_locations.length > 0) return true;
      return false;
    }
  },

  // Garden / Outdoor Spaces
  {
    keywords: ['garden', 'courtyard', 'rooftop', 'deck', 'gardens'],
    check: (poi) => {
      if (poi.outdoor_types && Array.isArray(poi.outdoor_types)) {
        return poi.outdoor_types.some(t => {
          const lower = t.toLowerCase();
          return lower.includes('garden') || lower.includes('courtyard') || lower.includes('rooftop') || lower.includes('deck');
        });
      }
      return false;
    }
  },

  // Licenses / Permits Required
  {
    keywords: ['license required', 'permit required', 'permit', 'license', 'pre-approval'],
    check: (poi) => {
      if (poi.licenses_required && Array.isArray(poi.licenses_required) && poi.licenses_required.length > 0) return true;
      if (poi.compliance && poi.compliance.pre_approval_required === true) return true;
      return false;
    }
  },

  // Trail Difficulty
  {
    keywords: ['easy trail', 'moderate trail', 'difficult trail', 'hard trail', 'challenging trail', 'beginner trail'],
    check: (poi) => {
      if (!poi.difficulty) return false;
      const query = ['easy trail', 'moderate trail', 'difficult trail', 'hard trail', 'challenging trail', 'beginner trail'];
      const difficulty = poi.difficulty.toLowerCase();

      // Match based on what user searched
      if (difficulty.includes('easy') || difficulty.includes('beginner')) {
        return query.some(q => q.includes('easy') || q.includes('beginner'));
      }
      if (difficulty.includes('moderate') || difficulty.includes('medium')) {
        return query.some(q => q.includes('moderate'));
      }
      if (difficulty.includes('difficult') || difficulty.includes('hard') || difficulty.includes('challenging')) {
        return query.some(q => q.includes('difficult') || q.includes('hard') || q.includes('challenging'));
      }
      return true; // If difficulty exists, show it for any difficulty search
    }
  },

  // Trail Length
  {
    keywords: ['short trail', 'long trail', 'mile trail', 'km trail'],
    check: (poi) => {
      if (poi.length_text && typeof poi.length_text === 'string' && poi.length_text.trim().length > 0) return true;
      return false;
    }
  },

  // Trail Type
  {
    keywords: ['loop trail', 'out and back', 'point to point', 'circuit'],
    check: (poi) => {
      if (poi.route_type && typeof poi.route_type === 'string' && poi.route_type.trim().length > 0) return true;
      return false;
    }
  },

  // Trail Surface
  {
    keywords: ['paved trail', 'paved', 'gravel', 'dirt trail', 'natural surface'],
    check: (poi) => {
      if (poi.trail_surfaces && Array.isArray(poi.trail_surfaces) && poi.trail_surfaces.length > 0) return true;
      return false;
    }
  },

  // Event Tickets
  {
    keywords: ['tickets', 'buy tickets', 'ticket', 'ticketed event'],
    check: (poi) => {
      if (poi.ticket_link && typeof poi.ticket_link === 'string' && poi.ticket_link.trim().length > 0) return true;
      return false;
    }
  },

  // Vendors (for events)
  {
    keywords: ['vendors', 'vendor', 'food vendors', 'craft vendors', 'market'],
    check: (poi) => {
      if (poi.has_vendors === true) return true;
      if (poi.vendor_types && Array.isArray(poi.vendor_types) && poi.vendor_types.length > 0) return true;
      return false;
    }
  },

  // Coat Check
  {
    keywords: ['coat check', 'coat room', 'cloakroom'],
    check: (poi) => {
      if (poi.coat_check_options && Array.isArray(poi.coat_check_options) && poi.coat_check_options.length > 0) return true;
      return false;
    }
  },

  // Appointment Required
  {
    keywords: ['appointment required', 'appointment only', 'by appointment'],
    check: (poi) => {
      if (poi.hours_but_appointment_required === true) return true;
      return false;
    }
  },

  // Cash Only / Payment Methods
  {
    keywords: ['cash only', 'credit card', 'debit card', 'apple pay', 'contactless'],
    check: (poi) => {
      if (poi.payment_methods && Array.isArray(poi.payment_methods) && poi.payment_methods.length > 0) return true;
      return false;
    }
  },

  // ===== ADDITIONAL COMPREHENSIVE FILTERS (ALL REMAINING FIELDS) =====

  // Articles / Resources
  {
    keywords: ['article', 'articles', 'resource', 'resources', 'blog', 'news', 'reading'],
    check: (poi) => {
      if (poi.article_links && Array.isArray(poi.article_links) && poi.article_links.length > 0) return true;
      return false;
    }
  },

  // Business Entry Notes
  {
    keywords: ['business entry', 'entry requirements', 'entry notes', 'entrance requirements'],
    check: (poi) => {
      if (poi.business_entry_notes && typeof poi.business_entry_notes === 'string' && poi.business_entry_notes.trim().length > 0) return true;
      return false;
    }
  },

  // Event Entry Notes
  {
    keywords: ['event entry', 'event requirements', 'event entry notes'],
    check: (poi) => {
      if (poi.event_entry_notes && typeof poi.event_entry_notes === 'string' && poi.event_entry_notes.trim().length > 0) return true;
      return false;
    }
  },

  // Park Entry Notes
  {
    keywords: ['park entry', 'park requirements', 'park entry notes', 'park entrance'],
    check: (poi) => {
      if (poi.park_entry_notes && typeof poi.park_entry_notes === 'string' && poi.park_entry_notes.trim().length > 0) return true;
      return false;
    }
  },

  // Community Impact
  {
    keywords: ['community impact', 'community', 'social impact', 'local impact', 'community service'],
    check: (poi) => {
      if (poi.community_impact && typeof poi.community_impact === 'string' && poi.community_impact.trim().length > 0) return true;
      return false;
    }
  },

  // Cost / Pricing
  {
    keywords: ['cost', 'costs', 'price', 'prices', 'pricing', 'how much', 'fee', 'fees'],
    check: (poi) => {
      if (poi.cost && typeof poi.cost === 'string' && poi.cost.trim().length > 0) return true;
      if (poi.pricing && typeof poi.pricing === 'string' && poi.pricing.trim().length > 0) return true;
      if (poi.pricing_details && typeof poi.pricing_details === 'string' && poi.pricing_details.trim().length > 0) return true;
      if (poi.price_range && typeof poi.price_range === 'string' && poi.price_range.trim().length > 0) return true;
      return false;
    }
  },

  // Discounts
  {
    keywords: ['discount', 'discounts', 'sale', 'deals', 'promotion', 'special offer'],
    check: (poi) => {
      if (poi.discounts && typeof poi.discounts === 'string' && poi.discounts.trim().length > 0) return true;
      if (poi.discounts && Array.isArray(poi.discounts) && poi.discounts.length > 0) return true;
      return false;
    }
  },

  // Gift Cards
  {
    keywords: ['gift card', 'gift cards', 'gift certificate'],
    check: (poi) => {
      if (poi.gift_cards && typeof poi.gift_cards === 'string' && poi.gift_cards.trim().length > 0) return true;
      if (poi.gift_cards === true) return true;
      return false;
    }
  },

  // Food & Drink Info
  {
    keywords: ['food', 'drink', 'restaurant', 'cafe', 'bar', 'dining', 'food and drink'],
    check: (poi) => {
      if (poi.food_and_drink_info && typeof poi.food_and_drink_info === 'string' && poi.food_and_drink_info.trim().length > 0) return true;
      return false;
    }
  },

  // Emergency Protocols
  {
    keywords: ['emergency', 'emergency protocols', 'safety', 'first aid', 'emergency contact'],
    check: (poi) => {
      if (poi.emergency_protocols && typeof poi.emergency_protocols === 'string' && poi.emergency_protocols.trim().length > 0) return true;
      return false;
    }
  },

  // Disaster Hub
  {
    keywords: ['disaster hub', 'emergency shelter', 'disaster shelter', 'emergency hub'],
    check: (poi) => {
      if (poi.is_disaster_hub === true) return true;
      return false;
    }
  },

  // Organization Memberships
  {
    keywords: ['organization', 'organizations', 'member of', 'affiliated with', 'organization membership'],
    check: (poi) => {
      if (poi.organization_memberships && Array.isArray(poi.organization_memberships) && poi.organization_memberships.length > 0) return true;
      return false;
    }
  },

  // Trail Difficulty Description
  {
    keywords: ['difficulty description', 'difficulty details', 'trail difficulty details'],
    check: (poi) => {
      if (poi.difficulty_description && typeof poi.difficulty_description === 'string' && poi.difficulty_description.trim().length > 0) return true;
      return false;
    }
  },

  // Trail Conditions
  {
    keywords: ['trail conditions', 'trail condition', 'path conditions', 'current conditions'],
    check: (poi) => {
      if (poi.trail_conditions && typeof poi.trail_conditions === 'string' && poi.trail_conditions.trim().length > 0) return true;
      return false;
    }
  },

  // Trail Experiences
  {
    keywords: ['trail experience', 'trail experiences', 'hiking experience'],
    check: (poi) => {
      if (poi.trail_experiences && Array.isArray(poi.trail_experiences) && poi.trail_experiences.length > 0) return true;
      return false;
    }
  },

  // Trail Markings
  {
    keywords: ['trail markings', 'trail markers', 'blazes', 'signage', 'trail signs'],
    check: (poi) => {
      if (poi.trail_markings && Array.isArray(poi.trail_markings) && poi.trail_markings.length > 0) return true;
      return false;
    }
  },

  // Trailhead Access Details
  {
    keywords: ['trailhead', 'trailhead access', 'trail access', 'trailhead parking', 'trailhead details'],
    check: (poi) => {
      if (poi.trailhead_access_details && typeof poi.trailhead_access_details === 'string' && poi.trailhead_access_details.trim().length > 0) return true;
      return false;
    }
  },

  // Downloadable Trail Map
  {
    keywords: ['trail map', 'downloadable trail map', 'trail pdf', 'trail guide'],
    check: (poi) => {
      if (poi.downloadable_trail_map && typeof poi.downloadable_trail_map === 'string' && poi.downloadable_trail_map.trim().length > 0) return true;
      return false;
    }
  },

  // Trail Length Segments
  {
    keywords: ['trail segments', 'trail sections', 'segment', 'sections'],
    check: (poi) => {
      if (poi.length_segments && Array.isArray(poi.length_segments) && poi.length_segments.length > 0) return true;
      return false;
    }
  },

  // Playground Surface Types
  {
    keywords: ['playground surface', 'play surface', 'surface type', 'rubber surface', 'wood chips'],
    check: (poi) => {
      if (poi.playground_surface_types && Array.isArray(poi.playground_surface_types) && poi.playground_surface_types.length > 0) return true;
      return false;
    }
  },

  // Drone Usage Policy (comprehensive)
  {
    keywords: ['drone policy', 'drone usage policy', 'drone rules', 'uav policy'],
    check: (poi) => {
      if (poi.drone_usage_policy && typeof poi.drone_usage_policy === 'string' && poi.drone_usage_policy.trim().length > 0) return true;
      return false;
    }
  },

  // Venue Settings
  {
    keywords: ['venue', 'venue settings', 'venue type', 'indoor venue', 'outdoor venue'],
    check: (poi) => {
      if (poi.venue_settings && typeof poi.venue_settings === 'string' && poi.venue_settings.trim().length > 0) return true;
      if (poi.venue_settings && typeof poi.venue_settings === 'object' && Object.keys(poi.venue_settings).length > 0) return true;
      return false;
    }
  },

  // Vendor Application Info
  {
    keywords: ['vendor application', 'vendor apply', 'become a vendor', 'vendor info'],
    check: (poi) => {
      if (poi.vendor_application_info && typeof poi.vendor_application_info === 'string' && poi.vendor_application_info.trim().length > 0) return true;
      if (poi.vendor_application_deadline && typeof poi.vendor_application_deadline === 'string' && poi.vendor_application_deadline.trim().length > 0) return true;
      if (poi.vendor_requirements && typeof poi.vendor_requirements === 'string' && poi.vendor_requirements.trim().length > 0) return true;
      if (poi.vendor_fee && typeof poi.vendor_fee === 'string' && poi.vendor_fee.trim().length > 0) return true;
      return false;
    }
  },

  // Vendor POI Links
  {
    keywords: ['vendor links', 'vendor pois', 'vendor locations'],
    check: (poi) => {
      if (poi.vendor_poi_links && Array.isArray(poi.vendor_poi_links) && poi.vendor_poi_links.length > 0) return true;
      return false;
    }
  },

  // Listing Type
  {
    keywords: ['listing type', 'type of listing', 'listing category'],
    check: (poi) => {
      if (poi.listing_type && typeof poi.listing_type === 'string' && poi.listing_type.trim().length > 0) return true;
      return false;
    }
  },

  // Locally Found At
  {
    keywords: ['locally found', 'find locally', 'local availability', 'where to find'],
    check: (poi) => {
      if (poi.locally_found_at && typeof poi.locally_found_at === 'string' && poi.locally_found_at.trim().length > 0) return true;
      if (poi.locally_found_at && Array.isArray(poi.locally_found_at) && poi.locally_found_at.length > 0) return true;
      return false;
    }
  },

  // Other Socials
  {
    keywords: ['social media', 'socials', 'social links', 'follow us'],
    check: (poi) => {
      if (poi.other_socials && Array.isArray(poi.other_socials) && poi.other_socials.length > 0) return true;
      if (poi.other_socials && typeof poi.other_socials === 'object' && Object.keys(poi.other_socials).length > 0) return true;
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
