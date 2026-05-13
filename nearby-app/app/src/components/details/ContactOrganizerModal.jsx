import { Link } from 'react-router-dom';
import './ContactOrganizerModal.css';

/**
 * ContactOrganizerModal - Overlay modal showing event organizer contact info
 *
 * Props:
 * - isOpen: boolean - controls visibility
 * - onClose: function - called when backdrop or close button is clicked
 * - organizer: { name, email, phone, website, organizer_poi_id }
 */
function ContactOrganizerModal({ isOpen, onClose, organizer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h3 className="modal-title">Contact Organizer</h3>

        {organizer.name && (
          <p className="organizer-name">{organizer.name}</p>
        )}

        {organizer.email && (
          <a href={`mailto:${organizer.email}`} className="organizer-link">
            Email: {organizer.email}
          </a>
        )}

        {organizer.phone && (
          <a href={`tel:${organizer.phone}`} className="organizer-link">
            Phone: {organizer.phone}
          </a>
        )}

        {organizer.website && (
          <a
            href={organizer.website}
            className="organizer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </a>
        )}

        {organizer.organizer_poi_id && (
          <Link
            to={`/poi/${organizer.organizer_poi_id}`}
            className="organizer-link organizer-link--poi"
          >
            View Organizer Page
          </Link>
        )}
      </div>
    </div>
  );
}

export default ContactOrganizerModal;
