import { useEffect, useRef } from 'react';
import './Overlay.css';

/**
 * Reusable overlay component — ported from nn-templates/inc/overlay.scss + overlay.js
 * Works with the useOverlay hook.
 */
export default function Overlay({ id, isOpen, onClose, panelRef, className = '', children }) {
  const chevronRef = useRef(null);

  // Chevron scroll indicator
  useEffect(() => {
    const panel = panelRef?.current;
    const chevron = chevronRef.current;
    if (!panel || !chevron || !isOpen) return;

    const checkScroll = () => {
      if (panel.scrollHeight <= panel.clientHeight) {
        chevron.classList.remove('is_visible');
        return;
      }
      if (panel.scrollTop === 0) {
        chevron.classList.remove('is_scrolled');
        chevron.classList.add('is_visible');
      } else {
        chevron.classList.add('is_scrolled');
      }
    };

    const showTimer = setTimeout(() => checkScroll(), 150);
    panel.addEventListener('scroll', checkScroll);
    return () => {
      clearTimeout(showTimer);
      panel.removeEventListener('scroll', checkScroll);
    };
  }, [isOpen, panelRef]);

  return (
    <>
      <div
        className={`overlay_backdrop${isOpen ? ' is_open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        id={id}
        className={`overlay_panel${isOpen ? ' is_open' : ''} ${className}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
      >
        <button
          className="overlay_close"
          onClick={onClose}
          aria-label={`Close ${id.replace('_', ' ')}`}
        >
          <span className="btn_close_icon">&times;</span>
          <span className="btn_close_text">Close</span>
        </button>
        <div className="overlay_content">
          {children}
        </div>
        <div className="overlay_chevron" ref={chevronRef} aria-hidden="true" />
      </div>
    </>
  );
}
