import { useMemo } from 'react';

import {
  AccSection, ContentGroup, ChipList, QuickInfoRow,
  POIDetailLayout, QuickInfoPhotosBox, AmenitiesBox,
  hasVal, getImages,
} from './shared';
import HoursDisplay from '../common/HoursDisplay';
import SEO from '../SEO';
import { truncateText, getPOIUrl } from '../../utils/slugify';
import { getDisplayableLocation } from '../../utils/getDisplayableLocation';
import { isPaidTier } from '../../utils/poiTier';
import { isCurrentlyOpen } from '../../utils/hoursUtils';
import { sanitizeHtml } from '../../utils/sanitize';

export default function GenericDetail({ poi }) {
  const paid = isPaidTier(poi);
  const displayLoc = getDisplayableLocation(poi);
  const openStatus = poi.hours ? isCurrentlyOpen(poi.hours) : null;
  const images = useMemo(() => getImages(poi), [poi]);

  const categoryFromPoiType = (() => {
    const t = poi.poi_type;
    if (!t) return null;
    return t.toString().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  })();
  const primaryCategory =
    (poi.categories && poi.categories.length > 0 && (poi.categories[0]?.name || poi.categories[0]?.category?.name)) ||
    poi.main_category?.name || categoryFromPoiType;

  const seoTitle = poi.name;
  const seoDescription = truncateText(
    poi.description_long || poi.description_short || poi.teaser_paragraph ||
    `Discover ${poi.name}${poi.address_city ? ' in ' + poi.address_city : ''}.`, 155
  );
  const seoImage = poi.featured_image || (poi.images && poi.images[0]?.url) || null;
  const seoUrl = `${window.location.origin}${getPOIUrl(poi)}`;

  const contactAny =
    hasVal(poi.phone_number) || hasVal(poi.email) || hasVal(poi.website_url) ||
    hasVal(poi.main_contact_name);

  const addressAny =
    hasVal(poi.address_street) || hasVal(poi.address_city) ||
    hasVal(poi.parking_types) || hasVal(poi.parking_notes);

  /* ── Accordion sections ── */
  const aboutCol1 = [
    hasVal(poi.description_long) && (
      <ContentGroup key="desc" title="About">
        <div className="acc_content_text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(poi.description_long) }} />
      </ContentGroup>
    ),
  ].filter(Boolean);
  const aboutCol2 = [
    hasVal(poi.hours) && (
      <ContentGroup key="hours" title="Hours">
        <div className="acc_content_text">
          <HoursDisplay hours={poi.hours} holidayHours={poi.holiday_hours}
            appointmentBookingUrl={poi.appointment_booking_url}
            appointmentRequired={poi.hours_but_appointment_required}
            hoursNotes={poi.hours_notes} />
        </div>
      </ContentGroup>
    ),
  ].filter(Boolean);

  const addrCol1 = [
    hasVal(poi.address_street) && (
      <ContentGroup key="addr" title="Address">
        <div className="acc_content_text">
          {!displayLoc.hideExact && poi.address_street && <div>{poi.address_street}</div>}
          {(poi.address_city || poi.address_state) && (
            <div>{[poi.address_city, poi.address_county, poi.address_state].filter(Boolean).join(', ')}</div>
          )}
          {!displayLoc.hideExact && poi.address_zip && <div>{poi.address_zip}</div>}
        </div>
      </ContentGroup>
    ),
  ].filter(Boolean);
  const addrCol2 = [
    hasVal(poi.parking_types) && <ContentGroup key="parking" title="Parking"><ChipList items={poi.parking_types} /></ContentGroup>,
    hasVal(poi.parking_notes) && <ContentGroup key="pnotes"><div className="acc_content_text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(poi.parking_notes) }} /></ContentGroup>,
  ].filter(Boolean);

  const contactCol1 = [
    hasVal(poi.phone_number) && <ContentGroup key="ph" title="Phone"><div className="acc_list_group_1"><a href={`tel:${poi.phone_number}`}>{poi.phone_number}</a></div></ContentGroup>,
    hasVal(poi.website_url) && (
      <ContentGroup key="web" title="Website">
        <div className="acc_list_group_1">
          <a href={poi.website_url.startsWith('http') ? poi.website_url : `https://${poi.website_url}`} target="_blank" rel="noopener noreferrer">{poi.website_url}</a>
        </div>
      </ContentGroup>
    ),
  ].filter(Boolean);
  const contactCol2 = [
    hasVal(poi.email) && <ContentGroup key="em" title="Email"><div className="acc_list_group_1"><a href={`mailto:${poi.email}`}>{poi.email}</a></div></ContentGroup>,
    hasVal(poi.main_contact_name) && <ContentGroup key="mc" title="Main Contact"><div className="acc_content_text">{poi.main_contact_name}</div></ContentGroup>,
  ].filter(Boolean);

  const sections = [
    (aboutCol1.length || aboutCol2.length) && { key: 'about', title: 'About + Hours', open: true, col1: aboutCol1, col2: aboutCol2 },
    addressAny && { key: 'addr', title: 'Address + Parking', open: false, col1: addrCol1, col2: addrCol2 },
    contactAny && { key: 'contact', title: 'Contact', open: false, col1: contactCol1, col2: contactCol2 },
  ].filter(Boolean);

  return (
    <>
      <SEO title={seoTitle} description={seoDescription} image={seoImage} url={seoUrl} type="place" />
      <POIDetailLayout
        poi={poi}
        mainCategory={primaryCategory}
        statusVariant={openStatus ? (openStatus.isOpen ? 'open' : 'closed') : undefined}
        statusLabel={openStatus ? `${openStatus.isOpen ? 'Open Now' : 'Closed'}${openStatus.status ? ` – ${openStatus.status}` : ''}` : undefined}
      >
        {({ images: imgs, openLightbox }) => (
          <>
            <QuickInfoPhotosBox
              title={hasVal(poi.description_short) ? poi.description_short : undefined}
              quickInfoRows={
                <>
                  <QuickInfoRow title="Category:" value={primaryCategory} />
                  <QuickInfoRow title="Cost:" value={poi.price_range || poi.cost} />
                  <QuickInfoRow title="Pets:" value={Array.isArray(poi.pet_options) && poi.pet_options.length > 0 ? poi.pet_options.join(', ') : null} />
                  <QuickInfoRow title="Parking:" value={Array.isArray(poi.parking_types) && poi.parking_types.length > 0 ? poi.parking_types.join(', ') : null} />
                </>
              }
              images={imgs}
              onOpenLightbox={openLightbox}
            />

            {paid && <AmenitiesBox poi={poi} title="Amenities" />}

            {sections.length > 0 && (
              <div id="accordion_1_box" className="poi_accordion_box">
                <div id="accordion_1_parent" className="poi_accordion_parent">
                  {sections.map((s) => (
                    <AccSection key={s.key} title={s.title} defaultOpen={s.open}
                      col1={s.col1.length > 0 ? s.col1 : null}
                      col2={s.col2.length > 0 ? s.col2 : null} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </POIDetailLayout>
    </>
  );
}
