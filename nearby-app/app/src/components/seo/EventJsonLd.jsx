/**
 * Schema.org Event structured data component
 * Full implementation following https://schema.org/Event
 *
 * This component renders a JSON-LD script tag with event structured data
 * to help search engines understand and display event information.
 */

function EventJsonLd({ poi }) {
  if (!poi || !poi.event) return null;

  const baseUrl = window.location.origin;
  const eventUrl = `${baseUrl}/event/${poi.id}`;

  // Helper to format ISO datetime
  const formatISODate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toISOString();
    } catch {
      return null;
    }
  };

  // Helper to get image URL
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.url) return image.url;
    if (image.thumbnail_url) return image.thumbnail_url;
    return null;
  };

  // Build location object
  const buildLocation = () => {
    const location = {
      "@type": "Place",
      name: poi.event?.venue_name || poi.name
    };

    // Add address
    if (poi.address_street || poi.address_city) {
      location.address = {
        "@type": "PostalAddress"
      };
      if (poi.address_street) location.address.streetAddress = poi.address_street;
      if (poi.address_city) location.address.addressLocality = poi.address_city;
      if (poi.address_state) location.address.addressRegion = poi.address_state;
      if (poi.address_zip) location.address.postalCode = poi.address_zip;
      if (poi.address_county) location.address.addressCountry = "US";
    }

    // Add coordinates
    if (poi.front_door_latitude && poi.front_door_longitude) {
      location.geo = {
        "@type": "GeoCoordinates",
        latitude: poi.front_door_latitude,
        longitude: poi.front_door_longitude
      };
    } else if (poi.location?.coordinates) {
      location.geo = {
        "@type": "GeoCoordinates",
        latitude: poi.location.coordinates[1],
        longitude: poi.location.coordinates[0]
      };
    }

    return location;
  };

  // Build organizer object
  const buildOrganizer = () => {
    if (!poi.event?.organizer_name) return null;

    return {
      "@type": "Organization",
      name: poi.event.organizer_name,
      ...(poi.website_url && { url: poi.website_url.startsWith('http') ? poi.website_url : `https://${poi.website_url}` }),
      ...(poi.email && { email: poi.email }),
      ...(poi.phone_number && { telephone: poi.phone_number })
    };
  };

  // Build offers array
  const buildOffers = () => {
    const offers = [];

    // If we have event cost information
    if (poi.event?.cost_range_min !== null || poi.event?.cost_range_max !== null) {
      const offer = {
        "@type": "Offer",
        url: eventUrl,
        availability: "https://schema.org/InStock",
        priceCurrency: "USD"
      };

      if (poi.event.cost_range_min !== null && poi.event.cost_range_max !== null) {
        offer.lowPrice = poi.event.cost_range_min;
        offer.highPrice = poi.event.cost_range_max;
      } else if (poi.event.cost_range_min !== null) {
        offer.price = poi.event.cost_range_min;
      } else if (poi.event.cost_range_max !== null) {
        offer.price = poi.event.cost_range_max;
      }

      // Add valid date range
      if (poi.event.start_datetime) {
        offer.validFrom = formatISODate(poi.event.start_datetime);
      }

      offers.push(offer);
    } else if (poi.event?.is_free) {
      offers.push({
        "@type": "Offer",
        url: eventUrl,
        availability: "https://schema.org/InStock",
        price: 0,
        priceCurrency: "USD"
      });
    }

    return offers.length > 0 ? offers : null;
  };

  // Build performer array
  const buildPerformers = () => {
    if (!poi.event?.performers || poi.event.performers.length === 0) return null;

    return poi.event.performers.map(performer => ({
      "@type": "PerformingGroup",
      name: performer
    }));
  };

  // Determine event status
  const getEventStatus = () => {
    const status = poi.event?.status?.toLowerCase() || poi.status?.toLowerCase();
    switch (status) {
      case 'cancelled':
      case 'canceled':
        return "https://schema.org/EventCancelled";
      case 'postponed':
        return "https://schema.org/EventPostponed";
      case 'rescheduled':
        return "https://schema.org/EventRescheduled";
      case 'moved_online':
      case 'virtual':
        return "https://schema.org/EventMovedOnline";
      default:
        return "https://schema.org/EventScheduled";
    }
  };

  // Determine event attendance mode
  const getEventAttendanceMode = () => {
    if (poi.event?.is_virtual && poi.event?.is_in_person) {
      return "https://schema.org/MixedEventAttendanceMode";
    }
    if (poi.event?.is_virtual) {
      return "https://schema.org/OnlineEventAttendanceMode";
    }
    return "https://schema.org/OfflineEventAttendanceMode";
  };

  // Build images array
  const buildImages = () => {
    const images = [];

    // Add main image if available
    if (poi.main_image_url) {
      images.push(poi.main_image_url);
    }

    // Add gallery images
    if (poi.images && Array.isArray(poi.images)) {
      poi.images.forEach(img => {
        const url = getImageUrl(img);
        if (url && !images.includes(url)) {
          images.push(url);
        }
      });
    }

    return images.length > 0 ? images : null;
  };

  // Build the main Event schema
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: poi.name,
    url: eventUrl,
    eventStatus: getEventStatus(),
    eventAttendanceMode: getEventAttendanceMode(),
    location: buildLocation()
  };

  // Add dates
  if (poi.event?.start_datetime) {
    eventSchema.startDate = formatISODate(poi.event.start_datetime);
  }
  if (poi.event?.end_datetime) {
    eventSchema.endDate = formatISODate(poi.event.end_datetime);
  }

  // Add descriptions
  if (poi.description_short) {
    eventSchema.description = poi.description_short;
  } else if (poi.description_long) {
    // Strip HTML tags for description
    eventSchema.description = poi.description_long.replace(/<[^>]*>/g, '').substring(0, 500);
  }

  // Add organizer
  const organizer = buildOrganizer();
  if (organizer) {
    eventSchema.organizer = organizer;
  }

  // Add offers
  const offers = buildOffers();
  if (offers) {
    eventSchema.offers = offers;
  }

  // Add performers
  const performers = buildPerformers();
  if (performers) {
    eventSchema.performer = performers;
  }

  // Add images
  const images = buildImages();
  if (images) {
    eventSchema.image = images;
  }

  // Add door time if available
  if (poi.event?.doors_open) {
    eventSchema.doorTime = poi.event.doors_open;
  }

  // Add typical age range if ideal_for is set
  if (poi.ideal_for && Array.isArray(poi.ideal_for)) {
    const ageGroups = poi.ideal_for.filter(group =>
      group.toLowerCase().includes('kid') ||
      group.toLowerCase().includes('child') ||
      group.toLowerCase().includes('family') ||
      group.toLowerCase().includes('adult') ||
      group.toLowerCase().includes('senior')
    );
    if (ageGroups.length > 0) {
      eventSchema.typicalAgeRange = ageGroups.join(', ');
    }
  }

  // Add accessibility info
  if (poi.wheelchair_accessible && Array.isArray(poi.wheelchair_accessible)) {
    eventSchema.accessibilityFeature = poi.wheelchair_accessible;
  }

  // Add maximum attendee capacity if known
  if (poi.event?.max_capacity) {
    eventSchema.maximumAttendeeCapacity = poi.event.max_capacity;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema, null, 2) }}
    />
  );
}

export default EventJsonLd;
