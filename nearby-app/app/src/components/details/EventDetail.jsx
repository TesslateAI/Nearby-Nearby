import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, Globe, Heart, Share2, Navigation, Plus, ChevronDown, ChevronUp, Calendar, AlertCircle, Copy, Check, ExternalLink, Info, CalendarCheck, Truck, ShoppingCart } from 'lucide-react';
import NearbySection from '../nearby-feature/NearbySection';
import HoursDisplay from '../common/HoursDisplay';
import { EventJsonLd } from '../seo/index';
import './EventDetail.css';

/**
 * EventDetail - Specialized detail view for event POIs
 * Receives poi data as a prop from POIDetail (smart router)
 */
function EventDetail({ poi }) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get coordinates - prefer front_door, fallback to location
  const getCoordinates = () => {
    if (poi?.front_door_latitude && poi?.front_door_longitude) {
      return { lat: poi.front_door_latitude, lng: poi.front_door_longitude };
    }
    if (poi?.location?.coordinates) {
      return { lat: poi.location.coordinates[1], lng: poi.location.coordinates[0] };
    }
    return null;
  };

  const handleDirections = () => {
    const coords = getCoordinates();
    if (coords) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
    } else if (poi?.address_street) {
      const address = encodeURIComponent(`${poi.address_street}, ${poi.address_city}, ${poi.address_state} ${poi.address_zip}`);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
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
    const coords = getCoordinates();
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

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = poi?.name || 'Check out this event';
    const description = poi?.description_short || '';

    switch (platform) {
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({ title, text: description, url });
          } catch (err) {
            if (err.name !== 'AbortError') console.error('Share failed:', err);
          }
        }
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`;
        break;
      case 'copy':
        try {
          const success = await copyToClipboard(url);
          if (success) {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          }
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        break;
    }
    setShowShareMenu(false);
  };

  // Get photos by type from the images array (for typed sections)
  const getPhotosByType = (type) => {
    if (!poi.images) return [];
    return poi.images
      .filter(img => {
        const imgType = img.type || img.image_type;
        if (typeof imgType === 'string') {
          return imgType.toLowerCase() === type.toLowerCase();
        }
        if (imgType?.value) {
          return imgType.value.toLowerCase() === type.toLowerCase();
        }
        return false;
      })
      .filter(img => !img.parent_image_id)
      .map(img => ({
        id: img.id,
        url: img.storage_url || img.url,
        thumbnail: img.thumbnail_url || img.storage_url || img.url,
        alt: img.alt_text || `${type} photo`,
        caption: img.caption
      }))
      .filter(img => img.url);
  };

  const CollapsibleSection = ({ title, children, show = true }) => {
    if (!show) return null;

    const isOpen = expandedSections[title];

    return (
      <div className="collapsible-section">
        <button
          onClick={() => toggleSection(title)}
          className="collapsible-section__header"
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

  const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="info-row">
        <span className="info-row__label">{label}</span>
        <span className="info-row__value">{value}</span>
      </div>
    );
  };

  // POIDetail handles loading/error states, so poi is guaranteed to exist here

  return (
    <div className="poi-detail">
      {/* Schema.org Event structured data for SEO */}
      <EventJsonLd poi={poi} />

      <div className="poi-detail__container">
        <button onClick={() => navigate('/')} className="poi-detail__back-link">
          ← Back to Search
        </button>

        {/* Header Section */}
        <div className="poi-detail__new-header">
          {/* Status Badge */}
          <div className="poi-detail__status-row">
            <span className="poi-detail__status-text">
              STATUS: <span className="poi-detail__status-value">{poi.status || 'Upcoming'}</span>
            </span>
            {poi.is_verified && (
              <div className="poi-detail__verified-wrapper">
                <div className="poi-detail__verified">
                  <div className="poi-detail__verified-icon">
                    <div className="poi-detail__verified-dot"></div>
                  </div>
                  Verified
                  <Info size={14} className="poi-detail__verified-info" />
                </div>
                <div className="poi-detail__verified-tooltip">
                  This event has been confirmed with the organizer or venue by a Nearby Nearby Team member.
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="poi-detail__main-title">{poi.name}</h1>

          {/* Subtitle */}
          {poi.description_short && (
            <p className="poi-detail__subtitle">{poi.description_short}</p>
          )}

          {/* Event Date Badge */}
          {poi.event && poi.event.start_datetime && (
            <div className="poi-detail__sponsor">
              <span className="poi-detail__sponsor-badge">
                {new Date(poi.event.start_datetime).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}

          {/* Quick Info */}
          <div className="poi-detail__quick-info">
            {poi.event && poi.event.start_datetime && (
              <div className="poi-detail__info-item">
                <Calendar size={16} className="poi-detail__icon poi-detail__icon--green" />
                <span className="poi-detail__info-primary">
                  {new Date(poi.event.start_datetime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="poi-detail__info-secondary">
                  {' '}at {new Date(poi.event.start_datetime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
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

          {/* Titled Links Section */}
          {(poi.reservation_links?.length > 0 || poi.delivery_links?.length > 0 || poi.online_ordering_links?.length > 0 || poi.appointment_links?.length > 0) && (
            <div className="poi-detail__titled-links">
              {poi.reservation_links && poi.reservation_links.map((link, idx) => {
                const url = typeof link === 'string' ? link : link?.url;
                const title = typeof link === 'string' ? 'Make a Reservation' : (link?.title || 'Make a Reservation');
                if (!url) return null;
                return (
                  <a key={`res-${idx}`} href={url.startsWith('http') ? url : `https://${url}`} className="poi-detail__titled-link" target="_blank" rel="noopener noreferrer">
                    <CalendarCheck size={18} /><span>{title}</span><ExternalLink size={14} />
                  </a>
                );
              })}
              {poi.delivery_links && poi.delivery_links.map((link, idx) => {
                const url = typeof link === 'string' ? link : link?.url;
                const title = typeof link === 'string' ? 'Order Delivery' : (link?.title || 'Order Delivery');
                if (!url) return null;
                return (
                  <a key={`del-${idx}`} href={url.startsWith('http') ? url : `https://${url}`} className="poi-detail__titled-link" target="_blank" rel="noopener noreferrer">
                    <Truck size={18} /><span>{title}</span><ExternalLink size={14} />
                  </a>
                );
              })}
              {poi.online_ordering_links && poi.online_ordering_links.map((link, idx) => {
                const url = typeof link === 'string' ? link : link?.url;
                const title = typeof link === 'string' ? 'Order Online' : (link?.title || 'Order Online');
                if (!url) return null;
                return (
                  <a key={`ord-${idx}`} href={url.startsWith('http') ? url : `https://${url}`} className="poi-detail__titled-link" target="_blank" rel="noopener noreferrer">
                    <ShoppingCart size={18} /><span>{title}</span><ExternalLink size={14} />
                  </a>
                );
              })}
              {poi.appointment_links && poi.appointment_links.map((link, idx) => {
                const url = typeof link === 'string' ? link : link?.url;
                const title = typeof link === 'string' ? 'Book Appointment' : (link?.title || 'Book Appointment');
                if (!url) return null;
                return (
                  <a key={`apt-${idx}`} href={url.startsWith('http') ? url : `https://${url}`} className="poi-detail__titled-link" target="_blank" rel="noopener noreferrer">
                    <CalendarCheck size={18} /><span>{title}</span><ExternalLink size={14} />
                  </a>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="poi-detail__actions">
            <button className="poi-detail__action-btn" onClick={handleDirections}>
              <MapPin size={16} />
              Directions
            </button>
            <button className="poi-detail__action-btn" onClick={handleCopyCoords}>
              {copiedCoords ? <Check size={16} /> : <Copy size={16} />}
              {copiedCoords ? 'Copied!' : 'Lat & Long'}
            </button>
            <div className="poi-detail__share-wrapper">
              <button className="poi-detail__action-btn" onClick={() => navigator.share ? handleShare('native') : setShowShareMenu(!showShareMenu)}>
                <Share2 size={16} />
                Share
              </button>
              {showShareMenu && (
                <div className="poi-detail__share-menu">
                  <button onClick={() => handleShare('facebook')}>
                    <ExternalLink size={14} /> Facebook
                  </button>
                  <button onClick={() => handleShare('twitter')}>
                    <ExternalLink size={14} /> Twitter
                  </button>
                  <button onClick={() => handleShare('email')}>
                    <ExternalLink size={14} /> Email
                  </button>
                  <button onClick={() => handleShare('copy')}>
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
            <button className="poi-detail__action-btn">
              <Heart size={16} />
            </button>
          </div>

          {/* Description Box */}
          {poi.description_long && (
            <div className="poi-detail__description-box">
              <div className="poi-detail__description-text">
                {poi.description_long}
              </div>
            </div>
          )}

          {/* Amenities */}
          {poi.amenities && poi.amenities.length > 0 && (
            <div className="poi-detail__amenities-section">
              <h3 className="poi-detail__amenities-title">Event Features</h3>
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
              <button className="poi-detail__photos-link">View All</button>
            </div>
            <div className="poi-detail__photos-grid">
              {poi.images.slice(0, 4).map((image, i) => (
                <div key={i} className="poi-detail__photo-placeholder"></div>
              ))}
            </div>
          </div>
        )}

        {/* Event-Specific Collapsible Sections */}
        <div className="poi-detail__collapsible-sections">
          <CollapsibleSection title="EVENT DETAILS" show={poi.event}>
            <div className="collapsible-section__info">
              <InfoRow label="Start Date" value={poi.event?.start_datetime ? new Date(poi.event.start_datetime).toLocaleString() : null} />
              <InfoRow label="End Date" value={poi.event?.end_datetime ? new Date(poi.event.end_datetime).toLocaleString() : null} />
              <InfoRow label="Organizer" value={poi.event?.organizer_name} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="ABOUT + HOURS" show={poi.description_long || poi.hours}>
            <div className="collapsible-section__info">
              {poi.description_long && (
                <InfoRow label="Description" value={poi.description_long} />
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

          <CollapsibleSection title="ADDRESS + PARKING" show={poi.address_street || poi.parking_types}>
            <div className="collapsible-section__info">
              <InfoRow label="Street" value={poi.address_street} />
              <InfoRow label="City" value={poi.address_city} />
              <InfoRow label="State" value={poi.address_state} />
              <InfoRow label="Zip" value={poi.address_zip} />
              {poi.parking_types && Array.isArray(poi.parking_types) && (
                <InfoRow label="Parking" value={poi.parking_types.join(", ")} />
              )}
              {poi.parking_notes && <InfoRow label="Parking Notes" value={poi.parking_notes} />}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="WHAT TO EXPECT" show={poi.wheelchair_accessible || poi.ideal_for}>
            <div className="collapsible-section__info">
              {poi.wheelchair_accessible && Array.isArray(poi.wheelchair_accessible) && (
                <InfoRow label="Accessibility" value={poi.wheelchair_accessible.join(", ")} />
              )}
              {poi.ideal_for && Array.isArray(poi.ideal_for) && (
                <InfoRow label="Ideal For" value={poi.ideal_for.join(", ")} />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="PUBLIC RESTROOMS" show={poi.public_toilets}>
            <div className="collapsible-section__info">
              {poi.public_toilets && Array.isArray(poi.public_toilets) && (
                <InfoRow label="Available" value={poi.public_toilets.join(", ")} />
              )}
              {poi.toilet_description && (
                <InfoRow label="Details" value={poi.toilet_description} />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="ACCESSIBILITY" show={poi.wheelchair_accessible || poi.wheelchair_details}>
            <div className="collapsible-section__info">
              {poi.wheelchair_accessible && Array.isArray(poi.wheelchair_accessible) && (
                <InfoRow label="Wheelchair" value={poi.wheelchair_accessible.join(", ")} />
              )}
              {poi.wheelchair_details && (
                <InfoRow label="Details" value={poi.wheelchair_details} />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="PET POLICY" show={poi.pet_options || poi.pet_policy}>
            <div className="collapsible-section__info">
              {poi.pet_options && Array.isArray(poi.pet_options) && (
                <InfoRow label="Pets Allowed" value={poi.pet_options.join(", ")} />
              )}
              {poi.pet_policy && (
                <InfoRow label="Policy" value={poi.pet_policy} />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="TIPS + TRICKS" show={poi.community_impact || poi.history_paragraph}>
            <div className="collapsible-section__info">
              {poi.history_paragraph && (
                <InfoRow label="History" value={poi.history_paragraph} />
              )}
              {poi.community_impact && (
                <InfoRow label="Community Impact" value={poi.community_impact} />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="CONTACT" show={poi.phone_number || poi.email || poi.website_url}>
            <div className="collapsible-section__info">
              <InfoRow label="Phone" value={poi.phone_number} />
              <InfoRow label="Email" value={poi.email} />
              <InfoRow label="Website" value={poi.website_url} />
              {poi.instagram_username && (
                <InfoRow label="Instagram" value={`@${poi.instagram_username}`} />
              )}
              {poi.facebook_username && (
                <InfoRow label="Facebook" value={poi.facebook_username} />
              )}
            </div>
          </CollapsibleSection>
        </div>

        {/* Bottom Border */}
        <div className="poi-detail__bottom-border"></div>
      </div>

      {/* Nearby Section */}
      <NearbySection currentPOI={poi} />
    </div>
  );
}

export default EventDetail;
