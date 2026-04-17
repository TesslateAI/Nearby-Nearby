import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import {
  AccSection, ContentGroup, ChipList, QuickInfoRow,
  POIDetailLayout, QuickInfoPhotosBox, AmenitiesBox,
  hasVal, asArray, getImages,
} from './shared';
import HoursDisplay from '../common/HoursDisplay';
import ServiceAnimalAlert from './ServiceAnimalAlert';
import { SvgDirections, SvgLatLong } from './PoiHeader';
import { LocalBusinessJsonLd } from '../seo/index';

import { isCurrentlyOpen } from '../../utils/hoursUtils';
import { getDisplayableLocation } from '../../utils/getDisplayableLocation';
import { isPaidTier } from '../../utils/poiTier';
import { copyToClipboard, getCoordinates, openDirections } from './shared/poiDetailUtils';
import { sanitizeHtml } from '../../utils/sanitize';

const ALCOHOL_LABELS = {
  full_bar: 'Full Bar', beer_wine: 'Beer + Wine Only', byob: 'BYOB',
  no_alcohol: 'No Alcohol', seasonal: 'Seasonal/Event Only', nearby: 'Adjacent/Nearby Available',
};

const IDEAL_FOR_GROUPS = [
  { key: 'atmosphere', label: 'Atmosphere' },
  { key: 'age_group', label: 'For Ages' },
  { key: 'social_settings', label: 'Social Settings' },
  { key: 'local_special', label: 'Local Special' },
];

