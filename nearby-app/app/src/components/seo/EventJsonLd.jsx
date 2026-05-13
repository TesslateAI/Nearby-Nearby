/**
 * Schema.org Event structured data component
 * Full implementation following https://schema.org/Event
 *
 * This component renders a JSON-LD script tag with event structured data
 * to help search engines understand and display event information.
 */

import { escapeForJsonLd } from '../../utils/sanitize';

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
      ...(poi.event?.organizer_website && { url: poi.event.organizer_website?.startsWith('http') ? poi.event.organizer_website : `https://${poi.event.organizer_website}` }),
      ...(poi.event?.organizer_email && { email: poi.event.organizer_email }),
      ...(poi.event?.organizer_phone && { telephone: poi.event.organizer_phone })
    };
  };

  // Build offers array
  const buildOffers = () => {
    if (poi.event?.cost_type === 'free') {
      return [{ "@type": "Offer", url: eventUrl, price: 0, priceCurrency: "USD", availability: "https://schema.org/InStock" }];
    }
    if (poi.cost && (poi.event?.cost_type === 'single_price' || poi.event?.cost_type === 'range')) {
      return [{ "@type": "Offer", url: eventUrl, price: poi.cost, priceCurrency: "USD", availability: "https://schema.org/InStock" }];
    }
    return null;
  };

  // Build performer array
  const buildPerformers = () => {
    if (!poi.event?.performers || poi.event.performers.length === 0) return null;

    return poi.event.performers.map(performer => ({
      "@type": "PerformingGroup",
      name: performer
    }));
  };

  // Determine event status using poi.event.event_status
  const getEventStatus = () => {
    const status = poi.event?.event_status || 'Scheduled';
    switch (status) {
      case 'Canceled': return 'https://schema.org/EventCancelled';
      case 'Postponed': return 'https://schema.org/EventPostponed';
      case 'Rescheduled': return 'https://schema.org/EventRescheduled';
      case 'Moved Online': return 'https://schema.org/EventMovedOnline';
      case 'Updated Date and/or Time': return 'https://schema.org/EventScheduled';
      case 'Unofficial Proposed Date': return 'https://schema.org/EventScheduled';
      default: return 'https://schema.org/EventScheduled';
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

  // Add VirtualLocation when event is moved online and online URL is available
  if (poi.event?.event_status === 'Moved Online' && poi.event?.online_event_url) {
    eventSchema.location = [
      buildLocation(),
      { "@type": "VirtualLocation", url: poi.event.online_event_url }
    ];
    eventSchema.eventAttendanceMode = "https://schema.org/OnlineEventAttendanceMode";
  }

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
      dangerouslySetInnerHTML={{ __html: escapeForJsonLd(JSON.stringify(eventSchema, null, 2)) }}
    />
  );
}

export default EventJsonLd;
