import React, { useMemo, useState } from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Textarea, Radio,
  Autocomplete, Alert, Switch, TextInput
} from '@mantine/core';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import { TrailDetailsSection } from '../sections/TrailSpecificSections';
import TrailheadAccessPointsSection from '../sections/TrailheadAccessPointsSection';
import {
  FacilitiesSection, PublicAmenitiesSection, RentalsSection, PlaygroundsSection
} from '../sections/FacilitiesSection';
import {
  OutdoorFeaturesSection, HuntingFishingSection, PetPolicySection
} from '../sections/OutdoorFeaturesSection';
import { BusinessGallerySection } from '../sections/BusinessDetailsSection';
import {
  InternalContactSection, PricingMembershipsSection, ConnectionsSection,
  CommunityConnectionsSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import HoursSelector from '../../HoursSelector';
import DynamicAttributeForm from '../../DynamicAttributeForm';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import AlcoholAccordionItem from '../components/AlcoholAccordionItem';
import {
  AdminOnlyAccordionItem, IdealForGrouped, ArrivalMethodsGroup, What3WordsInput,
  AccessibleParkingChecklist, FullAmenitiesBlock, RepeatableLocationGroup
} from './_shared';
import {
  TRAIL_ROUTE_TYPES, GRANDFATHERED_ROUTE_TYPES, TRAIL_LIGHTING_OPTIONS
} from '../../../utils/outdoorConstants';
import { DRONE_USAGE_OPTIONS, getFieldsForListingType } from '../../../utils/constants';
import { api } from '../../../utils/api';

// Issue #64 — Trail 22-section accordion reorder per spec.
// - Section component bodies are unchanged.
// - Drone Policy is extracted into a dedicated section (s15-drone-policy),
//   mirroring the same extraction that #60 did to ParkLayout.
// - <TrailheadAccessPointsSection> (shipped by #63) is moved out of the legacy
//   s5-location slot and folded into the new s8-trail-guide mega-section.
// - Address (s5) restored to <LocationSection isTrail /> + ArrivalMethods +
//   What3Words.
// - Trail Details (s7) keeps the existing TrailDetailsSection controls
//   (length_text, difficulty, route_type, surfaces, conditions); the trailhead
//   coords + photos that TrailDetailsSection also renders are duplicated by
//   <TrailheadAccessPointsSection>. We intentionally keep TrailDetailsSection
//   intact here — it is the canonical place for surfaces/conditions and the
//   trailhead coord block doubles up but isn't actively broken (both bind to
//   the same form path).  TODO: split TrailDetailsSection so s7 carries only
//   trail-specific metrics.

function useParkSearch() {
  const [options, setOptions] = useState([]);
  const [byName, setByName] = useState({});
  const search = async (q) => {
    if (!q || q.length < 2) { setOptions([]); return; }
    try {
      const resp = await api.get(`/pois/search?q=${encodeURIComponent(q)}&types=PARK`);
      if (resp.ok) {
        const data = await resp.json();
        const list = Array.isArray(data) ? data : (data.results || data.items || []);
        setOptions(list.map(x => x.name));
        const m = {};
        list.forEach(x => { m[x.name] = x; });
        setByName(m);
      }
    } catch (e) { /* ignore */ }
  };
  return { options, byName, search };
}

async function setParkAssociation(trailId, parkPoiId) {
  if (!trailId) return;
  try {
    await api.post(`/trails/${trailId}/park-association`, { park_poi_id: parkPoiId });
  } catch (e) { console.warn('park-association POST failed', e); }
}
async function clearParkAssociation(trailId) {
  if (!trailId) return;
  try {
    await api.delete(`/trails/${trailId}/park-association`);
  } catch (e) { console.warn('park-association DELETE failed', e); }
}

export default function TrailLayout({ form, userRole, poiId }) {
  const parkSearch = useParkSearch();

  const currentRouteType = form.values.trail?.route_type || null;
  const isWaterTrail = currentRouteType === 'water_trail';
  const routeTypeData = useMemo(() => {
    const base = [...TRAIL_ROUTE_TYPES];
    if (currentRouteType === 'connecting_network') {
      base.push(...GRANDFATHERED_ROUTE_TYPES);
    }
    return base;
  }, [currentRouteType]);

  const trailInParkVal =
    form.values.trail_in_park ? 'yes' :
    (form.values.trail_in_park === false ? 'no' : null);
  const associatedPark = form.values.trail?.associated_park || null;

  const fields = getFieldsForListingType('TRAIL', form.values.listing_type);
  const idealForCap = fields?.maxIdealFor ?? 10;

  return (
    <>
      {/* 1. Trail Identity — Required. Keeps status + status_message inside. */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Trail Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CoreInformationSection form={form} isTrail id={poiId} />
            <ContactSection form={form} isFreeListing={false} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Trail-in-Park — relationship picker (no dedicated section component
              exists yet, so we keep the inline Autocomplete + park-association
              POST/DELETE wiring that pre-dated #64). */}
      <Accordion.Item value="s2-trail-in-park">
        <Accordion.Control><Text fw={600}>Trail-in-Park</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Radio.Group
              label="Is this trail inside a park?"
              value={trailInParkVal}
              onChange={(v) => {
                const yes = v === 'yes';
                form.setFieldValue('trail_in_park', yes);
                if (!yes) {
                  form.setFieldValue('trail.associated_park', null);
                  clearParkAssociation(poiId);
                }
              }}
            >
              <Group mt="xs">
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
              </Group>
            </Radio.Group>
            {trailInParkVal === 'yes' && (
              <Autocomplete
                label="Search for the park"
                placeholder="Type at least 2 characters…"
                data={parkSearch.options}
                onChange={parkSearch.search}
                onOptionSubmit={(val) => {
                  const park = parkSearch.byName[val];
                  if (!park) return;
                  form.setFieldValue('trail.associated_park', { id: park.id, name: park.name });
                  setParkAssociation(poiId, park.id);
                }}
              />
            )}
            {associatedPark && (
              <Badge color="green">Associated with: {associatedPark.name}</Badge>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Categories + Discovery — CategoriesSection + IdealForGrouped. */}
      <Accordion.Item value="s3-categories">
        <Accordion.Control><Text fw={600}>Categories + Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isFreeListing={false} />
            <IdealForGrouped form={form} listingType="Trail" totalCap={idealForCap} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Hours — NEW for Trail (previously absent). */}
      <Accordion.Item value="s4-hours">
        <Accordion.Control><Text fw={600}>Hours</Text></Accordion.Control>
        <Accordion.Panel>
          <HoursSelector
            form={form}
            value={form.values.hours}
            onChange={(value) => form.setFieldValue('hours', value)}
            poiType={form.values.poi_type}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Address — LocationSection (isTrail) + ArrivalMethodsGroup + W3W. */}
      <Accordion.Item value="s5-address">
        <Accordion.Control><Text fw={600}>Address</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isTrail id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Parking & Accessibility — repeatable parking_locations + ADA. */}
      <Accordion.Item value="s6-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <RepeatableLocationGroup
              form={form}
              fieldName="parking_locations"
              addLabel="Add a parking location"
            />
            <AccessibleParkingChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Trail Details — length_text, difficulty, route_type, surfaces,
              conditions, downloadable map. NOTE: TrailDetailsSection also
              renders trailhead/exit coord blocks; those are intentionally
              duplicated by <TrailheadAccessPointsSection> in s8 because the
              spec calls for the consolidated section to own the canonical
              trailhead UX. Both UIs bind to the same form paths so edits
              stay coherent.  TODO: extract surfaces/conditions to a dedicated
              <TrailMetricsSection> so s7 stops carrying the duplicate coords. */}
      <Accordion.Item value="s7-trail-details">
        <Accordion.Control><Text fw={600}>Trail Details</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <TrailDetailsSection form={form} id={poiId} />
            <Select
              label="Route Type"
              data={routeTypeData}
              value={currentRouteType}
              onChange={(v) => form.setFieldValue('trail.route_type', v)}
              clearable
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Trail Guide — MEGA-SECTION. Owns trailhead + access_points +
              trail_entry_notes (via TrailheadAccessPointsSection from #63) plus
              the remaining trail-guide controls and lighting. Water-trail
              labels are surfaced via a top-of-section Alert; full prop-level
              label swap inside TrailheadAccessPointsSection is out of scope. */}
      <Accordion.Item value="s8-trail-guide">
        <Accordion.Control><Text fw={600}>Trail Guide</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            {isWaterTrail && (
              <Alert color="blue" variant="light" mb="md">
                For water trails, the Trailhead is the <strong>Put-In</strong>{' '}
                and Access Points are <strong>Take-Out / launch points</strong>.
              </Alert>
            )}

            <TrailheadAccessPointsSection form={form} poiId={poiId} />

            <Textarea
              label="Trail Markings"
              placeholder="Color blazes, post markers, painted arrows, etc."
              autosize
              minRows={2}
              value={form.values.trail_markings || ''}
              onChange={(e) => form.setFieldValue('trail_markings', e.currentTarget.value)}
            />

            <Switch
              label="Mile Markers"
              checked={!!form.values.mile_markers}
              onChange={(e) => form.setFieldValue('mile_markers', e.currentTarget.checked)}
            />
            <Switch
              label="Trailhead Signage"
              checked={!!form.values.trailhead_signage}
              onChange={(e) => form.setFieldValue('trailhead_signage', e.currentTarget.checked)}
            />
            <Switch
              label="Audio Guide Available"
              checked={!!form.values.audio_guide_available}
              onChange={(e) => form.setFieldValue('audio_guide_available', e.currentTarget.checked)}
            />
            <Switch
              label="QR Trail Guide"
              checked={!!form.values.qr_trail_guide}
              onChange={(e) => form.setFieldValue('qr_trail_guide', e.currentTarget.checked)}
            />

            <Textarea
              label="Trail Guide Notes"
              autosize
              minRows={2}
              {...form.getInputProps('trail_guide_notes')}
            />

            <Select
              label="Trail Lighting"
              data={TRAIL_LIGHTING_OPTIONS}
              value={form.values.trail_lighting}
              onChange={(v) => form.setFieldValue('trail_lighting', v)}
              clearable
            />

            <TextInput
              label="Downloadable Trail Map"
              placeholder="URL to trail map PDF or image"
              value={form.values.downloadable_trail_map || ''}
              onChange={(e) => form.setFieldValue('downloadable_trail_map', e.currentTarget.value)}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Contact & Social Media — spec lists this even though Section 1
              already absorbs many of the same fields. Keep it visible for
              direct edit access. */}
      <Accordion.Item value="s9-contact-social">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} isFreeListing={false} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Gallery. */}
      <Accordion.Item value="s10-gallery">
        <Accordion.Control><Text fw={600}>Gallery</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Outdoor Features — #68 dynamic outdoor_types loader lives inside. */}
      <Accordion.Item value="s11-outdoor-features">
        <Accordion.Control><Text fw={600}>Outdoor Features</Text></Accordion.Control>
        <Accordion.Panel>
          <OutdoorFeaturesSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Amenities — FullAmenitiesBlock with poiType="TRAIL" so #55's
              visibility filter renders PT-only items and hides B+E items. */}
      <Accordion.Item value="s12-amenities">
        <Accordion.Control><Text fw={600}>Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FacilitiesSection form={form} isTrail id={poiId} />
            <FullAmenitiesBlock form={form} poiType="TRAIL" />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Restrooms — PublicAmenitiesSection renders the inline ADA
              checklist per Wave 3 #47 (do NOT add a standalone
              <AccessibleRestroomChecklist>). */}
      <Accordion.Item value="s13-restrooms">
        <Accordion.Control><Text fw={600}>Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <PublicAmenitiesSection form={form} isTrail id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Alcohol — #69 accordion with conditional sub-options. Smoking
              deferred to Phase 2. */}
      <AlcoholAccordionItem form={form} value="s14-alcohol" />

      {/* 15. Drone Policy — NEW dedicated section. Mirrors the #60 extraction
              from FacilitiesSection done for ParkLayout. */}
      <Accordion.Item value="s15-drone-policy">
        <Accordion.Control><Text fw={600}>Drone Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Select
              label="Drone Usage"
              placeholder="Select drone policy"
              data={DRONE_USAGE_OPTIONS}
              value={form.values.drone_usage || null}
              onChange={(v) => form.setFieldValue('drone_usage', v)}
              clearable
            />
            <Textarea
              label="Drone Policy Details"
              placeholder="Describe permits, no-fly zones, hours, etc."
              autosize
              minRows={3}
              value={form.values.drone_policy || ''}
              onChange={(e) => form.setFieldValue('drone_policy', e.currentTarget.value)}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Pet Policy + Service Animal alert. */}
      <Accordion.Item value="s16-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Playground — #49 per-row age groups + grouped ADA. Trail rarely
              has playgrounds but spec keeps the slot for consistency. */}
      <Accordion.Item value="s17-playground">
        <Accordion.Control><Text fw={600}>Playground</Text></Accordion.Control>
        <Accordion.Panel>
          <PlaygroundsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Rentals — spec note "verify rental_pricing not rendered" is a
              flag for product (Trail rentals don't carry per-unit pricing);
              RentalsSection is shared with Park here and remains unchanged. */}
      <Accordion.Item value="s18-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Hunting & Fishing — #61 fix already in. */}
      <Accordion.Item value="s19-hunting-fishing">
        <Accordion.Control><Text fw={600}>Hunting & Fishing</Text></Accordion.Control>
        <Accordion.Panel>
          <HuntingFishingSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 20. Pricing & Memberships — cost (String) + pricing_details +
              membership_details. PricingMembershipsSection is reused. */}
      <Accordion.Item value="s20-pricing-memberships">
        <Accordion.Control><Text fw={600}>Pricing & Memberships</Text></Accordion.Control>
        <Accordion.Panel>
          <PricingMembershipsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 21. Connections — Connections + Community Connections. */}
      <Accordion.Item value="s21-connections">
        <Accordion.Control><Text fw={600}>Connections</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <ConnectionsSection form={form} />
            <CommunityConnectionsSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 22. Internal & Compliance. */}
      <Accordion.Item value="s22-internal-compliance">
        <Accordion.Control><Text fw={600}>Internal & Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <InternalContactSection form={form} />
            <CorporateComplianceSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 23. Dynamic Attributes. */}
      <Accordion.Item value="s23-attrs">
        <Accordion.Control><Text fw={600}>Dynamic Attributes</Text></Accordion.Control>
        <Accordion.Panel>
          <DynamicAttributeForm
            poiType={form.values.poi_type}
            value={form.values.dynamic_attributes || {}}
            onChange={(value) => form.setFieldValue('dynamic_attributes', value)}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* Admin-Only (stays LAST; only renders for admins). */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
