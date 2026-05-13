import { useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  Mail, ExternalLink, Ticket, X,
} from 'lucide-react';

import {
  AccSection, QuickInfoRow, QuickInfoPhotosBox,
  hasVal, copyToClipboard, getCoordinates, openDirections, getImages,
} from './shared';
import InfoRow from './InfoRow';
import ServiceAnimalAlert from './ServiceAnimalAlert';
import EventStatusBanner from './EventStatusBanner';
import { POIDetailLayout } from './shared';
import { EventJsonLd } from '../seo/index';

import { getDisplayableLocation } from '../../utils/getDisplayableLocation';
import { isPaidTier } from '../../utils/poiTier';

import './EventDetail.css';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const EVENT_DISCLAIMER =
  'While we work to keep event information current and accurate, details may change. We recommend confirming directly with event organizers before making plans.';

const hasContent = (v) => {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
  return true;
};

function formatTime12h(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const h24 = d.getHours();
  const m = d.getMinutes();
  const ampm = h24 >= 12 ? 'pm' : 'am';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${m.toString().padStart(2, '0')}${ampm}`;
}

/**
 * formatEventDateTime — always 12-hour. e.g. "Sat Nov 9th • 8am-7pm"
 */
function formatEventDateTime(start, end) {
  if (!start) return null;
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return null;

  const dateStr = s.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const day = s.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? 'st'
    : day % 10 === 2 && day !== 12 ? 'nd'
    : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const dateWithOrdinal = dateStr.replace(/(\d+)$/, `$1${suffix}`);

  const startTime = formatTime12h(s);
  let endTime = null;
  if (end) {
    const e = new Date(end);
    if (!Number.isNaN(e.getTime())) endTime = formatTime12h(e);
  }

  return endTime
    ? `${dateWithOrdinal} • ${startTime}-${endTime}`
    : `${dateWithOrdinal} • ${startTime}`;
}

/** Event-time derived open/closed label. */
function deriveEventStatus(event) {
  if (!event?.start_datetime) return null;
  const now = Date.now();
  const s = new Date(event.start_datetime).getTime();
  const e = event.end_datetime ? new Date(event.end_datetime).getTime() : s;
  if (now < s) return { text: 'Upcoming', cls: 'poi_page_hours_opensoon' };
  if (now > e) return { text: 'Ended', cls: 'poi_page_hours_closed' };
  return { text: 'Fully Open', cls: 'poi_page_hours_opennow' };
}

function formatCost(event) {
  if (!event) return null;
  const t = event.cost_type;
  if (t === 'free') return 'Free';
  if (t === 'single_price' && event.price != null && event.price !== '') return `$${event.price}`;
  if (t === 'range' && event.cost_min != null && event.cost_max != null)
    return `$${event.cost_min} - $${event.cost_max}`;
  if (event.price != null && event.price !== '') return `$${event.price}`;
  if (event.cost_min != null && event.cost_max != null) return `$${event.cost_min} - $${event.cost_max}`;
  if (typeof event.cost === 'string' && event.cost.trim() !== '') return event.cost;
  return null;
}

function formatRecurrence(event) {
  if (!event?.is_repeating) return null;
  const rp = event.repeat_pattern;
  if (!rp) return 'This event repeats.';
  if (typeof rp === 'string') return rp;
  if (typeof rp === 'object') {
    const parts = [];
    if (rp.frequency) parts.push(rp.frequency);
    if (rp.day_of_week) parts.push(`on ${rp.day_of_week}`);
    if (rp.day_of_month) parts.push(`on day ${rp.day_of_month}`);
    if (rp.interval) parts.push(`every ${rp.interval}`);
    return parts.length > 0 ? `Repeats ${parts.join(', ')}` : 'This event repeats.';
  }
  return String(rp);
}


/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function EventDetail({ poi }) {
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get('view');
  const allOpen = viewMode === 'detail';

  const [copiedCoords, setCopiedCoords] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);

  const event = poi.event || null;
  const displayLoc = getDisplayableLocation(poi);
  const dontDisplayLocation = poi.dont_display_location === true;
  const hideExact = displayLoc.hideExact || dontDisplayLocation;
  const status = deriveEventStatus(event);
  const isCanceled = event?.event_status === 'cancelled' || event?.event_status === 'Canceled';
  const paid = isPaidTier(poi);

  const getEventCoords = () => {
    if (hideExact) return null;
    if (event?.venue_front_door_latitude && event?.venue_front_door_longitude)
      return { lat: event.venue_front_door_latitude, lng: event.venue_front_door_longitude };
    if (event?.venue_latitude && event?.venue_longitude)
      return { lat: event.venue_latitude, lng: event.venue_longitude };
    return getCoordinates(poi, hideExact);
  };

  const coords = getEventCoords();
  const handleDirections = () => openDirections(poi, coords);
  const handleCopyCoords = async () => {
    if (!coords) return;
    if (await copyToClipboard(`${coords.lat}, ${coords.lng}`)) {
      setCopiedCoords(true); setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  /* ---- derived display data ---- */
  const venueName = event?.venue_name_snapshot || event?.venue?.name || event?.venue_name || null;
  const dateTimeLine = formatEventDateTime(event?.start_datetime, event?.end_datetime);

  const petOptionsStr = Array.isArray(poi.pet_options) && poi.pet_options.length > 0
    ? poi.pet_options.join(', ')
    : null;
  const parkingTypes = Array.isArray(event?.venue_parking_types)
    ? event.venue_parking_types
    : (Array.isArray(poi.parking_types) ? poi.parking_types : []);

  const venueAddrStr = [
    event?.venue_address_street,
    event?.venue_address_city,
    event?.venue_address_state,
    event?.venue_address_zip,
  ].filter(Boolean).join(', ');

  const hasVenueSnapshot =
    hasContent(event?.venue_address_street) ||
    hasContent(event?.venue_address_city) ||
    parkingTypes.length > 0 ||
    hasContent(event?.venue_parking_notes);

  // ticket links: [{ platform, url }] on poi.event
  const ticketLinksRaw = Array.isArray(event?.ticket_links) ? event.ticket_links
    : (Array.isArray(poi.ticket_links) ? poi.ticket_links : []);
  const ticketLinks = ticketLinksRaw.filter((t) => t && (typeof t === 'string' ? t : t.url));
  const hasTickets = ticketLinks.length > 0;

  const locationLine = hideExact
    ? [displayLoc.city, displayLoc.region].filter(Boolean).join(', ')
    : displayLoc.full;

  const idealForSpecial = poi.ideal_for?.local_special && (
    Array.isArray(poi.ideal_for.local_special)
      ? poi.ideal_for.local_special.join(', ')
      : poi.ideal_for.local_special
  );
  const costLabel = formatCost(event);

  /* ---- section renderers ---- */
  const renderAboutDetails = () => {
    const hasDesc = hasContent(poi.description_long);
    const recur = formatRecurrence(event);
    const hasOrganizer =
      hasContent(event?.organizer_name) ||
      hasContent(event?.organizer_email) ||
      hasContent(event?.organizer_phone) ||
      hasContent(event?.organizer_website);
    if (!hasDesc && !recur && !hasOrganizer && !isCanceled && !hasContent(event?.status_explanation)) {
      return null;
    }
    return (
      <>
        {hasDesc && (
          <div
            className="poi_description"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poi.description_long) }}
          />
        )}
        {recur && <InfoRow label="Repeats">{recur}</InfoRow>}
        {isCanceled && hasContent(event?.cancellation_paragraph) && (
          <div className="ed-cancellation" role="alert">
            {event.cancellation_paragraph}
          </div>
        )}
        {hasContent(event?.status_explanation) && !isCanceled && (
          <InfoRow label="Status Details">{event.status_explanation}</InfoRow>
        )}
        {hasOrganizer && (
          <div className="ed-organizer-block">
            <div className="acc_content_title_style_1">Organizer</div>
            {hasContent(event?.organizer_name) && <InfoRow label="Name">{event.organizer_name}</InfoRow>}
            {hasContent(event?.organizer_email) && (
              <InfoRow label="Email">
                <a href={`mailto:${event.organizer_email}`}>{event.organizer_email}</a>
              </InfoRow>
            )}
            {hasContent(event?.organizer_phone) && (
              <InfoRow label="Phone">
                <a href={`tel:${event.organizer_phone}`}>{event.organizer_phone}</a>
              </InfoRow>
            )}
            {hasContent(event?.organizer_website) && (
              <InfoRow label="Website">
                <a
                  href={event.organizer_website.startsWith('http') ? event.organizer_website : `https://${event.organizer_website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {event.organizer_website}
                </a>
              </InfoRow>
            )}
          </div>
        )}
      </>
    );
  };

  const renderVenue = () => {
    if (!hasVenueSnapshot && !venueName) return null;
    return (
      <>
        {venueName && <InfoRow label="Venue">{venueName}</InfoRow>}
        {!hideExact && hasContent(venueAddrStr) && (
          <InfoRow label="Address">{venueAddrStr}</InfoRow>
        )}
        {parkingTypes.length > 0 && (
          <InfoRow label="Parking">
            <div className="poi_chip_row">
              {parkingTypes.map((t, i) => <span key={i} className="poi_chip">{t}</span>)}
            </div>
          </InfoRow>
        )}
        {hasContent(event?.venue_parking_notes) && (
          <InfoRow label="Parking Notes">{event.venue_parking_notes}</InfoRow>
        )}
      </>
    );
  };

  const renderRestrooms = () => {
    if (!hasContent(poi.public_toilets) && !hasContent(poi.toilet_description)) return null;
    return (
      <>
        {hasContent(poi.public_toilets) && (
          <InfoRow label="Available">
            <div className="poi_chip_row">
              {(Array.isArray(poi.public_toilets) ? poi.public_toilets : [poi.public_toilets]).map((t, i) => (
                <span key={i} className="poi_chip">{t}</span>
              ))}
            </div>
          </InfoRow>
        )}
        {hasContent(poi.toilet_description) && (
          <InfoRow label="Details">{poi.toilet_description}</InfoRow>
        )}
        {poi.accessible_restroom && hasContent(poi.accessible_restroom_details) && (
          <aside className="poi_ada_sub_card">
            <h4 className="poi_ada_sub_card_title">ADA Accessible Restroom</h4>
            <div>{Array.isArray(poi.accessible_restroom_details) ? poi.accessible_restroom_details.join(', ') : poi.accessible_restroom_details}</div>
          </aside>
        )}
      </>
    );
  };

  const renderVendors = () => {
    if (event?.has_vendors !== true) return null;
    const types = Array.isArray(event.vendor_types) ? event.vendor_types : [];
    const vendors = Array.isArray(event.vendors) ? event.vendors : [];
    if (types.length === 0 && vendors.length === 0) return null;
    return (
      <>
        {types.length > 0 && (
          <InfoRow label="Vendor Types">
            <div className="poi_chip_row">
              {types.map((t, i) => <span key={i} className="poi_chip">{t}</span>)}
            </div>
          </InfoRow>
        )}
        {vendors.length > 0 && (
          <InfoRow label="Vendors">
            <ul className="ed-vendor-list">
              {vendors.map((v, i) => (
                <li key={v.id || i}>
                  {v.poi_id ? <a href={`/poi/${v.poi_id}`}>{v.name}</a> : v.name}
                </li>
              ))}
            </ul>
          </InfoRow>
        )}
      </>
    );
  };

  const renderPlayground = () => {
    const hasAny =
      hasContent(poi.playground_types) ||
      hasContent(poi.playground_surface) ||
      hasContent(poi.playground_age_groups) ||
      poi.inclusive_playground === true;
    if (!hasAny) return null;
    return (
      <>
        {hasContent(poi.playground_types) && (
          <InfoRow label="Playground Types">
            {Array.isArray(poi.playground_types) ? poi.playground_types.join(', ') : poi.playground_types}
          </InfoRow>
        )}
        {hasContent(poi.playground_surface) && (
          <InfoRow label="Surface">
            {Array.isArray(poi.playground_surface) ? poi.playground_surface.join(', ') : poi.playground_surface}
          </InfoRow>
        )}
        {hasContent(poi.playground_age_groups) && (
          <InfoRow label="Age Groups">
            {Array.isArray(poi.playground_age_groups) ? poi.playground_age_groups.join(', ') : poi.playground_age_groups}
          </InfoRow>
        )}
        {poi.inclusive_playground === true && (
          <InfoRow label="Inclusive Playground">Yes</InfoRow>
        )}
        {Array.isArray(poi.playground_ada_checklist) && poi.playground_ada_checklist.length > 0 && (
          <InfoRow label="ADA">{poi.playground_ada_checklist.join(', ')}</InfoRow>
        )}
      </>
    );
  };

  const renderWheelchair = () => {
    if (!hasContent(poi.wheelchair_accessible) && !hasContent(poi.wheelchair_details)) return null;
    return (
      <>
        {hasContent(poi.wheelchair_accessible) && (
          <InfoRow label="Wheelchair Accessible">
            {Array.isArray(poi.wheelchair_accessible) ? poi.wheelchair_accessible.join(', ') : poi.wheelchair_accessible}
          </InfoRow>
        )}
        {hasContent(poi.wheelchair_details) && (
          <InfoRow label="Details">{poi.wheelchair_details}</InfoRow>
        )}
      </>
    );
  };

  const renderPetPolicy = () => {
    if (!hasContent(poi.pet_options)) return null;
    return (
      <>
        <InfoRow label="Pets Allowed">
          <div className="poi_chip_row">
            {poi.pet_options.map((p, i) => <span key={i} className="poi_chip">{p}</span>)}
          </div>
        </InfoRow>
        {hasContent(poi.pet_policy) && <InfoRow label="Policy">{poi.pet_policy}</InfoRow>}
        <ServiceAnimalAlert />
      </>
    );
  };

  const renderDrone = () => {
    if (!hasContent(poi.drone_usage) && !hasContent(poi.drone_policy)) return null;
    return (
      <>
        {hasContent(poi.drone_usage) && (
          <InfoRow label="Drone Usage">
            {Array.isArray(poi.drone_usage) ? poi.drone_usage.join(', ') : poi.drone_usage}
          </InfoRow>
        )}
        {hasContent(poi.drone_policy) && <InfoRow label="Policy">{poi.drone_policy}</InfoRow>}
      </>
    );
  };

  const renderAlcoholSmoking = () => {
    if (!hasContent(poi.alcohol_available) && !hasContent(poi.smoking_policy)) return null;
    return (
      <>
        {hasContent(poi.alcohol_available) && (
          <InfoRow label="Alcohol">
            {Array.isArray(poi.alcohol_available) ? poi.alcohol_available.join(', ') : poi.alcohol_available}
          </InfoRow>
        )}
        {hasContent(poi.smoking_policy) && (
          <InfoRow label="Smoking">
            {Array.isArray(poi.smoking_policy) ? poi.smoking_policy.join(', ') : poi.smoking_policy}
          </InfoRow>
        )}
      </>
    );
  };

  const renderRentals = () => {
    if (poi.available_for_rent !== true) return null;
    return (
      <>
        <InfoRow label="Available for Rent">Yes</InfoRow>
        {hasContent(poi.rental_options) && (
          <InfoRow label="Options">
            {Array.isArray(poi.rental_options) ? poi.rental_options.join(', ') : poi.rental_options}
          </InfoRow>
        )}
        {hasContent(poi.rental_info) && <InfoRow label="Details">{poi.rental_info}</InfoRow>}
      </>
    );
  };

  const renderLocallyFound = () => {
    const hasAny =
      hasContent(poi.locally_found) ||
      hasContent(poi.history) ||
      hasContent(poi.history_paragraph) ||
      hasContent(poi.community_impact);
    if (!hasAny) return null;
    return (
      <>
        {hasContent(poi.locally_found) && <InfoRow label="Locally Found">{poi.locally_found}</InfoRow>}
        {hasContent(poi.history) && <InfoRow label="History">{poi.history}</InfoRow>}
        {hasContent(poi.history_paragraph) && <InfoRow label="History">{poi.history_paragraph}</InfoRow>}
        {hasContent(poi.community_impact) && <InfoRow label="Community Impact">{poi.community_impact}</InfoRow>}
      </>
    );
  };

  const renderContact = () => {
    const hasAny =
      hasContent(event?.organizer_name) ||
      hasContent(event?.organizer_email) ||
      hasContent(event?.organizer_phone) ||
      hasContent(event?.organizer_website) ||
      (Array.isArray(event?.organizer_socials) && event.organizer_socials.length > 0);
    if (!hasAny) return null;
    return (
      <>
        {hasContent(event?.organizer_name) && <InfoRow label="Organizer">{event.organizer_name}</InfoRow>}
        {hasContent(event?.organizer_email) && (
          <InfoRow label="Email">
            <a href={`mailto:${event.organizer_email}`}>{event.organizer_email}</a>
          </InfoRow>
        )}
        {hasContent(event?.organizer_phone) && (
          <InfoRow label="Phone">
            <a href={`tel:${event.organizer_phone}`}>{event.organizer_phone}</a>
          </InfoRow>
        )}
        {hasContent(event?.organizer_website) && (
          <InfoRow label="Website">
            <a
              href={event.organizer_website.startsWith('http') ? event.organizer_website : `https://${event.organizer_website}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {event.organizer_website}
            </a>
          </InfoRow>
        )}
        {Array.isArray(event?.organizer_socials) && event.organizer_socials.length > 0 && (
          <InfoRow label="Socials">
            <div className="poi_chip_row">
              {event.organizer_socials.map((s, i) => {
                const url = typeof s === 'string' ? s : s.url;
                const label = typeof s === 'string' ? s : (s.platform || s.label || s.url);
                if (!url) return null;
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="poi_chip ed-chip-link">
                    {label}
                  </a>
                );
              })}
            </div>
          </InfoRow>
        )}
        {event?.contact_organizer_toggle === true && hasContent(event?.organizer_email) && (
          <a href={`mailto:${event.organizer_email}`} className="ed-contact-organizer-btn">
            <Mail size={14} /> Contact Organizer
          </a>
        )}
      </>
    );
  };

  const renderSponsors = () => {
    if (!Array.isArray(event?.sponsors) || event.sponsors.length === 0) return null;
    return (
      <>
        <div className="ed-sponsors__label">Tiers</div>
        <div className="ed-sponsors__grid">
          {event.sponsors.map((s, i) => (
            <div key={s.id || i} className="ed-sponsor-card">
              {s.logo_url && (
                <img className="ed-sponsor-card__logo" src={s.logo_url} alt={`${s.name} logo`} loading="lazy" />
              )}
              <div className="ed-sponsor-card__info">
                {s.website ? (
                  <a
                    href={s.website.startsWith('http') ? s.website : `https://${s.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ed-sponsor-card__name"
                  >
                    {s.name}
                  </a>
                ) : (
                  <span className="ed-sponsor-card__name">{s.name}</span>
                )}
                {s.tier && <span className="ed-sponsor-card__tier">{s.tier}</span>}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  /* ---- section manifest (PAID vs FREE) ---- */
  const PAID_SECTIONS = [
    { id: 'about_details', title: 'About + Details', defaultOpen: true, render: renderAboutDetails },
    { id: 'venue_parking', title: 'Venue Address + Parking', defaultOpen: true, render: renderVenue },
    { id: 'restrooms', title: 'Public Restrooms', defaultOpen: false, render: renderRestrooms },
    { id: 'vendors', title: 'Vendors', defaultOpen: false, render: renderVendors },
    { id: 'playground', title: 'Playground', defaultOpen: false, render: renderPlayground },
    { id: 'mobility', title: 'Wheelchair and Mobility Access', defaultOpen: false, render: renderWheelchair },
    { id: 'pets', title: 'Pet Policy', defaultOpen: false, render: renderPetPolicy },
    { id: 'drone', title: 'Drone Policy', defaultOpen: false, render: renderDrone },
    { id: 'alcohol_smoking', title: 'Alcohol + Smoking', defaultOpen: false, render: renderAlcoholSmoking },
    { id: 'rentals', title: 'Rentals', defaultOpen: false, render: renderRentals },
    { id: 'locally_found', title: 'Locally Found + History', defaultOpen: false, render: renderLocallyFound },
    { id: 'contact', title: 'Contact', defaultOpen: false, render: renderContact },
    { id: 'sponsors', title: 'Sponsors', defaultOpen: false, render: renderSponsors },
  ];

  const FREE_SECTIONS = [
    { id: 'about_details', title: 'About + Details', defaultOpen: false, render: renderAboutDetails },
    { id: 'venue_parking', title: 'Venue Address', defaultOpen: false, render: renderVenue },
    { id: 'restrooms', title: 'Public Restrooms', defaultOpen: false, render: renderRestrooms },
    { id: 'mobility', title: 'Wheelchair and Mobility Access', defaultOpen: false, render: renderWheelchair },
    { id: 'pets', title: 'Pet Policy', defaultOpen: false, render: renderPetPolicy },
    { id: 'contact', title: 'Contact', defaultOpen: false, render: renderContact },
  ];

  const sections = (paid ? PAID_SECTIONS : FREE_SECTIONS)
    .map((s) => ({ ...s, body: s.render() }))
    .filter((s) => s.body != null);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const ticketButtons = (() => {
    const btns = [];
    if (hasTickets) {
      if (ticketLinks.length > 1) {
        btns.push({ label: 'GET TICKETS', svg: <Ticket size={14} className="poi_button_icon" />, onClick: () => setTicketsOpen(true), extraClass: 'ed-ticket-btn' });
      } else {
        const t = ticketLinks[0];
        const url = typeof t === 'string' ? t : t.url;
        const platform = typeof t === 'string' ? null : (t.platform || t.name);
        if (url) btns.push({ label: platform ? `GET TICKETS · ${platform}` : 'GET TICKETS', svg: <Ticket size={14} className="poi_button_icon" />, href: url.startsWith('http') ? url : `https://${url}`, target: '_blank', rel: 'noopener noreferrer', extraClass: 'ed-ticket-btn' });
      }
    }
    return btns;
  })();

  return (
    <POIDetailLayout
      poi={poi}
      mainCategory={dateTimeLine}
      statusVariant={status && !isCanceled ? (status.cls?.includes('open') ? 'open' : status.cls?.includes('soon') ? 'opensoon' : 'closed') : undefined}
      statusLabel={status && !isCanceled ? status.text : undefined}
      extraButtons={ticketButtons}
      subtitleExtras={
        <>
          {venueName && <p className="ed-venue-line">{venueName}</p>}
          {isCanceled && hasContent(event?.cancellation_paragraph) && (
            <div className="ed-cancellation" role="alert">{event.cancellation_paragraph}</div>
          )}
        </>
      }
      seoComponent={<EventJsonLd poi={poi} />}
      beforeHeader={
        <div className="wrapper_default">
          <EventStatusBanner
            eventStatus={event?.event_status}
            statusExplanation={event?.status_explanation}
            cancellationParagraph={event?.cancellation_paragraph}
            contactOrganizerToggle={event?.contact_organizer_toggle}
            newEventLink={event?.new_event_link}
            onlineEventUrl={event?.online_event_url}
          />
        </div>
      }
    >
      {({ images: imgs, openLightbox }) => (
        <>
          <QuickInfoPhotosBox
            title={hasContent(poi.description_short) ? poi.description_short : undefined}
            quickInfoRows={
              <>
                <QuickInfoRow title="Cost:" value={costLabel} />
                <QuickInfoRow title="Pets:" value={petOptionsStr} />
                <QuickInfoRow title="Best For:" value={idealForSpecial} />
              </>
            }
            images={imgs}
            onOpenLightbox={openLightbox}
          />

          <div id="accordion_1_box" className="poi_accordion_box">
            <div id="accordion_1_parent" className="poi_accordion_parent">
              {sections.map((s) => (
                <AccSection key={s.id} id={s.id} title={s.title} defaultOpen={allOpen || s.defaultOpen}>
                  {s.body}
                </AccSection>
              ))}
            </div>
          </div>

          <div className="ed-disclaimer">{EVENT_DISCLAIMER}</div>

          {ticketsOpen && (
            <div className="ed-modal-backdrop" onClick={() => setTicketsOpen(false)}>
              <div className="ed-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="ed-modal__header">
                  <h3>Get Tickets</h3>
                  <button type="button" className="ed-modal__close" onClick={() => setTicketsOpen(false)} aria-label="Close"><X size={18} /></button>
                </div>
                <ul className="ed-modal__list">
                  {ticketLinks.map((t, i) => {
                    const url = typeof t === 'string' ? t : t.url;
                    const platform = typeof t === 'string' ? 'Tickets' : (t.platform || t.name || 'Tickets');
                    if (!url) return null;
                    return (
                      <li key={i}>
                        <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer">
                          <Ticket size={16} /> <span>{platform}</span> <ExternalLink size={14} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </POIDetailLayout>
  );
}

export default EventDetail;
