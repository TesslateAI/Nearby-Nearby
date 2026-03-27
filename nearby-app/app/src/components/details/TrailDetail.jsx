import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Phone, Globe, Heart, Share2, Navigation, Plus, ChevronDown, ChevronUp, Mountain, AlertCircle, Copy, Check, ExternalLink, Info, CalendarCheck, Truck, ShoppingCart } from 'lucide-react';
import NearbySection from '../nearby-feature/NearbySection';
import HoursDisplay from '../common/HoursDisplay';
import SEO from '../SEO';
import { truncateText, getPOIUrl } from '../../utils/slugify';
import { isCurrentlyOpen } from '../../utils/hoursUtils';
import './TrailDetail.css';

/**
 * TrailDetail - Specialized detail view for trail POIs
 * Receives poi data as a prop from POIDetail (smart router)
 */
function TrailDetail({ poi }) {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});
  const [showHours, setShowHours] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Get coordinates - prefer trailhead, then front_door, fallback to location
  const getCoordinates = () => {
    if (poi?.trailhead_latitude && poi?.trailhead_longitude) {
      return { lat: poi.trailhead_latitude, lng: poi.trailhead_longitude };
    }
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
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
    } else if (poi?.address_street) {
      const address = encodeURIComponent(`${poi.address_street}, ${poi.address_city}, ${poi.address_state} ${poi.address_zip}`);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  const handleCopyCoords = async () => {
    const coords = getCoordinates();
    if (coords) {
      try {
        await navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
        setCopiedCoords(true);
        setTimeout(() => setCopiedCoords(false), 2000);
      } catch (err) {
        console.error('Failed to copy coordinates:', err);
      }
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = poi?.name || 'Check out this trail';
    const description = poi?.description_short || poi?.description_long?.substring(0, 150) || '';

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}&hashtags=NearbyNearby,Trails`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\n' + url)}`,
    };

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
    } else if (platform === 'native' && navigator.share) {
      try { await navigator.share({ title, text: description, url }); } catch {}
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get photos by type from the images array (for typed sections like trail_head, restroom, etc.)
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

  // Prepare SEO data
  const seoTitle = poi.name;
  const seoDescription = truncateText(
    poi.description_long || poi.description_short || poi.teaser_paragraph ||
    `Discover ${poi.name} in ${poi.address_city || 'your area'}. Local trail on NearbyNearby.`,
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
        <button onClick={() => navigate('/')} className="poi-detail__back-link">
          ← Back to Search
        </button>

        {/* Header Section */}
        <div className="poi-detail__new-header">
          {/* Status Badge */}
          <div className="poi-detail__status-row">
            <span className="poi-detail__status-text">
              STATUS: <span className="poi-detail__status-value">{poi.status || 'Open'}</span>
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
                  This place has been checked and confirmed as accurate by a Nearby Nearby Team member
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

          {/* Trail Difficulty Badge */}
          {poi.trail && poi.trail.difficulty && (
            <div className="poi-detail__sponsor">
              <span className="poi-detail__sponsor-badge">
                {poi.trail.difficulty} Difficulty
              </span>
            </div>
          )}

          {/* Quick Info */}
          <div className="poi-detail__quick-info">
            {poi.trail && poi.trail.length_text && (
              <div className="poi-detail__info-item">
                <Mountain size={16} className="poi-detail__icon poi-detail__icon--green" />
                <span className="poi-detail__info-primary">{poi.trail.length_text}</span>
                {poi.trail.route_type && (
                  <span className="poi-detail__info-secondary"> - {poi.trail.route_type}</span>
                )}
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
              <Navigation size={16} />
              Directions
            </button>
            {getCoordinates() && (
              <button className="poi-detail__action-btn" onClick={handleCopyCoords}>
                {copiedCoords ? <Check size={16} /> : <Copy size={16} />}
                {copiedCoords ? 'Copied!' : 'Copy Lat/Long'}
              </button>
            )}
            <button className="poi-detail__action-btn">
              <Plus size={16} />
              Add to Plan
            </button>
            <div className="poi-detail__share-wrapper">
              <button
                className="poi-detail__action-btn"
                onClick={() => navigator.share ? handleShare('native') : setShowShareMenu(!showShareMenu)}
              >
                <Share2 size={16} />
                Share
              </button>
              {showShareMenu && (
                <div className="poi-detail__share-menu">
                  <button onClick={() => handleShare('facebook')}><ExternalLink size={14} /> Facebook</button>
                  <button onClick={() => handleShare('twitter')}><ExternalLink size={14} /> Twitter/X</button>
                  <button onClick={() => handleShare('email')}><ExternalLink size={14} /> Email</button>
                  <button onClick={() => handleShare('copy')}><Copy size={14} /> Copy Link</button>
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
              <h3 className="poi-detail__amenities-title">Trail Features</h3>
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

        {/* Trail-Specific Collapsible Sections */}
        <div className="poi-detail__collapsible-sections">
          <CollapsibleSection title="TRAIL DETAILS" show={poi.trail}>
            <div className="collapsible-section__info">
              <InfoRow label="Length" value={poi.trail?.length_text} />
              <InfoRow label="Difficulty" value={poi.trail?.difficulty} />
              <InfoRow label="Route Type" value={poi.trail?.route_type} />
              {poi.trail?.difficulty_description && (
                <InfoRow label="Difficulty Info" value={poi.trail.difficulty_description} />
              )}
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
    </>
  );
}

export default TrailDetail;
