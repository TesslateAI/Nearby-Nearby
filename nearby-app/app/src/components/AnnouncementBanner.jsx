import { useState } from 'react';
import './AnnouncementBanner.css';

export default function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div id="announce_box">
      <div className="wrapper_default announce_inner">
        <span>
          <strong><span className="announce_highlight">Testing in Progress:</span></strong>{' '}
          Currently, Nearby Nearby is available only in select areas of Pittsboro, NC. We are starting small to ensure we get it right.
        </span>
        <button
          className="announce_close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
