import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Clock, Phone, Globe, Share2, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import NearbySection from '../nearby-feature/NearbySection';
import HoursDisplay from '../common/HoursDisplay';
import SEO from '../SEO';
import { truncateText, getPOIUrl } from '../../utils/slugify';
import './GenericDetail.css';

/**
 * GenericDetail - Fallback detail view for POIs without specialized components
 * Receives poi data as a prop from POIDetail (smart router)
 */
function GenericDetail({ poi }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({});
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => {
      if (prev[section]) {
        return { ...prev, [section]: false };
      }
      return { [section]: true };
    });
  };

  const scrollToNearby = () => {
    const nearbySection = document.querySelector('.nearby-section');
    if (nearbySection) {
      nearbySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const copyLatLong = async () => {
    let lat, lng;
    if (poi.front_door_latitude && poi.front_door_longitude) {
      lat = poi.front_door_latitude;
      lng = poi.front_door_longitude;
    } else if (poi.location?.coordinates) {
      lat = poi.location.coordinates[1];
      lng = poi.location.coordinates[0];
    }

    if (lat && lng) {
      const latLong = `${lat}, ${lng}`;
      const success = await copyToClipboard(latLong);
      if (success) {
        setShowCopiedFeedback(true);
        setTimeout(() => setShowCopiedFeedback(false), 2500);
      } else {
        alert(`Lat/Long: ${latLong}`);
      }
    }
  };

  const copyShareLink = async () => {
    const url = window.location.href;
    const success = await copyToClipboard(url);
    if (success) {
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2500);
    } else {
      alert(`Share this link: ${url}`);
    }
  };

  const handleDirections = () => {
    let lat, lng;
    if (poi.front_door_latitude && poi.front_door_longitude) {
      lat = poi.front_door_latitude;
      lng = poi.front_door_longitude;
    } else if (poi.location?.coordinates) {
      lat = poi.location.coordinates[1];
      lng = poi.location.coordinates[0];
    }

    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (poi.address_street) {
      const address = encodeURIComponent(`${poi.address_street}, ${poi.address_city}, ${poi.address_state} ${poi.address_zip}`);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  const hasContent = (value) => {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  };

  const CollapsibleSection = ({ title, children, show = true }) => {
    if (!show) return null;

    const isOpen = expandedSections[title];

    const handleClick = (e) => {
      e.preventDefault();
      toggleSection(title);
    };

    return (
      <div className="collapsible-section">
        <button
          onClick={handleClick}
          className="collapsible-section__header"
          type="button"
          aria-expanded={isOpen ? "true" : "false"}
        >
          <span className="collapsible-section__title">{title}</span>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {isOpen && (
          <div className="collapsible-section__content">
            {children}
          </div>
        )}
      </div>
    );
  };

  const InfoRow = ({ label, value, isHTML = false }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    const displayValue = Array.isArray(value) ? value.join(", ") : value;

    return (
      <div className="info-row">
        <span className="info-row__label">{label}</span>
        {isHTML ? (
          <div className="info-row__value" dangerouslySetInnerHTML={{ __html: displayValue }} />
        ) : (
          <span className="info-row__value">{displayValue}</span>
        )}
      </div>
    );
  };

  // Prepare SEO data
  const seoTitle = poi.name;
  const seoDescription = truncateText(
    poi.description_long || poi.description_short || poi.teaser_paragraph ||
    `Discover ${poi.name} in ${poi.address_city || 'your area'}. ${poi.main_category?.name || poi.poi_type}`,
    155
  );
  const seoImage = poi.featured_image || (poi.images && poi.images.length > 0 ? poi.images[0].url : null);
  const seoUrl = `${window.location.origin}${getPOIUrl(poi)}`;

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
        type="place"
      />
      <div className="poi-detail">
        <div className="poi-detail__container">
          <button type="button" onClick={() => navigate('/')} className="poi-detail__back-link">
            ← Back to Search
          </button>

          {/* Header Section */}
          <div className="poi-detail__new-header">
            {/* Status Badge */}
            <div className="poi-detail__status-row">
              <span className="poi-detail__status-text">
                STATUS: <span className="poi-detail__status-value">{poi.status || 'Fully Open'}</span>
              </span>
              {poi.is_verified && (
                <div className="poi-detail__verified" title="When you see the Verified badge, you can trust it's real. Personally confirmed by the Nearby Nearby team.">
                  <div className="poi-detail__verified-icon">
                    <div className="poi-detail__verified-dot"></div>
                  </div>
                  Verified
                  <span className="poi-detail__verified-help">What's this?</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="poi-detail__main-title">{poi.name}</h1>

            {/* Location with Category */}
            <div className="poi-detail__location">
              {poi.categories && poi.categories.length > 0 && (
                <span className="poi-detail__category">{poi.categories[0].name}</span>
              )}
              {poi.categories && poi.categories.length > 0 && (poi.address_city || poi.address_county || poi.address_state) && (
                <span className="poi-detail__separator"> ● </span>
              )}
              {[
                poi.address_city,
                poi.address_county,
                poi.address_state === 'NC' ? 'North Carolina' : poi.address_state
              ].filter(Boolean).join(', ')}
            </div>

            {/* Teaser/Subtitle */}
            {(poi.teaser_paragraph || poi.description_short) && (
              <div
                className="poi-detail__subtitle"
                dangerouslySetInnerHTML={{ __html: poi.teaser_paragraph || poi.description_short }}
              />
            )}

            {/* Quick Info */}
            <div className="poi-detail__quick-info">
              {poi.hours && (
                <div className="poi-detail__info-item">
                  <Clock size={16} className="poi-detail__icon poi-detail__icon--green" />
                  <span className="poi-detail__info-primary">Open Now</span>
                  <span className="poi-detail__info-secondary"> - Until 8:00 PM</span>
                  <button type="button" className="poi-detail__hours-btn">
                    Opening Hours
                  </button>
                </div>
              )}

              {poi.address_street && (
                <div className="poi-detail__info-item">
                  <MapPin size={16} className="poi-detail__icon" />
                  <span className="poi-detail__info-text">{poi.address_street}</span>
                </div>
              )}

              {poi.phone_number && (
                <div className="poi-detail__info-item">
                  <Phone size={16} className="poi-detail__icon" />
                  <span className="poi-detail__info-text">{poi.phone_number}</span>
                </div>
              )}

              {poi.website_url && (
                <div className="poi-detail__info-item">
                  <Globe size={16} className="poi-detail__icon" />
                  <a href={`https://${poi.website_url}`} className="poi-detail__info-link" target="_blank" rel="noopener noreferrer">
                    {poi.website_url}
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="poi-detail__actions">
              <button className="poi-detail__action-btn" onClick={handleDirections} type="button">
                <Navigation size={16} />
                Directions
              </button>
              <button className="poi-detail__action-btn" onClick={copyLatLong} type="button">
                <MapPin size={16} />
                Lat & Long
              </button>
              <button className="poi-detail__action-btn" onClick={scrollToNearby} type="button">
                <MapPin size={16} />
                View Nearby
              </button>
              <button className="poi-detail__action-btn" onClick={copyShareLink} type="button">
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* Lat/Long Info Text */}
            <div className="poi-detail__latlong-info">
              * Use LAT/LONG! DIRECTIONS misses it. Nearby Nearby nails it. Use LAT/LONG for best results.
            </div>

            {/* Copied Feedback */}
            {showCopiedFeedback && (
              <div className="poi-detail__copied-feedback">
                ✓ Link copied to clipboard!
              </div>
            )}

            {/* Description Box */}
            {poi.description_long && (
              <div className="poi-detail__description-box">
                <div
                  className="poi-detail__description-text"
                  dangerouslySetInnerHTML={{ __html: poi.description_long }}
                />
              </div>
            )}

            {/* Facilities + Amenities */}
            {poi.amenities && poi.amenities.length > 0 && (
              <div className="poi-detail__amenities-section">
                <h3 className="poi-detail__amenities-title">Facilities + Amenities</h3>
                <div className="poi-detail__amenities-grid">
                  {poi.amenities.map((amenity, idx) => (
                    <span key={idx} className="poi-detail__amenity-tag">
                      <span className="poi-detail__amenity-dot">•</span> {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Photos Section */}
          {poi.images && poi.images.length > 0 && (
            <div className="poi-detail__photos-section">
              <div className="poi-detail__photos-header">
                <h3 className="poi-detail__photos-title">PHOTOS</h3>
                <button type="button" className="poi-detail__photos-link">View All</button>
              </div>
              <div className="poi-detail__photos-grid">
                {poi.images.slice(0, 4).map((image, i) => (
                  <div key={i} className="poi-detail__photo-item">
                    <img
                      src={image.thumbnail_url || image.url}
                      alt={image.alt_text || `${poi.name} photo ${i + 1}`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Sections */}
          <div className="poi-detail__collapsible-sections">
            <CollapsibleSection title="ABOUT + HOURS" show={hasContent(poi.description_long) || hasContent(poi.hours)}>
              <div className="collapsible-section__info">
                {hasContent(poi.description_long) && (
                  <InfoRow label="Description" value={poi.description_long} isHTML={true} />
                )}
                <HoursDisplay
                  hours={poi.hours}
                  holidayHours={poi.holiday_hours}
                  appointmentLinks={poi.appointment_links}
                  appointmentBookingUrl={poi.appointment_booking_url}
                  appointmentRequired={poi.hours_but_appointment_required}
                  hoursNotes={poi.hours_notes}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="ADDRESS + PARKING" show={hasContent(poi.address_street) || hasContent(poi.parking_types) || hasContent(poi.parking_notes) || hasContent(poi.public_transit_info)}>
              <div className="collapsible-section__info">
                <InfoRow label="Street" value={poi.address_street} />
                <InfoRow label="City" value={poi.address_city} />
                <InfoRow label="State" value={poi.address_state === 'NC' ? 'North Carolina' : poi.address_state} />
                <InfoRow label="Zip" value={poi.address_zip} />
                <InfoRow label="County" value={poi.address_county} />
                <InfoRow label="Parking Types" value={poi.parking_types} />
                <InfoRow label="Parking Notes" value={poi.parking_notes} isHTML={true} />
                <InfoRow label="Expect to Pay for Parking" value={poi.expect_to_pay_parking} />
                <InfoRow label="Public Transit" value={poi.public_transit_info} isHTML={true} />
              </div>
            </CollapsibleSection>

            {poi.poi_type === "BUSINESS" && (
              <CollapsibleSection title="MENU + ORDERING" show={hasContent(poi.business?.price_range) || hasContent(poi.alcohol_options) || hasContent(poi.price_range_per_person)}>
                <div className="collapsible-section__info">
                  <InfoRow label="Price Range" value={poi.business?.price_range} />
                  <InfoRow label="Alcohol" value={poi.alcohol_options} />
                  <InfoRow label="Price Per Person" value={poi.price_range_per_person} />
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="WHAT TO EXPECT" show={
              hasContent(poi.wheelchair_accessible) ||
              hasContent(poi.wifi_options) ||
              (poi.key_facilities && Array.isArray(poi.key_facilities) && poi.key_facilities.some(f => f && f.toLowerCase() === 'wifi')) ||
              hasContent(poi.payment_methods) ||
              hasContent(poi.ideal_for) ||
              hasContent(poi.amenities) ||
              hasContent(poi.key_facilities)
            }>
              <div className="collapsible-section__info">
                <InfoRow label="Accessibility" value={poi.wheelchair_accessible} />
                <InfoRow
                  label="Wi-Fi"
                  value={
                    hasContent(poi.wifi_options)
                      ? poi.wifi_options
                      : (poi.key_facilities && Array.isArray(poi.key_facilities) && poi.key_facilities.some(f => f && f.toLowerCase() === 'wifi'))
                        ? "Yes"
                        : null
                  }
                />
                <InfoRow label="Payment" value={poi.payment_methods} />
                <InfoRow label="Ideal For" value={poi.ideal_for} />
                <InfoRow label="Amenities" value={poi.amenities} />
                <InfoRow label="Key Facilities" value={poi.key_facilities} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="PUBLIC RESTROOMS" show={hasContent(poi.public_toilets) || hasContent(poi.toilet_description)}>
              <div className="collapsible-section__info">
                <InfoRow label="Available" value={poi.public_toilets} />
                <InfoRow label="Locations" value={poi.toilet_locations} />
                <InfoRow label="Details" value={poi.toilet_description} isHTML={true} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="ACCESSIBILITY" show={hasContent(poi.wheelchair_accessible) || hasContent(poi.wheelchair_details)}>
              <div className="collapsible-section__info">
                <InfoRow label="Wheelchair Accessible" value={poi.wheelchair_accessible} />
                <InfoRow label="Details" value={poi.wheelchair_details} isHTML={true} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="PET POLICY" show={hasContent(poi.pet_options) || hasContent(poi.pet_policy)}>
              <div className="collapsible-section__info">
                {poi.pet_options && Array.isArray(poi.pet_options) && (
                  <InfoRow label="Pets Allowed" value={poi.pet_options.join(", ")} />
                )}
                {poi.pet_policy && (
                  <InfoRow label="Policy" value={poi.pet_policy} isHTML={true} />
                )}
              </div>
            </CollapsibleSection>

            {poi.poi_type === "PARK" && (
              <CollapsibleSection title="PLAYGROUND" show={poi.playground_available === true || hasContent(poi.playground_types) || hasContent(poi.playground_notes)}>
                <div className="collapsible-section__info">
                  <InfoRow label="Available" value={poi.playground_available ? "Yes" : "No"} />
                  <InfoRow label="Types" value={poi.playground_types} />
                  <InfoRow label="Notes" value={poi.playground_notes} />
                </div>
              </CollapsibleSection>
            )}

            {poi.poi_type === "EVENT" && poi.event && (
              <CollapsibleSection title="EVENTS" show={hasContent(poi.event.start_datetime) || hasContent(poi.event.end_datetime) || hasContent(poi.event.organizer_name)}>
                <div className="collapsible-section__info">
                  <InfoRow label="Start Date" value={poi.event.start_datetime ? new Date(poi.event.start_datetime).toLocaleString() : null} />
                  <InfoRow label="End Date" value={poi.event.end_datetime ? new Date(poi.event.end_datetime).toLocaleString() : null} />
                  <InfoRow label="Organizer" value={poi.event.organizer_name} />
                </div>
              </CollapsibleSection>
            )}

            {poi.poi_type === "TRAIL" && poi.trail && (
              <CollapsibleSection title="TRAIL DETAILS" show={hasContent(poi.trail.length_text) || hasContent(poi.trail.difficulty) || hasContent(poi.trail.route_type) || hasContent(poi.trail.difficulty_description)}>
                <div className="collapsible-section__info">
                  <InfoRow label="Length" value={poi.trail.length_text} />
                  <InfoRow label="Difficulty" value={poi.trail.difficulty} />
                  <InfoRow label="Route Type" value={poi.trail.route_type} />
                  <InfoRow label="Difficulty Info" value={poi.trail.difficulty_description} />
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="RENTALS" show={poi.available_for_rent === true || hasContent(poi.rental_info) || hasContent(poi.rental_pricing)}>
              <div className="collapsible-section__info">
                <InfoRow label="Available for Rent" value={poi.available_for_rent ? "Yes" : "No"} />
                <InfoRow label="Info" value={poi.rental_info} isHTML={true} />
                <InfoRow label="Pricing" value={poi.rental_pricing} isHTML={true} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="LOCALLY FOUND" show={hasContent(poi.locally_found_at)}>
              <div className="collapsible-section__info">
                <InfoRow label="Available At" value={poi.locally_found_at} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="PROVIDES SERVICES TO" show={hasContent(poi.service_locations)}>
              <div className="collapsible-section__info">
                <InfoRow label="Locations" value={poi.service_locations} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="HISTORY + COMMUNITY" show={hasContent(poi.community_impact) || hasContent(poi.history_paragraph)}>
              <div className="collapsible-section__info">
                <InfoRow label="History" value={poi.history_paragraph} isHTML={true} />
                <InfoRow label="Community Impact" value={poi.community_impact} isHTML={true} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="ALCOHOL + SMOKING" show={hasContent(poi.smoking_options) || hasContent(poi.smoking_details) || hasContent(poi.alcohol_options) || hasContent(poi.alcohol_description)}>
              <div className="alcohol-smoking">
                {/* Alcohol Section */}
                {(hasContent(poi.alcohol_options) || hasContent(poi.alcohol_description)) && (
                  <div className="alcohol-smoking__section">
                    <h4 className="alcohol-smoking__header">ALCOHOL</h4>
                    {hasContent(poi.alcohol_options) && (
                      <div className="tags-grid">
                        {(Array.isArray(poi.alcohol_options)
                          ? poi.alcohol_options
                          : typeof poi.alcohol_options === 'string'
                            ? poi.alcohol_options.split(',').map(s => s.trim())
                            : []
                        ).filter(Boolean).map((option, idx) => (
                          <span key={idx} className="tag">{option}</span>
                        ))}
                      </div>
                    )}
                    {hasContent(poi.alcohol_description) && (
                      <div className="alcohol-smoking__description" dangerouslySetInnerHTML={{ __html: poi.alcohol_description }} />
                    )}
                  </div>
                )}

                {/* Smoking Section */}
                {(hasContent(poi.smoking_options) || hasContent(poi.smoking_details)) && (
                  <div className="alcohol-smoking__section">
                    <h4 className="alcohol-smoking__header">SMOKING</h4>
                    {hasContent(poi.smoking_options) && (
                      <div className="tags-grid">
                        {(Array.isArray(poi.smoking_options)
                          ? poi.smoking_options
                          : typeof poi.smoking_options === 'string'
                            ? poi.smoking_options.split(',').map(s => s.trim())
                            : []
                        ).filter(Boolean).map((option, idx) => (
                          <span key={idx} className="tag">{option}</span>
                        ))}
                      </div>
                    )}
                    {hasContent(poi.smoking_details) && (
                      <div className="alcohol-smoking__description" dangerouslySetInnerHTML={{ __html: poi.smoking_details }} />
                    )}
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="DRONE POLICY" show={hasContent(poi.drone_usage) || hasContent(poi.drone_policy)}>
              <div className="collapsible-section__info">
                <InfoRow label="Drone Usage" value={poi.drone_usage} />
                <InfoRow label="Policy" value={poi.drone_policy} isHTML={true} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="PRICING + TICKETS" show={hasContent(poi.cost) || hasContent(poi.pricing_details) || hasContent(poi.ticket_link)}>
              <div className="collapsible-section__info">
                <InfoRow label="Cost" value={poi.cost} />
                <InfoRow label="Pricing Details" value={poi.pricing_details} isHTML={true} />
                <InfoRow label="Price Per Person" value={poi.price_range_per_person} />
                <InfoRow label="Ticket Link" value={poi.ticket_link} />
                <InfoRow label="Gift Cards" value={poi.gift_cards} />
                <InfoRow label="Discounts" value={poi.discounts} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="CONTACT + SOCIAL MEDIA" show={hasContent(poi.phone_number) || hasContent(poi.email) || hasContent(poi.website_url) || hasContent(poi.instagram_username) || hasContent(poi.facebook_username)}>
              <div className="collapsible-section__info">
                <InfoRow label="Phone" value={poi.phone_number} />
                <InfoRow label="Email" value={poi.email} />
                <InfoRow label="Website" value={poi.website_url} />
                <InfoRow label="Main Contact" value={poi.main_contact_name} />
                <InfoRow label="Contact Email" value={poi.main_contact_email} />
                <InfoRow label="Contact Phone" value={poi.main_contact_phone} />
                {poi.instagram_username && (
                  <InfoRow label="Instagram" value={`@${poi.instagram_username}`} />
                )}
                {poi.facebook_username && (
                  <InfoRow label="Facebook" value={poi.facebook_username} />
                )}
                {poi.x_username && (
                  <InfoRow label="X/Twitter" value={`@${poi.x_username}`} />
                )}
                {poi.tiktok_username && (
                  <InfoRow label="TikTok" value={`@${poi.tiktok_username}`} />
                )}
                {poi.linkedin_username && (
                  <InfoRow label="LinkedIn" value={poi.linkedin_username} />
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* Bottom Border */}
          <div className="poi-detail__bottom-border"></div>

          {/* Nearby Section */}
          <NearbySection currentPOI={poi} />
        </div>
      </div>
    </>
  );
}

export default GenericDetail;
