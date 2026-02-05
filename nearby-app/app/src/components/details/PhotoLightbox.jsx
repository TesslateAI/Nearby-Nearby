import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './PhotoLightbox.css';

/**
 * PhotoLightbox - Full-screen image gallery modal
 *
 * Props:
 * - images: array of {url, thumbnail_url, alt_text, caption}
 * - isOpen: boolean
 * - initialIndex: number (which image to show first)
 * - onClose: function
 */
function PhotoLightbox({ images = [], isOpen, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const thumbnailsRef = useRef(null);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  // Scroll thumbnail into view when index changes
  useEffect(() => {
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[currentIndex];
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const goToPrev = useCallback(() => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  }, [images.length]);

  const goToIndex = useCallback((index) => {
    setIsLoading(true);
    setCurrentIndex(index);
  }, []);

  // Touch handlers for swipe gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const lightboxContent = (
    <div className="lightbox-overlay" onClick={handleBackdropClick}>
      {/* Close button */}
      <button className="lightbox-close" onClick={onClose} aria-label="Close gallery">
        <X size={28} />
      </button>

      {/* Counter */}
      <div className="lightbox-counter">
        {currentIndex + 1} of {images.length}
      </div>

      {/* Main content area */}
      <div
        className="lightbox-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Previous button */}
        {hasPrev && (
          <button
            className="lightbox-nav lightbox-nav--prev"
            onClick={goToPrev}
            aria-label="Previous image"
          >
            <ChevronLeft size={40} />
          </button>
        )}

        {/* Image container */}
        <div className="lightbox-image-container">
          {isLoading && (
            <div className="lightbox-loader">
              <div className="lightbox-spinner"></div>
            </div>
          )}
          <img
            src={currentImage.url}
            alt={currentImage.alt_text || `Photo ${currentIndex + 1}`}
            className={`lightbox-image ${isLoading ? 'lightbox-image--loading' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageLoad}
          />
        </div>

        {/* Next button */}
        {hasNext && (
          <button
            className="lightbox-nav lightbox-nav--next"
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRight size={40} />
          </button>
        )}
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <div className="lightbox-caption">{currentImage.caption}</div>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="lightbox-thumbnails" ref={thumbnailsRef}>
          {images.map((img, index) => (
            <button
              key={img.id || index}
              className={`lightbox-thumbnail ${index === currentIndex ? 'lightbox-thumbnail--active' : ''}`}
              onClick={() => goToIndex(index)}
              aria-label={`View photo ${index + 1}`}
            >
              <img
                src={img.thumbnail_url || img.url}
                alt={img.alt_text || `Thumbnail ${index + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Render using portal to escape parent styling
  return createPortal(lightboxContent, document.body);
}

export default PhotoLightbox;