export default function BusinessDetail({ poi }) {
  const location = useLocation();
  const tierParam = new URLSearchParams(location.search).get('tier');
  const paid = useMemo(() => {
    if (tierParam === 'free') return false;
    if (tierParam === 'paid') return true;
    return isPaidTier(poi);
  }, [tierParam, poi]);

  const displayLoc = getDisplayableLocation(poi);
  const hideExact = displayLoc.hideExact;
  const coords = getCoordinates(poi, hideExact);
  const openStatus = poi?.hours ? isCurrentlyOpen(poi.hours) : null;
  const images = useMemo(() => getImages(poi), [poi]);

  const primaryCategory = poi?.categories?.[0]?.name || poi?.business?.primary_category || '';

  const petsLabel = Array.isArray(poi?.pet_options) && poi.pet_options.length > 0 ? poi.pet_options.join(', ') : null;
  const goodForLabel = (() => {
    const ideal = poi?.ideal_for;
    if (!ideal || typeof ideal !== 'object') return null;
    const parts = [];
    IDEAL_FOR_GROUPS.forEach(({ key }) => { const arr = ideal[key]; if (Array.isArray(arr) && arr.length) parts.push(...arr); });
    return parts.length ? parts.join(', ') : null;
  })();
  const costLabel = poi?.business?.price_range || poi?.price_range_per_person || null;
  const parkingLabel = Array.isArray(poi?.parking_types) && poi.parking_types.length > 0 ? poi.parking_types.join(', ') : null;

  const amenitiesFlat = useMemo(() => {
    if (!paid) return [];
    const a = poi?.amenities;
    if (!a || typeof a !== 'object') return [];
    const out = [];
    Object.values(a).forEach((v) => {
      if (Array.isArray(v)) v.forEach((x) => hasVal(x) && out.push(typeof x === 'object' ? (x.name || x.label || '') : String(x)));
    });
    return Array.from(new Set(out.filter(Boolean)));
  }, [poi, paid]);

  const webHref = poi?.website_url ? (poi.website_url.startsWith('http') ? poi.website_url : `https://${poi.website_url}`) : null;
  const phoneHref = poi?.phone_number ? `tel:${poi.phone_number}` : null;
  const addressLine = hasVal(poi?.address_street)
    ? [poi.address_street, poi.address_city, poi.address_state, poi.address_zip].filter(Boolean).join(', ')
    : null;
  const alcoholLabel = poi?.alcohol_available ? (ALCOHOL_LABELS[poi.alcohol_available] || poi.alcohol_available) : null;

  const socialLinks = (() => {
    const out = [];
    const s = poi?.social_media;
    if (s && typeof s === 'object') {
      Object.entries(s).forEach(([key, val]) => {
        if (hasVal(val)) {
          const url = typeof val === 'string' ? val : (val.url || val.link);
          if (url) out.push({ label: key.charAt(0).toUpperCase() + key.slice(1), url });
        }
      });
    }
    return out;
  })();

  const menuLinks = poi?.menu_links || (poi?.menu_link ? [{ title: 'Menu', url: poi.menu_link }] : null);
  const buildLinkGroup = (title, items) => {
    const list = asArray(items).filter((x) => x && (x.url || x.link));
    if (list.length === 0) return null;
    return (
      <ContentGroup key={title} title={title}>
        <div className="acc_list_group_1">
          {list.map((item, i) => <a key={i} href={item.url || item.link} target="_blank" rel="noreferrer">{item.title || item.label || item.url}</a>)}
        </div>
      </ContentGroup>
    );
  };

  /* ── Accordion sections ──────────────────────────────────────── */
  const aboutCol1 = [
    hasVal(poi?.description_long) && <ContentGroup key="desc"><div className="acc_content_text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(poi.description_long) }} /></ContentGroup>,
    paid && Array.isArray(poi?.categories) && poi.categories.length > 0 && <ContentGroup key="cats" title="Categories"><ChipList items={poi.categories.map((c) => c.name || c.label || '')} /></ContentGroup>,
    paid && goodForLabel && (
      <ContentGroup key="ideal" title="Ideal For">
        <ChipList items={(() => { const parts = []; IDEAL_FOR_GROUPS.forEach(({ key }) => { const arr = poi?.ideal_for?.[key]; if (Array.isArray(arr)) parts.push(...arr); }); return parts; })()} />
      </ContentGroup>
    ),
  ].filter(Boolean);

  const aboutCol2 = [
    hasVal(poi?.hours) && (
      <ContentGroup key="hours" title="Hours">
        <div className="acc_content_text">
          <HoursDisplay hours={poi.hours} holidayHours={poi.holiday_hours} appointmentBookingUrl={poi.appointment_booking_url} appointmentRequired={poi.hours_but_appointment_required} hoursNotes={poi.hours_notes} />
        </div>
      </ContentGroup>
    ),
  ].filter(Boolean);

  const addrCol1 = !hideExact && (addressLine || coords) ? [(
    <ContentGroup key="addr" title="Address">
      <div className="acc_content_text">
        {addressLine && <div>{addressLine}</div>}
        <div className="pd-addr__actions" style={{ marginTop: 10 }}>
          <button type="button" className="btn_reset button btn_outline_teal btn_poi_button_1" onClick={() => openDirections(poi, coords)}>
            <SvgDirections /> <span className="poi_button_title">Directions</span>
          </button>
          {coords && (
            <button type="button" className="btn_reset button btn_outline_teal btn_poi_button_1" onClick={async () => { await copyToClipboard(`${coords.lat}, ${coords.lng}`); }}>
              <SvgLatLong /> <span className="poi_button_title">Lat + Long</span>
            </button>
          )}
        </div>
      </div>
    </ContentGroup>
  )] : [];

  const addrCol2 = [
    hasVal(poi?.parking_types) && <ContentGroup key="parking" title="Parking"><ChipList items={poi.parking_types} /></ContentGroup>,
    (hasVal(poi?.parking_notes) || hasVal(poi?.parking_paid)) && (
      <ContentGroup key="pnotes">
        <div className="acc_content_text">
          {hasVal(poi?.parking_paid) && <p><strong>Expect to pay for parking?</strong> {poi.parking_paid === true ? 'Yes' : String(poi.parking_paid)}</p>}
          {hasVal(poi?.parking_notes) && <p>{poi.parking_notes}</p>}
        </div>
      </ContentGroup>
    ),
  ].filter(Boolean);

  const pricingCol1 = [
    hasVal(costLabel) && <ContentGroup key="price" title="Average Price"><div className="acc_content_text">{costLabel}</div></ContentGroup>,
    hasVal(poi?.description_pricing) && <ContentGroup key="pricing" title="Pricing Details"><div className="acc_content_text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(poi.description_pricing) }} /></ContentGroup>,
  ].filter(Boolean);
  const pricingCol2 = [
    hasVal(poi?.discounts) && (
      <ContentGroup key="disc" title="Discounts + Offers">
        <div className="acc_content_text"><ul>{asArray(poi.discounts).map((d, i) => <li key={i}>{typeof d === 'object' ? (d.title || d.label || d.name || '') : d}</li>)}</ul></div>
      </ContentGroup>
    ),
  ].filter(Boolean);

  const menuCol1 = [buildLinkGroup('Menu', menuLinks), buildLinkGroup('Reservations', poi?.reservation_links)].filter(Boolean);
  const menuCol2 = [buildLinkGroup('Delivery + Takeout', poi?.delivery_links)].filter(Boolean);

  const alcSmokCol1 = [
    hasVal(alcoholLabel) && <ContentGroup key="alc" title="Alcohol"><div className="acc_content_text">{alcoholLabel}</div></ContentGroup>,
    hasVal(poi?.alcohol_policy_details) && <ContentGroup key="alcp" title="Alcohol Policy"><div className="acc_content_text">{poi.alcohol_policy_details}</div></ContentGroup>,
  ].filter(Boolean);
  const alcSmokCol2 = [
    hasVal(poi?.smoking_policy) && <ContentGroup key="smoke" title="Smoking Policy"><div className="acc_content_text">{poi.smoking_policy}</div></ContentGroup>,
  ].filter(Boolean);

  const restroomCol1 = [
    hasVal(poi?.public_toilets) && <ContentGroup key="pt" title="Restrooms"><ChipList items={poi.public_toilets} /></ContentGroup>,
    hasVal(poi?.toilet_description) && <ContentGroup key="td" title="Details"><div className="acc_content_text">{poi.toilet_description}</div></ContentGroup>,
  ].filter(Boolean);
  const restroomCol2 = [
    poi?.accessible_restroom === true && hasVal(poi?.accessible_restroom_details) && <ContentGroup key="ard" title="Accessible Restroom Details"><ChipList items={poi.accessible_restroom_details} /></ContentGroup>,
  ].filter(Boolean);

  const wheelchairCol1 = [
    hasVal(poi?.wheelchair_accessible) && <ContentGroup key="wa" title="Wheelchair Accessible"><ChipList items={poi.wheelchair_accessible} /></ContentGroup>,
    hasVal(poi?.wheelchair_details) && <ContentGroup key="wd" title="Details"><div className="acc_content_text">{poi.wheelchair_details}</div></ContentGroup>,
  ].filter(Boolean);
  const wheelchairCol2 = [
    hasVal(poi?.amenities?.mobility_access) && <ContentGroup key="ma" title="Mobility Access"><ChipList items={poi.amenities.mobility_access} /></ContentGroup>,
  ].filter(Boolean);

  const petCol1 = [hasVal(poi?.pet_options) && <ContentGroup key="pets" title="Pet Policy"><ChipList items={poi.pet_options} /></ContentGroup>].filter(Boolean);
  const petCol2 = [hasVal(poi?.pet_options) && <ContentGroup key="sa"><ServiceAnimalAlert /></ContentGroup>].filter(Boolean);

  const playgroundCol1 = [
    hasVal(poi?.playground_types) && <ContentGroup key="pt" title="Playground Types"><ChipList items={poi.playground_types} /></ContentGroup>,
    hasVal(poi?.playground_surface) && <ContentGroup key="ps" title="Surface"><div className="acc_content_text">{poi.playground_surface}</div></ContentGroup>,
  ].filter(Boolean);
  const playgroundCol2 = [
    hasVal(poi?.playground_age_groups) && <ContentGroup key="pag" title="Age Groups"><ChipList items={poi.playground_age_groups} /></ContentGroup>,
    poi?.inclusive_playground === true && hasVal(poi?.playground_ada_checklist) && <ContentGroup key="pad" title="Inclusive Playground Checklist"><ChipList items={poi.playground_ada_checklist} /></ContentGroup>,
  ].filter(Boolean);

  const contactCol1 = [
    phoneHref && <ContentGroup key="phone" title="Phone"><div className="acc_list_group_1"><a href={phoneHref}>{poi.phone_number}</a></div></ContentGroup>,
    webHref && <ContentGroup key="web" title="Website"><div className="acc_list_group_1"><a href={webHref} target="_blank" rel="noreferrer">Visit Website</a></div></ContentGroup>,
  ].filter(Boolean);
  const contactCol2 = [
    hasVal(poi?.email) && <ContentGroup key="email" title="Email"><div className="acc_list_group_1"><a href={`mailto:${poi.email}`}>{poi.email}</a></div></ContentGroup>,
    socialLinks.length > 0 && (
      <ContentGroup key="soc" title="Social Media">
        <div className="acc_list_group_1">{socialLinks.map((s, i) => <a key={i} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>)}</div>
      </ContentGroup>
    ),
  ].filter(Boolean);

  const PAID_SECTIONS = [
    { key: 'about', title: 'About + Details', open: true, col1: aboutCol1, col2: aboutCol2 },
    { key: 'addr', title: 'Address + Parking', open: true, col1: addrCol1, col2: addrCol2 },
    { key: 'price', title: 'Pricing + Offers', open: false, col1: pricingCol1, col2: pricingCol2 },
    { key: 'menu', title: 'Menu + Ordering', open: false, col1: menuCol1, col2: menuCol2 },
    { key: 'alc', title: 'Alcohol + Smoking', open: false, col1: alcSmokCol1, col2: alcSmokCol2 },
    { key: 'rest', title: 'Public Restrooms', open: false, col1: restroomCol1, col2: restroomCol2 },
    { key: 'wc', title: 'Wheelchair Accessible', open: false, col1: wheelchairCol1, col2: wheelchairCol2 },
    { key: 'pet', title: 'Pet Policy', open: false, col1: petCol1, col2: petCol2 },
    { key: 'play', title: 'Playground', open: false, col1: playgroundCol1, col2: playgroundCol2 },
    { key: 'contact', title: 'Contact', open: false, col1: contactCol1, col2: contactCol2 },
  ];
  const FREE_SECTIONS = [
    { key: 'about', title: 'About + Details', open: false, col1: aboutCol1, col2: aboutCol2 },
    { key: 'addr', title: 'Address + Parking', open: false, col1: addrCol1, col2: addrCol2 },
    { key: 'price', title: 'Pricing + Offers', open: false, col1: pricingCol1, col2: pricingCol2 },
    { key: 'rest', title: 'Public Restrooms', open: false, col1: restroomCol1, col2: restroomCol2 },
    { key: 'wc', title: 'Wheelchair Accessible', open: false, col1: wheelchairCol1, col2: wheelchairCol2 },
    { key: 'pet', title: 'Pet Policy', open: false, col1: petCol1, col2: petCol2 },
    { key: 'contact', title: 'Contact', open: false, col1: contactCol1, col2: contactCol2 },
  ];
  const sections = (paid ? PAID_SECTIONS : FREE_SECTIONS).filter((s) => s.col1.length > 0 || s.col2.length > 0);

  const statusOpen = openStatus?.isOpen;
  const statusVariant = statusOpen ? 'open' : (openStatus?.status && /opens? at/i.test(openStatus.status) ? 'opensoon' : 'closed');
  const statusLabel = openStatus
    ? (statusOpen ? `Open Now${openStatus.status ? ` – ${openStatus.status}` : ''}` : (openStatus.status || 'Closed'))
    : null;

  return (
    <POIDetailLayout
      poi={poi}
      mainCategory={primaryCategory}
      statusVariant={openStatus ? statusVariant : undefined}
      statusLabel={statusLabel}
      seoComponent={<LocalBusinessJsonLd poi={poi} />}
    >
      {({ images: imgs, openLightbox }) => (
        <>
          <QuickInfoPhotosBox
            title={hasVal(poi?.description_short) ? poi.description_short : undefined}
            quickInfoRows={
              <>
                <QuickInfoRow title="Category:" value={primaryCategory} />
                <QuickInfoRow title="Cost:" value={costLabel} />
                <QuickInfoRow title="Good For:" value={goodForLabel} />
                <QuickInfoRow title="Pets:" value={petsLabel} />
                <QuickInfoRow title="Parking:" value={parkingLabel} />
              </>
            }
            images={imgs}
            onOpenLightbox={openLightbox}
          />

          {paid && amenitiesFlat.length > 0 && (
            <AmenitiesBox title="Amenities" amenitiesList={amenitiesFlat} />
          )}

          {sections.length > 0 && (
            <div id="accordion_1_box" className="poi_accordion_box">
              <div id="accordion_1_parent" className="poi_accordion_parent">
                {sections.map((s) => (
                  <AccSection key={s.key} title={s.title} defaultOpen={s.open} col1={s.col1.length > 0 ? s.col1 : null} col2={s.col2.length > 0 ? s.col2 : null} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </POIDetailLayout>
  );
}
