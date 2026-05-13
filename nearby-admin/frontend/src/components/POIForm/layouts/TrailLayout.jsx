import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Textarea, Switch, Radio, Divider,
  TextInput, Checkbox, SimpleGrid, Button, ActionIcon, NumberInput, MultiSelect,
  Autocomplete
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import { TrailCategoriesSection } from '../sections/TrailCategoriesSection';
import { TrailDetailsSection } from '../sections/TrailSpecificSections';
import {
  FacilitiesSection, PublicAmenitiesSection, RentalsSection
} from '../sections/FacilitiesSection';
import {
  OutdoorFeaturesSection, HuntingFishingSection, PetPolicySection, PlaygroundSection
} from '../sections/OutdoorFeaturesSection';
import { BusinessGallerySection } from '../sections/BusinessDetailsSection';
import {
  InternalContactSection, PricingMembershipsSection, ConnectionsSection,
  CommunityConnectionsSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import HoursSelector from '../../HoursSelector';
import DynamicAttributeForm from '../../DynamicAttributeForm';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import {
  AdminOnlyAccordionItem, IdealForGrouped, ArrivalMethodsGroup, What3WordsInput,
  AccessibleParkingChecklist, AccessibleRestroomChecklist, FullAmenitiesBlock,
  ConnectivityRow, AlcoholAvailableSelect
} from './_shared';
import {
  TRAIL_ROUTE_TYPES, GRANDFATHERED_ROUTE_TYPES, TRAIL_LIGHTING_OPTIONS
} from '../../../utils/outdoorConstants';
import { api } from '../../../utils/api';

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
  const waterTrail = currentRouteType === 'water_trail';
  const routeTypeData = useMemo(() => {
    const base = [...TRAIL_ROUTE_TYPES];
    if (currentRouteType === 'connecting_network') {
      base.push(...GRANDFATHERED_ROUTE_TYPES);
    }
    return base;
  }, [currentRouteType]);

  const trailInParkVal = form.values.trail_in_park ? 'yes' : (form.values.trail_in_park === false ? 'no' : null);
  const associatedPark = form.values.trail?.associated_park || null;

  const accessPoints = Array.isArray(form.values.access_points) ? form.values.access_points : [];
  const addAP = () =>
    form.setFieldValue('access_points', [...accessPoints, { lat: null, lng: null, what3words: '', notes: '' }]);
  const removeAP = (i) =>
    form.setFieldValue('access_points', accessPoints.filter((_, idx) => idx !== i));

  return (
    <>
      {/* 1. Trail Identity */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Trail Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <CoreInformationSection form={form} isTrail id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Trail-in-Park */}
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

      {/* 3. Trail Categories (Ideal For) */}
      <Accordion.Item value="s3-categories">
        <Accordion.Control><Text fw={600}>Trail Categories / Ideal For</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <TrailCategoriesSection form={form} />
            <IdealForGrouped form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Trail Details */}
      <Accordion.Item value="s4-details">
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

      {/* 5. Location & Arrival */}
      <Accordion.Item value="s5-location">
        <Accordion.Control>
          <Text fw={600}>{waterTrail ? 'Primary Put-In' : 'Primary Trailhead'}</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isTrail id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Trailhead Exit (Take-Out for water trails) */}
      <Accordion.Item value="s6-exit">
        <Accordion.Control>
          <Text fw={600}>{waterTrail ? 'Primary Take-Out' : 'Trailhead Exit'}</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <TextInput label={waterTrail ? 'Take-Out Location' : 'Exit Location'}
              {...form.getInputProps('trail.trailhead_exit_location')}
              value={form.values.trail?.trailhead_exit_location ?? ''} />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <NumberInput label="Latitude" decimalScale={6}
                value={form.values.trail?.trail_exit_latitude}
                onChange={(v) => form.setFieldValue('trail.trail_exit_latitude', v)} />
              <NumberInput label="Longitude" decimalScale={6}
                value={form.values.trail?.trail_exit_longitude}
                onChange={(v) => form.setFieldValue('trail.trail_exit_longitude', v)} />
            </SimpleGrid>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Trail Guide (7 new fields + water_trail labels for access points) */}
      <Accordion.Item value="s7-guide">
        <Accordion.Control><Text fw={600}>Trail Guide</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Checkbox
                label="Mile Markers"
                checked={!!form.values.mile_markers}
                onChange={(e) => form.setFieldValue('mile_markers', e.currentTarget.checked)}
              />
              <Checkbox
                label="Trailhead Signage"
                checked={!!form.values.trailhead_signage}
                onChange={(e) => form.setFieldValue('trailhead_signage', e.currentTarget.checked)}
              />
              <Checkbox
                label="Audio Guide Available"
                checked={!!form.values.audio_guide_available}
                onChange={(e) => form.setFieldValue('audio_guide_available', e.currentTarget.checked)}
              />
              <Checkbox
                label="QR Trail Guide"
                checked={!!form.values.qr_trail_guide}
                onChange={(e) => form.setFieldValue('qr_trail_guide', e.currentTarget.checked)}
              />
            </SimpleGrid>
            <Textarea label="Trail Guide Notes" autosize minRows={2}
              {...form.getInputProps('trail_guide_notes')} />
            <Select
              label="Trail Lighting"
              data={TRAIL_LIGHTING_OPTIONS}
              value={form.values.trail_lighting}
              onChange={(v) => form.setFieldValue('trail_lighting', v)}
              clearable
            />
            <Divider label={waterTrail ? 'Additional Put-In + Take-Out Points' : 'Access Points'} />
            {accessPoints.map((ap, idx) => (
              <Stack key={idx} p="sm" style={{ border: '1px solid #eee', borderRadius: 6 }}>
                <Group align="flex-end" wrap="nowrap">
                  <NumberInput label="Latitude" decimalScale={6} style={{ flex: 1 }}
                    value={ap.lat}
                    onChange={(v) => form.setFieldValue(`access_points.${idx}.lat`, v)} />
                  <NumberInput label="Longitude" decimalScale={6} style={{ flex: 1 }}
                    value={ap.lng}
                    onChange={(v) => form.setFieldValue(`access_points.${idx}.lng`, v)} />
                  <ActionIcon variant="light" color="red" onClick={() => removeAP(idx)} aria-label="Remove">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <TextInput label="what3words"
                  value={ap.what3words || ''}
                  onChange={(e) => form.setFieldValue(`access_points.${idx}.what3words`, e.currentTarget.value)} />
                <Textarea label="Notes" autosize minRows={1}
                  value={ap.notes || ''}
                  onChange={(e) => form.setFieldValue(`access_points.${idx}.notes`, e.currentTarget.value)} />
              </Stack>
            ))}
            <Button leftSection={<IconPlus size={14} />} variant="light" onClick={addAP}>
              Add Access Point
            </Button>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Parking & Accessibility */}
      <Accordion.Item value="s8-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <AccessibleParkingChecklist form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Hours */}
      <Accordion.Item value="s9-hours">
        <Accordion.Control><Text fw={600}>Hours of Operation</Text></Accordion.Control>
        <Accordion.Panel>
          <HoursSelector
            value={form.values.hours}
            onChange={(value) => form.setFieldValue('hours', value)}
            poiType={form.values.poi_type}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Contact */}
      <Accordion.Item value="s10-contact">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Gallery */}
      <Accordion.Item value="s11-gallery">
        <Accordion.Control><Text fw={600}>Gallery</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Outdoor Features */}
      <Accordion.Item value="s12-outdoor">
        <Accordion.Control><Text fw={600}>Outdoor Features</Text></Accordion.Control>
        <Accordion.Panel>
          <OutdoorFeaturesSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Facilities */}
      <Accordion.Item value="s13-facilities">
        <Accordion.Control><Text fw={600}>Facilities & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FacilitiesSection form={form} isTrail id={poiId} />
            <FullAmenitiesBlock form={form} />
            <ConnectivityRow form={form} />
            <AlcoholAvailableSelect form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Public Restrooms */}
      <Accordion.Item value="s14-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PublicAmenitiesSection form={form} isTrail id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Rentals */}
      <Accordion.Item value="s15-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Hunting & Fishing */}
      <Accordion.Item value="s16-hunting">
        <Accordion.Control><Text fw={600}>Hunting & Fishing</Text></Accordion.Control>
        <Accordion.Panel>
          <HuntingFishingSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Pet Policy */}
      <Accordion.Item value="s17-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Playground (rare on trails but still supported) */}
      <Accordion.Item value="s18-playground">
        <Accordion.Control><Text fw={600}>Playground Information</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Switch
              label="This trail has a playground"
              checked={!!form.values.playground_available}
              onChange={(e) => form.setFieldValue('playground_available', e.currentTarget.checked)}
            />
            {form.values.playground_available && (<PlaygroundSection form={form} id={poiId} />)}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Pricing & Memberships */}
      <Accordion.Item value="s19-pricing">
        <Accordion.Control><Text fw={600}>Pricing & Memberships</Text></Accordion.Control>
        <Accordion.Panel>
          <PricingMembershipsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 20. Connections */}
      <Accordion.Item value="s20-connections">
        <Accordion.Control><Text fw={600}>Connections</Text></Accordion.Control>
        <Accordion.Panel>
          <ConnectionsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 21. Community */}
      <Accordion.Item value="s21-community">
        <Accordion.Control><Text fw={600}>Community Connections</Text></Accordion.Control>
        <Accordion.Panel>
          <CommunityConnectionsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 22. Internal & Compliance */}
      <Accordion.Item value="s22-internal">
        <Accordion.Control><Text fw={600}>Internal & Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <InternalContactSection form={form} />
            <CorporateComplianceSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 23. Dynamic Attributes */}
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

      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
