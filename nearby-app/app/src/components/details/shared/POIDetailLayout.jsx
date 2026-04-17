import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import NearbySection from '../../nearby-feature/NearbySection';
import PhotoLightbox from '../PhotoLightbox';
import HeroBanner from '../HeroBanner';
import SuggestEditOverlay from '../SuggestEditOverlay';
import PoiHeader from '../PoiHeader';

import { getDisplayableLocation } from '../../../utils/getDisplayableLocation';
import { isPaidTier } from '../../../utils/poiTier';
import { isCurrentlyOpen } from '../../../utils/hoursUtils';
import { copyToClipboard, getCoordinates, openDirections, getImages } from './poiDetailUtils';

export default function POIDetailLayout({
  poi,
  mainCategory,
  statusVariant: statusVariantProp,
  statusLabel: statusLabelProp,
  extraButtons,
  titleLeader,
  subtitleExtras,
  backLabel = '← Back to Search',
  backTo = '/',
  showHero = true,
  children,
  seoComponent,
  beforeHeader,
  afterMain,
}) {
  const navigate = useNavigate();
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const suggestEditRef = useRef(null);

  const displayLoc = getDisplayableLocation(poi);
  const paid = isPaidTier(poi);
  const coords = getCoordinates(poi, displayLoc.hideExact);
  const images = useMemo(() => getImages(poi), [poi]);

  const openStatus = poi?.hours ? isCurrentlyOpen(poi.hours) : null;

  let statusVariant = statusVariantProp;
  let statusLabel = statusLabelProp;
  if (statusVariant === undefined && openStatus) {
    statusVariant = openStatus.isOpen ? 'open' : 'closed';
    statusLabel = openStatus.isOpen
      ? (openStatus.status ? `Open Now – ${openStatus.status}` : 'Open Now')
      : (openStatus.status || 'Closed');
  }

  const handleDirections = () => openDirections(poi, coords);
  const handleCopyCoords = async () => {
    if (!coords) return;
    if (await copyToClipboard(`${coords.lat}, ${coords.lng}`)) {
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: poi?.name, url }); return; } catch { /* ignore */ }
    }
    await copyToClipboard(url);
  };
  const scrollToNearby = () => {
    document.querySelector('.nearby-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openLightbox = (idx = 0) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <div className="poi_detail_page">
      {seoComponent}
      {showHero && <HeroBanner poi={poi} />}

      <div className="wrapper_default" style={{ paddingTop: 35, paddingBottom: 0 }}>
        <button type="button" onClick={() => navigate(backTo)} className="poi-detail__back-link">
          {backLabel}
        </button>
      </div>

      {beforeHeader}

      <PoiHeader
        poi={poi}
        paid={paid}
        displayLoc={displayLoc}
        mainCategory={mainCategory}
        statusVariant={statusVariant}
        statusLabel={statusLabel}
        onDirections={handleDirections}
        onCopyLatLong={handleCopyCoords}
        onShare={handleShare}
        onViewNearby={scrollToNearby}
        onSuggestEdit={() => suggestEditRef.current?.open()}
        extraButtons={extraButtons}
        titleLeader={titleLeader}
        subtitleExtras={subtitleExtras}
      />

      <main id="main_content" className="pb50px">
        <div className="wrapper_default">
          {typeof children === 'function'
            ? children({ images, openLightbox, paid, displayLoc, coords, copiedCoords })
            : children}
        </div>
      </main>

      {afterMain}

      <NearbySection currentPOI={poi} />

      <PhotoLightbox
        images={images}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIndex}
      />

      <SuggestEditOverlay
        poiName={poi?.name}
        poiId={poi?.id}
        triggerRef={suggestEditRef}
      />
    </div>
  );
}
