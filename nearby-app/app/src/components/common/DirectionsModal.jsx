import { useState } from 'react';

function DirectionsModal({ poi, onClose }) {
  const [copiedText, setCopiedText] = useState(null);

  const getCoords = () => {
    if (poi?.front_door_latitude && poi?.front_door_longitude) {
      return { lat: poi.front_door_latitude, lng: poi.front_door_longitude };
    }
    if (poi?.location?.coordinates) {
      return { lat: poi.location.coordinates[1], lng: poi.location.coordinates[0] };
    }
    return null;
  };

  const handleMappingService = (service) => {
    const coords = getCoords();
    let url = '';
    if (coords) {
      switch (service) {
        case 'google':
          url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
          break;
        case 'apple':
          url = `http://maps.apple.com/?daddr=${coords.lat},${coords.lng}`;
          break;
        case 'waze':
          url = `https://waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;
          break;
        default:
          return;
      }
    } else if (poi?.address_street) {
      const addr = encodeURIComponent(
        [poi.address_street, poi.address_city, poi.address_state, poi.address_zip]
          .filter(Boolean).join(', ')
      );
      switch (service) {
        case 'google': url = `https://www.google.com/maps/dir/?api=1&destination=${addr}`; break;
        case 'apple': url = `http://maps.apple.com/?daddr=${addr}`; break;
        case 'waze': url = `https://waze.com/ul?q=${addr}&navigate=yes`; break;
        default: return;
      }
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleCopyLatLong = async () => {
    const coords = getCoords();
    if (!coords) return;
    try {
      await navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
      setCopiedText('latlong');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyAddress = async () => {
    const address = [poi?.address_street, poi?.address_city, poi?.address_state, poi?.address_zip]
      .filter(Boolean).join(', ');
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedText('address');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="directions-modal-overlay" onClick={onClose}>
      <div className="directions-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="directions-modal__close-x" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h3 className="directions-modal__title">{poi?.name}</h3>

        {poi?.address_street && (
          <p className="directions-modal__address">
            {poi.address_street}
            {poi.address_city && `, ${poi.address_city}`}
            {poi.address_state && ` ${poi.address_state}`}
            {poi.address_zip && ` ${poi.address_zip}`}
          </p>
        )}

        <div className="directions-modal__copy-section">
          <button onClick={handleCopyLatLong} className="directions-modal__copy-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {copiedText === 'latlong' ? 'Copied!' : 'Copy Lat & Long'}
          </button>
          <button onClick={handleCopyAddress} className="directions-modal__copy-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {copiedText === 'address' ? 'Copied!' : 'Copy Address'}
          </button>
        </div>

        <p className="directions-modal__subtitle">Open in:</p>

        <div className="directions-modal__buttons">
          <button onClick={() => handleMappingService('google')} className="directions-modal__btn directions-modal__btn--google">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
            </svg>
            Google Maps
          </button>
          <button onClick={() => handleMappingService('apple')} className="directions-modal__btn directions-modal__btn--apple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z"/>
              <path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple Maps
          </button>
          <button onClick={() => handleMappingService('waze')} className="directions-modal__btn directions-modal__btn--waze">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="8.5" cy="10.5" r="1.5"/>
              <circle cx="15.5" cy="10.5" r="1.5"/>
              <path d="M12 16c-1.48 0-2.75-.81-3.45-2h6.9c-.7 1.19-1.97 2-3.45 2z"/>
            </svg>
            Waze
          </button>
        </div>
      </div>
    </div>
  );
}

export default DirectionsModal;
