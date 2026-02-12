import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Phone, Globe, Navigation, Copy, Check,
  ChevronDown, Users, Mail, ExternalLink,
  Wifi, Car, TreePine, Bath, Bike, Droplets, Dog, UtensilsCrossed, CirclePlus
} from 'lucide-react';
import NearbySection from '../nearby-feature/NearbySection';
import PhotoLightbox from './PhotoLightbox';
import HoursDisplay from '../common/HoursDisplay';
import { LocalBusinessJsonLd } from '../seo/index';
import { isCurrentlyOpen } from '../../utils/hoursUtils';
import './BusinessDetail.css';

/**
 * BusinessDetail - Specialized detail view for business POIs
 * Receives poi data as a prop from POIDetail (smart router)
 */
function BusinessDetail({ poi }) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getCoordinates = () => {
    if (poi?.front_door_latitude && poi?.front_door_longitude) {
      return { lat: poi.front_door_latitude, lng: poi.front_door_longitude };
    }
    if (poi?.location?.coordinates) {
      return { lat: poi.location.coordinates[1], lng: poi.location.coordinates[0] };
    }
    return null;
  };

  // Geocode the POI's street address into lat/long using Nominatim (OpenStreetMap)
  const geocodeAddress = async () => {
    if (geocodedCoords) return geocodedCoords; // Already cached
    if (!poi?.address_street) return null;

    const parts = [poi.address_street, poi.address_city, poi.address_state, poi.address_zip].filter(Boolean);
    const query = parts.join(', ');

    try {
      setIsGeocoding(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'User-Agent': 'NearbyNearby/1.0' } }
      );
      const results = await response.json();
      if (results && results.length > 0) {
        const coords = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
        setGeocodedCoords(coords);
        return coords;
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
    } finally {
      setIsGeocoding(false);
    }
    return null;
  };

  const handleDirections = () => {
    // Prefer the POI's actual street address for directions (more accurate than coordinates)
    if (poi?.address_street) {
      const parts = [poi.address_street, poi.address_city, poi.address_state, poi.address_zip].filter(Boolean);
      const address = encodeURIComponent(parts.join(', '));
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    } else {
      // Fallback to coordinates if no street address is available
      const coords = getCoordinates();
      if (coords) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
      }
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      console.error('Fallback: Could not copy text:', err);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Clipboard API failed:', err);
        return fallbackCopyToClipboard(text);
      }
    } else {
      return fallbackCopyToClipboard(text);
    }
  };

  const handleCopyCoords = async () => {
    let coords;

    // 1. Use front-door coordinates if explicitly set for this POI
    if (poi?.front_door_latitude && poi?.front_door_longitude) {
      coords = { lat: poi.front_door_latitude, lng: poi.front_door_longitude };
    }

    // 2. Geocode the street address to get accurate lat/long
    if (!coords && poi?.address_street) {
      coords = await geocodeAddress();
    }

    // 3. Last resort: use location.coordinates
    if (!coords && poi?.location?.coordinates) {
      coords = { lat: poi.location.coordinates[1], lng: poi.location.coordinates[0] };
    }

    if (coords) {
      const text = `${coords.lat}, ${coords.lng}`;
      const success = await copyToClipboard(text);
      if (success) {
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 2000);
      } else {
        alert(`Lat/Long: ${text}`);
      }
    }
  };

  const handleCall = () => {
    if (poi?.phone_number) {
      window.location.href = `tel:${poi.phone_number}`;
    }
  };

  const handleWebsite = () => {
    if (poi?.website_url) {
      const url = poi.website_url.startsWith('http') ? poi.website_url : `https://${poi.website_url}`;
      window.open(url, '_blank');
    }
  };

  const scrollToNearby = () => {
    const nearbySection = document.querySelector('.nearby-section');
    if (nearbySection) {
      nearbySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasContent = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  };

  // Open lightbox at specific index
  const openLightbox = (index = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Accordion component with two-column layout support
  const AccordionSection = ({ title, children, show = true }) => {
    if (!show) return null;
    const isOpen = expandedSections[title];

    return (
      <div className="bd-accordion">
        <button
          onClick={() => toggleSection(title)}
          className="bd-accordion__header"
          type="button"
        >
          <span className="bd-accordion__title">{title}</span>
          <ChevronDown size={20} className={`bd-accordion__icon ${isOpen ? 'bd-accordion__icon--open' : ''}`} />
        </button>
        {isOpen && (
          <div className="bd-accordion__content">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Two-column info row for accordion content
  const InfoItem = ({ label, value, isHTML = false }) => {
    if (!hasContent(value)) return null;
    const displayValue = Array.isArray(value) ? value.join(", ") : value;

    return (
      <div className="bd-info-item">
        <span className="bd-info-item__label">{label}</span>
        {isHTML ? (
          <span className="bd-info-item__value" dangerouslySetInnerHTML={{ __html: displayValue }} />
        ) : (
          <span className="bd-info-item__value">{displayValue}</span>
        )}
      </div>
    );
  };

  // Get hours info
  const openStatus = poi.hours ? isCurrentlyOpen(poi.hours) : null;

  // Format pet options for display
  const formatPetOptions = () => {
    if (!poi.pet_options || poi.pet_options.length === 0) return null;
    return poi.pet_options.join(', ');
  };

  // Get all images for lightbox and grid
  const getImages = () => {
    if (poi.images && poi.images.length > 0) {
      // Filter to only original/parent images (not size variants)
      // Check for various ways the API might indicate this
      return poi.images
        .filter(img => {
          // Skip if this is a child/variant image
          if (img.parent_image_id) return false;
          // Include if it's explicitly original OR if no variant info
          if (img.image_size_variant === 'original') return true;
          if (!img.image_size_variant) return true;
          return false;
        })
        .map(img => {
          // Get thumbnail from size_variants or fall back to original
          const thumbnailVariant = img.size_variants?.find(v => v.image_size_variant === 'thumbnail');
          const mediumVariant = img.size_variants?.find(v => v.image_size_variant === 'medium');

          // Try multiple possible URL fields
          const mainUrl = img.storage_url || img.url || img.image_url || img.src;
          const thumbUrl = thumbnailVariant?.storage_url || mediumVariant?.storage_url ||
                          img.thumbnail_url || img.medium_url || mainUrl;

          return {
            id: img.id,
            url: mainUrl,
            thumbnail_url: thumbUrl,
            alt_text: img.alt_text || `${poi.name} photo`,
            caption: img.caption
          };
        })
        .filter(img => img.url); // Only include images with valid URLs
    }
    // Fallback to legacy fields
    const photos = [];
    if (poi.featured_image) photos.push({ url: poi.featured_image, thumbnail_url: poi.featured_image, alt_text: poi.name });
    if (poi.gallery_photos) {
      photos.push(...poi.gallery_photos.filter(p => p).map(p => ({ url: p, thumbnail_url: p, alt_text: poi.name })));
    }
    return photos;
  };

  const images = getImages();
  const gridImages = images.slice(0, 8); // Show up to 8 in grid

  // Get photos by type from the images array (for typed sections like parking, restroom, etc.)
  const getPhotosByType = (type) => {
    if (!poi.images) return [];
    return poi.images
      .filter(img => {
        // Match by image_type field
        const imgType = img.type || img.image_type;
        if (typeof imgType === 'string') {
          return imgType.toLowerCase() === type.toLowerCase();
        }
        // Handle enum values
        if (imgType?.value) {
          return imgType.value.toLowerCase() === type.toLowerCase();
        }
        return false;
      })
      .filter(img => !img.parent_image_id) // Only original images, not variants
      .map(img => ({
        id: img.id,
        url: img.storage_url || img.url,
        thumbnail: img.thumbnail_url || img.storage_url || img.url,
        alt: img.alt_text || `${type} photo`,
        caption: img.caption
      }))
      .filter(img => img.url); // Only include images with valid URLs
  };

  // Get primary category
  const primaryCategory = poi.categories?.[0]?.name || '';

  return (
    <div className="bd-page">
      <LocalBusinessJsonLd poi={poi} />

      <div className="bd-container">
        <button type="button" onClick={() => navigate('/')} className="bd-back-link">
          ← Back to Search
        </button>

        {/* Header Section - Two Column Layout */}
        <header className="bd-header">
          <div className="bd-header__left">
            {/* Status Row */}
            <div className="bd-status-row">
              <span className="bd-status-label">STATUS:</span>
              <span className="bd-status-value">
                {poi.status || 'Fully Open'}
                {poi.status_message && ` - ${poi.status_message}`}
              </span>
            </div>

            {/* Title */}
            <h1 className="bd-title">{poi.name}</h1>

            {/* Category */}
            {primaryCategory && (
              <p className="bd-category-line">{primaryCategory}</p>
            )}

            {/* Location */}
            <p className="bd-location-line">
              {[poi.address_city, poi.address_county ? `${poi.address_county} County` : null, poi.address_state].filter(Boolean).join(', ')}
            </p>

            {/* Hours */}
            {poi.hours && (
              <div className="bd-hours-inline">
                <span className={`bd-hours-dot ${openStatus?.isOpen ? 'bd-hours-dot--open' : 'bd-hours-dot--closed'}`}></span>
                <span className={`bd-hours-status ${openStatus?.isOpen ? '' : 'bd-hours-status--closed'}`}>
                  {openStatus?.isOpen ? 'Open Now' : 'Closed'}
                </span>
                <span className="bd-hours-time">- {openStatus?.status}</span>
              </div>
            )}
          </div>

          <div className="bd-header__right">
            {/* Verified Badge with Click Tooltip */}
            {poi.is_verified && (
              <div className="bd-verified-box">
                <div className="bd-verified-badge">
                  <svg className="bd-verified-icon" viewBox="0 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" xmlSpace="preserve" xmlnsSerif="http://www.serif.com/" style={{fillRule: 'evenodd', clipRule: 'evenodd', strokeLinejoin: 'round', strokeMiterlimit: 2}}>
                    <g transform="matrix(0.0176433,0,0,0.0176433,-4.586,-4.58602)">
                      <path d="M600,259.93C634.012,259.93 643.281,307.055 676.133,315.856C708.984,324.661 740.582,288.489 770.039,305.497C799.492,322.501 783.953,367.954 808,392.005C832.051,416.052 877.504,400.513 894.508,429.966C911.516,459.419 875.344,491.02 884.149,523.872C892.95,556.72 940.075,565.993 940.075,600.001C940.075,634.013 892.95,643.282 884.149,676.134C875.344,708.985 911.516,740.583 894.508,770.04C877.504,799.493 832.051,783.954 808,808.001C783.953,832.052 799.492,877.505 770.039,894.509C740.582,911.517 708.985,875.345 676.133,884.15C643.281,892.951 634.012,940.076 600,940.076C565.992,940.076 556.719,892.951 523.871,884.15C491.02,875.345 459.418,911.517 429.965,894.509C400.512,877.505 416.051,832.052 392.004,808.001C367.953,783.954 322.5,799.493 305.496,770.04C288.488,740.583 324.66,708.986 315.855,676.134C307.054,643.282 259.929,634.013 259.929,600.001C259.929,565.993 307.054,556.72 315.855,523.872C324.66,491.021 288.488,459.419 305.496,429.966C322.5,400.513 367.953,416.052 392.004,392.005C416.051,367.954 400.512,322.501 429.965,305.497C459.418,288.489 491.019,324.661 523.871,315.856C556.719,307.055 565.992,259.93 600,259.93ZM600,373.293C539.87,373.293 482.206,397.178 439.69,439.698C397.171,482.218 373.288,539.883 373.288,600.008C373.288,660.138 397.17,717.802 439.69,760.318C482.21,802.833 539.875,826.72 600,826.72C639.798,826.72 678.896,816.247 713.36,796.349C747.824,776.451 776.446,747.83 796.344,713.365C816.242,678.9 826.715,639.806 826.715,600.005C826.715,560.204 816.242,521.11 796.344,486.645C776.446,452.181 747.825,423.559 713.36,403.661C678.895,383.763 639.797,373.293 600,373.293ZM600,392.18C704.34,392.18 807.82,495.66 807.82,600C807.82,704.34 704.34,807.82 600,807.82C495.66,807.82 392.18,704.34 392.18,600C392.18,495.66 495.66,392.18 600,392.18ZM695.168,505.45C688.941,505.275 683.024,508.181 679.356,513.216L579.066,646.926L518.906,586.762C501.101,568.227 473.656,595.668 492.191,613.477L567.761,689.047C575.89,697.172 589.336,696.219 596.234,687.024L709.594,535.884C719.031,523.661 710.609,505.888 695.168,505.45Z"/>
                    </g>
                  </svg>
                  <span className="bd-verified-badge-title">Verified</span>
                </div>
                <button
                  type="button"
                  className="bd-verified-about"
                  onClick={(e) => {
                    e.currentTarget.nextElementSibling.classList.toggle('bd-tooltip-open');
                  }}
                >
                  What's This
                </button>
                <div className="bd-verified-tooltip">
                  This place has been checked and confirmed as accurate by a Nearby Nearby Team member.
                </div>
              </div>
            )}

            {/* Sponsor Badge */}
            {poi.listing_type && poi.listing_type !== 'free' && (
              <div className="bd-badge bd-badge--sponsor">
                ⭐ {poi.listing_type} Sponsor
              </div>
            )}

            {/* Last Updated */}
            {poi.updated_at && (
              <p className="bd-last-updated">
                Last Updated, {new Date(poi.updated_at).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}.
              </p>
            )}

            {/* Suggest Update Button */}
            <button type="button" className="bd-suggest-update">
              Suggest an Update
            </button>
          </div>
        </header>

        {/* Action Buttons */}
        <div className="bd-actions">
          <button type="button" className="bd-action-btn" onClick={handleDirections}>
            <Navigation size={16} /> DIRECTIONS
          </button>
          {(getCoordinates() || poi?.address_street) && (
            <button type="button" className="bd-action-btn" onClick={handleCopyCoords} disabled={isGeocoding}>
              {copiedCoords ? <Check size={16} /> : <Copy size={16} />}
              {isGeocoding ? 'LOADING...' : copiedCoords ? 'COPIED!' : 'LAT + LONG'}
            </button>
          )}
          <button type="button" className="bd-action-btn" onClick={scrollToNearby}>
            <MapPin size={16} /> VIEW NEARBY
          </button>
          {poi.phone_number && (
            <button type="button" className="bd-action-btn" onClick={handleCall}>
              <Phone size={16} /> CALL
            </button>
          )}
          {poi.website_url && (
            <button type="button" className="bd-action-btn" onClick={handleWebsite}>
              <Globe size={16} /> WEBSITE
            </button>
          )}
        </div>

        {/* Two Cards Row: Info Card + Photo Card */}
        <div className="bd-cards-row">
          {/* Info Card - full width if no images */}
          <div className={`bd-info-card ${images.length === 0 ? 'bd-info-card--full' : ''}`}>
            {/* Teaser/Description - render as HTML since it may contain tags */}
            {(poi.teaser_paragraph || poi.description_short) && (
              <div
                className="bd-info-card__teaser"
                dangerouslySetInnerHTML={{ __html: poi.teaser_paragraph || poi.description_short }}
              />
            )}

            {/* Quick Info Grid */}
            <div className="bd-quick-info">
              <InfoItem label="Price Range" value={poi.price_range_per_person || poi.business?.price_range} />
              <InfoItem label="Good For" value={poi.ideal_for} />
              <InfoItem label="Pets" value={formatPetOptions()} />
            </div>
          </div>

          {/* Photo Card - only show if images exist */}
          {images.length > 0 && (
            <div className="bd-photo-card">
              <div className="bd-photo-grid">
                {gridImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    className="bd-photo-grid__item"
                    onClick={() => openLightbox(idx)}
                    type="button"
                  >
                    <img
                      src={img.thumbnail_url}
                      alt={img.alt_text}
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="bd-see-all-photos"
                onClick={() => openLightbox(0)}
              >
                See All Photos ({images.length})
              </button>
            </div>
          )}
        </div>

        {/* Amenities Section - combine all amenity sources */}
        {(() => {
          // Collect amenities from multiple possible sources
          const allAmenities = [];

          // Helper to add amenities from various formats
          const addAmenities = (source) => {
            if (!source) return;
            if (Array.isArray(source)) {
              allAmenities.push(...source.filter(a => a && typeof a === 'string'));
            } else if (typeof source === 'string') {
              // Could be comma-separated or single value
              allAmenities.push(...source.split(',').map(s => s.trim()).filter(Boolean));
            } else if (typeof source === 'object') {
              // Could be object with name/value pairs
              Object.values(source).forEach(v => {
                if (typeof v === 'string') allAmenities.push(v);
              });
            }
          };

          addAmenities(poi.amenities);
          addAmenities(poi.business_amenities);
          addAmenities(poi.youth_amenities);

          // Map amenity names to icons
          const getAmenityIcon = (name) => {
            const lower = name.toLowerCase();
            if (lower.includes('restroom') || lower.includes('bathroom') || lower.includes('toilet')) return <Bath size={16} />;
            if (lower.includes('wifi') || lower.includes('wi-fi')) return <Wifi size={16} />;
            if (lower.includes('parking')) return <Car size={16} />;
            if (lower.includes('playground') || lower.includes('play')) return <Users size={16} />;
            if (lower.includes('bike') || lower.includes('bicycle')) return <Bike size={16} />;
            if (lower.includes('water') || lower.includes('fountain')) return <Droplets size={16} />;
            if (lower.includes('dog') || lower.includes('pet')) return <Dog size={16} />;
            if (lower.includes('picnic') || lower.includes('dining')) return <UtensilsCrossed size={16} />;
            if (lower.includes('park') || lower.includes('tree') || lower.includes('garden')) return <TreePine size={16} />;
            return <CirclePlus size={16} />;
          };

          // Remove duplicates
          const uniqueAmenities = [...new Set(allAmenities)];

          if (uniqueAmenities.length === 0) return null;

          return (
            <div className="bd-amenities">
              <h3 className="bd-amenities__title">AMENITIES</h3>
              <div className="bd-amenities__grid">
                {uniqueAmenities.map((amenity, idx) => (
                  <span key={idx} className="bd-amenities__tag">
                    {getAmenityIcon(amenity)} {amenity}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Accordion Sections */}
        <div className="bd-accordions">
          {/* 1. About + Hours - Two Column Layout */}
          <AccordionSection
            title="About + Hours"
            show={hasContent(poi.description_long) || hasContent(poi.hours) || hasContent(poi.categories)}
          >
            <div className="bd-about-hours">
              {/* Left Column: Description, Categories, Ideal For */}
              <div className="bd-about-hours__left">
                {/* Description */}
                {hasContent(poi.description_long) && (
                  <div className="bd-about-description" dangerouslySetInnerHTML={{ __html: poi.description_long }} />
                )}

                {/* Categories as Tags */}
                {poi.categories && poi.categories.length > 0 && (
                  <div className="bd-tags-section">
                    <span className="bd-tags-section__label">Categories</span>
                    <div className="bd-tags-grid">
                      {poi.categories.map((cat, idx) => (
                        <span key={cat.id || idx} className="bd-tag">{cat.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ideal For as Tags */}
                {hasContent(poi.ideal_for) && (
                  <div className="bd-tags-section">
                    <span className="bd-tags-section__label">Ideal For</span>
                    <div className="bd-tags-grid">
                      {(Array.isArray(poi.ideal_for) ? poi.ideal_for : poi.ideal_for.split(',').map(s => s.trim())).map((item, idx) => (
                        <span key={idx} className="bd-tag">{item}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Hours, Upcoming Changes, Appointments */}
              <div className="bd-about-hours__right">
                <HoursDisplay
                  hours={poi.hours}
                  holidayHours={poi.holiday_hours}
                  appointmentLinks={poi.appointment_links}
                  appointmentBookingUrl={poi.appointment_booking_url || poi.appointment_url}
                  appointmentRequired={poi.hours_but_appointment_required}
                  hoursNotes={poi.hours_notes}
                />
              </div>
            </div>
          </AccordionSection>

          {/* 2. Address + Parking - Two Column Layout */}
          <AccordionSection
            title="Address + Parking"
            show={hasContent(poi.address_street) || hasContent(poi.parking_types) || hasContent(poi.parking_notes)}
          >
            <div className="bd-address-parking">
              {/* Left Column: Address */}
              <div className="bd-address-parking__left">
                {/* Address Header with Get Directions */}
                <div className="bd-address-header">
                  <span className="bd-address-header__label">ADDRESS</span>
                  <button
                    type="button"
                    className="bd-address-btn"
                    onClick={handleDirections}
                  >
                    <Navigation size={14} /> Get Directions
                  </button>
                </div>

                {/* Full Address with Copy */}
                {hasContent(poi.address_street) && (
                  <div className="bd-address-row">
                    <span className="bd-address-row__icon"><MapPin size={14} /></span>
                    <span className="bd-address-row__text">
                      {[poi.address_street, poi.address_city, poi.address_state, poi.address_zip].filter(Boolean).join(', ')}
                    </span>
                    <button
                      type="button"
                      className="bd-address-btn bd-address-btn--small"
                      onClick={() => {
                        const addr = [poi.address_street, poi.address_city, poi.address_state, poi.address_zip].filter(Boolean).join(', ');
                        copyToClipboard(addr);
                      }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                )}

                {/* Copy Lat/Long Button */}
                {(getCoordinates() || poi?.address_street) && (
                  <button
                    type="button"
                    className="bd-address-btn bd-address-btn--outline"
                    onClick={handleCopyCoords}
                    disabled={isGeocoding}
                  >
                    {copiedCoords ? <Check size={14} /> : <Copy size={14} />}
                    {isGeocoding ? 'Loading...' : copiedCoords ? 'Copied!' : 'Copy Latitude + Longitude'}
                  </button>
                )}

                {/* Look For This - Entry/Parking Photos from Images table */}
                {(() => {
                  const entryPhotos = getPhotosByType('entry');
                  const parkingPhotos = getPhotosByType('parking');
                  const allLookForPhotos = [...entryPhotos, ...parkingPhotos].slice(0, 5);

                  if (allLookForPhotos.length === 0 && !hasContent(poi.business_entry_notes)) return null;

                  return (
                    <div className="bd-look-for-this">
                      <span className="bd-look-for-this__label">LOOK FOR THIS</span>
                      {allLookForPhotos.length > 0 && (
                        <div className="bd-look-for-this__grid">
                          {allLookForPhotos.map((photo, idx) => (
                            <div key={photo.id || idx} className="bd-look-for-this__item">
                              <img src={photo.thumbnail} alt={photo.alt} loading="lazy" />
                            </div>
                          ))}
                        </div>
                      )}
                      {hasContent(poi.business_entry_notes) && (
                        <div className="bd-look-for-this__notes" dangerouslySetInnerHTML={{ __html: poi.business_entry_notes }} />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Parking */}
              <div className="bd-address-parking__right">
                {/* Parking Header */}
                <span className="bd-parking-header">PARKING</span>

                {/* Parking Types as Tags */}
                {hasContent(poi.parking_types) && (
                  <div className="bd-tags-grid">
                    {(Array.isArray(poi.parking_types)
                      ? poi.parking_types
                      : typeof poi.parking_types === 'string'
                        ? poi.parking_types.split(',').map(s => s.trim())
                        : []
                    ).filter(Boolean).map((type, idx) => (
                      <span key={idx} className="bd-tag">{type}</span>
                    ))}
                  </div>
                )}

                {/* Expect to Pay */}
                {hasContent(poi.expect_to_pay_parking) && (
                  <div className="bd-parking-info">
                    <span className="bd-parking-info__label">Expect to pay for parking?</span>
                    <span className="bd-parking-info__value">{poi.expect_to_pay_parking}</span>
                  </div>
                )}

                {/* Parking Notes */}
                {hasContent(poi.parking_notes) && (
                  <div className="bd-parking-notes" dangerouslySetInnerHTML={{ __html: poi.parking_notes }} />
                )}

                {/* Public Transit */}
                {hasContent(poi.public_transit_info) && (
                  <div className="bd-parking-info">
                    <span className="bd-parking-info__label">Public Transit</span>
                    <div className="bd-parking-notes" dangerouslySetInnerHTML={{ __html: poi.public_transit_info }} />
                  </div>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* 3. Pricing + Offers - Two Column Layout */}
          <AccordionSection
            title="Pricing + Offers"
            show={hasContent(poi.price_range_per_person) || hasContent(poi.payment_methods) || hasContent(poi.pricing_description) || hasContent(poi.discounts_offered) || hasContent(poi.gift_cards_available)}
          >
            <div className="bd-pricing-offers">
              {/* Left Column: Pricing Info */}
              <div className="bd-pricing-offers__left">
                {/* Average Price Range Per Person */}
                {hasContent(poi.price_range_per_person) && (
                  <div className="bd-pricing-section">
                    <span className="bd-pricing-section__label">AVERAGE PRICE RANGE PER PERSON</span>
                    <span className="bd-pricing-section__value">{poi.price_range_per_person}</span>
                  </div>
                )}

                {/* Payment Methods */}
                {hasContent(poi.payment_methods) && (
                  <div className="bd-pricing-section">
                    <span className="bd-pricing-section__label">PAYMENTS METHODS</span>
                    <span className="bd-pricing-section__value">
                      {Array.isArray(poi.payment_methods) ? poi.payment_methods.join(', ') : poi.payment_methods}
                    </span>
                  </div>
                )}

                {/* Pricing Description */}
                {hasContent(poi.pricing_description) && (
                  <div className="bd-pricing-description" dangerouslySetInnerHTML={{ __html: poi.pricing_description }} />
                )}
              </div>

              {/* Right Column: Discounts & Gift Cards */}
              <div className="bd-pricing-offers__right">
                {/* Discounts */}
                {hasContent(poi.discounts_offered) && (
                  <div className="bd-discounts-section">
                    <span className="bd-discounts-section__label">DISCOUNTS</span>
                    <div className="bd-discounts-section__content">
                      {poi.discount_description && (
                        <p className="bd-discounts-intro">{poi.discount_description}</p>
                      )}
                      {Array.isArray(poi.discounts_offered) && poi.discounts_offered.length > 0 && (
                        <ul className="bd-discounts-list">
                          {poi.discounts_offered.map((discount, idx) => (
                            <li key={idx}>{typeof discount === 'string' ? discount : discount.name || discount.type}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Gift Cards */}
                {hasContent(poi.gift_cards_available) && (
                  <div className="bd-gift-cards">
                    <span className="bd-gift-cards__label">GIFT CARDS</span>
                    <span className="bd-gift-cards__value">
                      {typeof poi.gift_cards_available === 'boolean'
                        ? (poi.gift_cards_available ? 'for this business only.' : 'Not available')
                        : poi.gift_cards_available}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </AccordionSection>

          {/* 4. Menu + Ordering - Two Column Layout */}
          <AccordionSection
            title="Menu + Ordering"
            show={hasContent(poi.menu_link) || hasContent(poi.reservation_links) || hasContent(poi.delivery_links) || hasContent(poi.online_ordering_links)}
          >
            <div className="bd-menu-ordering">
              {/* Left Column: Service Links */}
              <div className="bd-menu-ordering__left">
                {/* Reservations */}
                {hasContent(poi.reservation_links) && (
                  <div className="bd-service-section">
                    <span className="bd-service-section__label">RESERVATIONS</span>
                    <div className="bd-service-links">
                      {(() => {
                        const links = Array.isArray(poi.reservation_links)
                          ? poi.reservation_links
                          : typeof poi.reservation_links === 'string'
                            ? [{ url: poi.reservation_links, name: 'Reserve' }]
                            : [];
                        return links.map((link, idx) => (
                          <a
                            key={idx}
                            href={typeof link === 'string' ? link : link.url || link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bd-service-link"
                          >
                            {typeof link === 'string' ? 'Reserve' : link.name || link.label || 'Reserve'}
                          </a>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Delivery Services */}
                {hasContent(poi.delivery_links) && (
                  <div className="bd-service-section">
                    <span className="bd-service-section__label">DELIVERY SERVICES</span>
                    <div className="bd-service-links">
                      {(() => {
                        const links = Array.isArray(poi.delivery_links)
                          ? poi.delivery_links
                          : typeof poi.delivery_links === 'string'
                            ? [{ url: poi.delivery_links, name: 'Order Delivery' }]
                            : [];
                        return links.map((link, idx) => (
                          <a
                            key={idx}
                            href={typeof link === 'string' ? link : link.url || link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bd-service-link"
                          >
                            {typeof link === 'string' ? 'Order Delivery' : link.name || link.label || 'Order'}
                          </a>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Online Ordering */}
                {hasContent(poi.online_ordering_links) && (
                  <div className="bd-service-section">
                    <span className="bd-service-section__label">ONLINE ORDERING</span>
                    <div className="bd-service-links">
                      {(() => {
                        const links = Array.isArray(poi.online_ordering_links)
                          ? poi.online_ordering_links
                          : typeof poi.online_ordering_links === 'string'
                            ? [{ url: poi.online_ordering_links, name: 'Order Online' }]
                            : [];
                        return links.map((link, idx) => (
                          <a
                            key={idx}
                            href={typeof link === 'string' ? link : link.url || link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bd-service-link"
                          >
                            {typeof link === 'string' ? 'Order Online' : link.name || link.label || 'Order'}
                          </a>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Menu Link + Menu Images */}
              <div className="bd-menu-ordering__right">
                {/* View Menu Button */}
                {poi.menu_link && (
                  <a
                    href={poi.menu_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bd-view-menu-btn"
                  >
                    <Globe size={14} /> View Menu
                  </a>
                )}

                {/* Menu Images - filter images with type 'menu' */}
                {(() => {
                  const menuImages = images.filter(img =>
                    img.type === 'menu' ||
                    (img.alt_text && img.alt_text.toLowerCase().includes('menu'))
                  ).slice(0, 4);

                  if (menuImages.length === 0) return null;

                  return (
                    <div className="bd-menu-images">
                      {menuImages.map((img, idx) => (
                        <button
                          key={img.id || idx}
                          className="bd-menu-images__item"
                          onClick={() => openLightbox(images.indexOf(img))}
                          type="button"
                        >
                          <img src={img.thumbnail_url || img.url} alt={img.alt_text || 'Menu'} />
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </AccordionSection>

          {/* 5. Public Restrooms */}
          {(() => {
            const restroomPhotos = getPhotosByType('restroom');
            return (
              <AccordionSection
                title="Public Restrooms"
                show={hasContent(poi.public_toilets) || hasContent(poi.toilet_description) || restroomPhotos.length > 0}
              >
                <div className="bd-restrooms">
                  <div className="bd-accordion__grid">
                    <InfoItem label="Available" value={poi.public_toilets} />
                    <InfoItem label="Locations" value={poi.toilet_locations} />
                    <InfoItem label="Details" value={poi.toilet_description} isHTML={true} />
                  </div>
                  {restroomPhotos.length > 0 && (
                    <div className="bd-section-photos">
                      <span className="bd-section-photos__label">RESTROOM PHOTOS</span>
                      <div className="bd-section-photos__grid">
                        {restroomPhotos.slice(0, 4).map((photo, idx) => (
                          <div key={photo.id || idx} className="bd-section-photos__item">
                            <img src={photo.thumbnail} alt={photo.alt} loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionSection>
            );
          })()}

          {/* 6. Accessibility */}
          <AccordionSection
            title="Accessibility"
            show={hasContent(poi.wheelchair_accessible) || hasContent(poi.wheelchair_details)}
          >
            <div className="bd-accordion__grid">
              <InfoItem label="Wheelchair Accessible" value={poi.wheelchair_accessible} />
              <InfoItem label="Accessibility Details" value={poi.wheelchair_details} isHTML={true} />
            </div>
          </AccordionSection>

          {/* 7. Pet Policy */}
          <AccordionSection
            title="Pet Policy"
            show={hasContent(poi.pet_options) || hasContent(poi.pet_policy)}
          >
            <div className="bd-accordion__grid">
              <InfoItem label="Pets Allowed" value={poi.pet_options} />
              <InfoItem label="Pet Policy" value={poi.pet_policy} isHTML={true} />
            </div>
          </AccordionSection>

          {/* 8. Alcohol + Smoking */}
          <AccordionSection
            title="Alcohol + Smoking"
            show={hasContent(poi.alcohol_options) || hasContent(poi.alcohol_description) || hasContent(poi.smoking_options) || hasContent(poi.smoking_details)}
          >
            <div className="bd-alcohol-smoking">
              {/* Alcohol Section */}
              {(hasContent(poi.alcohol_options) || hasContent(poi.alcohol_description)) && (
                <div className="bd-alcohol-smoking__section">
                  <h4 className="bd-alcohol-smoking__header">ALCOHOL</h4>
                  {hasContent(poi.alcohol_options) && (
                    <div className="bd-tags-grid">
                      {(Array.isArray(poi.alcohol_options)
                        ? poi.alcohol_options
                        : typeof poi.alcohol_options === 'string'
                          ? poi.alcohol_options.split(',').map(s => s.trim())
                          : []
                      ).filter(Boolean).map((option, idx) => (
                        <span key={idx} className="bd-tag">{option}</span>
                      ))}
                    </div>
                  )}
                  {hasContent(poi.alcohol_description) && (
                    <div className="bd-alcohol-smoking__description" dangerouslySetInnerHTML={{ __html: poi.alcohol_description }} />
                  )}
                </div>
              )}

              {/* Smoking Section */}
              {(hasContent(poi.smoking_options) || hasContent(poi.smoking_details)) && (
                <div className="bd-alcohol-smoking__section">
                  <h4 className="bd-alcohol-smoking__header">SMOKING</h4>
                  {hasContent(poi.smoking_options) && (
                    <div className="bd-tags-grid">
                      {(Array.isArray(poi.smoking_options)
                        ? poi.smoking_options
                        : typeof poi.smoking_options === 'string'
                          ? poi.smoking_options.split(',').map(s => s.trim())
                          : []
                      ).filter(Boolean).map((option, idx) => (
                        <span key={idx} className="bd-tag">{option}</span>
                      ))}
                    </div>
                  )}
                  {hasContent(poi.smoking_details) && (
                    <div className="bd-alcohol-smoking__description" dangerouslySetInnerHTML={{ __html: poi.smoking_details }} />
                  )}
                </div>
              )}
            </div>
          </AccordionSection>

          {/* 9. WiFi */}
          <AccordionSection
            title="WiFi"
            show={hasContent(poi.wifi_options)}
          >
            <div className="bd-accordion__grid">
              <InfoItem label="WiFi Available" value={poi.wifi_options} />
            </div>
          </AccordionSection>

          {/* 10. Playground */}
          {(() => {
            const playgroundPhotos = getPhotosByType('playground');
            return (
              <AccordionSection
                title="Playground"
                show={poi.playground_available || hasContent(poi.playground_types) || hasContent(poi.playground_notes) || playgroundPhotos.length > 0}
              >
                <div className="bd-playground">
                  <div className="bd-accordion__grid">
                    <InfoItem label="Available" value={poi.playground_available ? "Yes" : "No"} />
                    <InfoItem label="Playground Types" value={poi.playground_types} />
                    <InfoItem label="Surface Types" value={poi.playground_surface_types} />
                    <InfoItem label="Location" value={poi.playground_location} />
                    <InfoItem label="Notes" value={poi.playground_notes} isHTML={true} />
                  </div>
                  {playgroundPhotos.length > 0 && (
                    <div className="bd-section-photos">
                      <span className="bd-section-photos__label">PLAYGROUND PHOTOS</span>
                      <div className="bd-section-photos__grid">
                        {playgroundPhotos.slice(0, 4).map((photo, idx) => (
                          <div key={photo.id || idx} className="bd-section-photos__item">
                            <img src={photo.thumbnail} alt={photo.alt} loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionSection>
            );
          })()}

          {/* 11. Events */}
          <AccordionSection
            title="Events"
            show={hasContent(poi.event)}
          >
            <div className="bd-accordion__grid">
              <InfoItem label="Start Date" value={poi.event?.start_datetime ? new Date(poi.event.start_datetime).toLocaleString() : null} />
              <InfoItem label="End Date" value={poi.event?.end_datetime ? new Date(poi.event.end_datetime).toLocaleString() : null} />
              <InfoItem label="Organizer" value={poi.event?.organizer_name} />
              <InfoItem label="Venue" value={poi.event?.venue_settings} />
              <InfoItem label="Entry Notes" value={poi.event?.event_entry_notes} isHTML={true} />
              <InfoItem label="Food & Drink" value={poi.event?.food_and_drink_info} isHTML={true} />
            </div>
          </AccordionSection>

          {/* 12. Rentals */}
          {(() => {
            const rentalPhotos = getPhotosByType('rental');
            return (
              <AccordionSection
                title="Rentals"
                show={poi.available_for_rent || hasContent(poi.rental_info) || hasContent(poi.rental_pricing) || rentalPhotos.length > 0}
              >
                <div className="bd-rentals">
                  <div className="bd-accordion__grid">
                    <InfoItem label="Available for Rent" value={poi.available_for_rent ? "Yes" : "No"} />
                    <InfoItem label="Rental Info" value={poi.rental_info} isHTML={true} />
                    <InfoItem label="Pricing" value={poi.rental_pricing} isHTML={true} />
                    {poi.rental_link && (
                      <InfoItem label="Booking Link" value={poi.rental_link} />
                    )}
                  </div>
                  {rentalPhotos.length > 0 && (
                    <div className="bd-section-photos">
                      <span className="bd-section-photos__label">RENTAL PHOTOS</span>
                      <div className="bd-section-photos__grid">
                        {rentalPhotos.slice(0, 4).map((photo, idx) => (
                          <div key={photo.id || idx} className="bd-section-photos__item">
                            <img src={photo.thumbnail} alt={photo.alt} loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionSection>
            );
          })()}

          {/* 13. Locally Found + History */}
          <AccordionSection
            title="Locally Found + History"
            show={hasContent(poi.article_links) || hasContent(poi.community_impact) || hasContent(poi.history_paragraph)}
          >
            <div className="bd-locally-found">
              {/* Articles and Mentions */}
              {hasContent(poi.article_links) && (
                <div className="bd-locally-found__section">
                  <span className="bd-locally-found__label">ARTICLES AND MENTIONS</span>
                  <div className="bd-articles-list">
                    {(Array.isArray(poi.article_links) ? poi.article_links : []).map((article, idx) => (
                      <a
                        key={idx}
                        href={article.url || article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bd-article-link"
                      >
                        <ExternalLink size={14} />
                        <span>{article.title || article.name || `Article ${idx + 1}`}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Impact */}
              {hasContent(poi.community_impact) && (
                <div className="bd-locally-found__section">
                  <span className="bd-locally-found__label">COMMUNITY IMPACT</span>
                  <div className="bd-locally-found__content" dangerouslySetInnerHTML={{ __html: poi.community_impact }} />
                </div>
              )}

              {/* History */}
              {hasContent(poi.history_paragraph) && (
                <div className="bd-locally-found__section">
                  <span className="bd-locally-found__label">HISTORY</span>
                  <div className="bd-locally-found__content" dangerouslySetInnerHTML={{ __html: poi.history_paragraph }} />
                </div>
              )}
            </div>
          </AccordionSection>

          {/* 14. Contact */}
          <AccordionSection
            title="Contact"
            show={hasContent(poi.phone_number) || hasContent(poi.email) || hasContent(poi.website_url) || hasContent(poi.instagram_username) || hasContent(poi.facebook_username) || hasContent(poi.x_username) || hasContent(poi.tiktok_username) || hasContent(poi.youtube_url)}
          >
            <div className="bd-contact">
              {/* Top Row: Website, Phone, Questions/Feedback */}
              <div className="bd-contact__row">
                {/* Website */}
                {hasContent(poi.website_url) && (
                  <div className="bd-contact__item">
                    <span className="bd-contact__label">WEBSITE</span>
                    <a href={poi.website_url.startsWith('http') ? poi.website_url : `https://${poi.website_url}`} target="_blank" rel="noopener noreferrer" className="bd-contact__link">
                      <Globe size={16} />
                      <span>{poi.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    </a>
                  </div>
                )}

                {/* Phone */}
                {hasContent(poi.phone_number) && (
                  <div className="bd-contact__item">
                    <span className="bd-contact__label">PHONE</span>
                    <a href={`tel:${poi.phone_number}`} className="bd-contact__link">
                      <Phone size={16} />
                      <span>{poi.phone_number}</span>
                    </a>
                  </div>
                )}

                {/* Questions / Feedback */}
                {hasContent(poi.email) && (
                  <div className="bd-contact__item">
                    <span className="bd-contact__label">QUESTIONS / FEEDBACK</span>
                    <a href={`mailto:${poi.email}`} className="bd-contact__link">
                      <Mail size={16} />
                      <span>Drop us a message here</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Social Icons Row */}
              {(hasContent(poi.x_username) || hasContent(poi.facebook_username) || hasContent(poi.instagram_username) || hasContent(poi.youtube_url) || hasContent(poi.tiktok_username)) && (
                <div className="bd-contact__social">
                  <span className="bd-contact__social-label">FOLLOW US ON</span>
                  <div className="bd-contact__social-icons">
                    {poi.x_username && (
                      <a href={`https://x.com/${poi.x_username}`} target="_blank" rel="noopener noreferrer" className="bd-social-icon" aria-label="X/Twitter">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </a>
                    )}
                    {poi.facebook_username && (
                      <a href={`https://facebook.com/${poi.facebook_username}`} target="_blank" rel="noopener noreferrer" className="bd-social-icon" aria-label="Facebook">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                      </a>
                    )}
                    {poi.instagram_username && (
                      <a href={`https://instagram.com/${poi.instagram_username}`} target="_blank" rel="noopener noreferrer" className="bd-social-icon" aria-label="Instagram">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      </a>
                    )}
                    {poi.youtube_url && (
                      <a href={poi.youtube_url} target="_blank" rel="noopener noreferrer" className="bd-social-icon" aria-label="YouTube">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    )}
                    {poi.tiktok_username && (
                      <a href={`https://tiktok.com/@${poi.tiktok_username}`} target="_blank" rel="noopener noreferrer" className="bd-social-icon" aria-label="TikTok">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </AccordionSection>
        </div>
      </div>

      {/* Nearby Section */}
      <NearbySection currentPOI={poi} />

      {/* Photo Lightbox */}
      <PhotoLightbox
        images={images}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}

export default BusinessDetail;
