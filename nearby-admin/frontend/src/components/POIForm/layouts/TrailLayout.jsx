import React, { useState, useMemo } from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Switch, Radio, Divider,
  TextInput, Checkbox, SimpleGrid, Button, ActionIcon, NumberInput, Alert,
  Textarea, Card, Autocomplete
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import { TrailCategoriesSection } from '../sections/TrailCategoriesSection';
import { TrailDetailsSection } from '../sections/TrailSpecificSections';
import { PublicAmenitiesSection, RentalsSection } from '../sections/FacilitiesSection';
import {
  OutdoorFeaturesSection, HuntingFishingSection, PetPolicySection, PlaygroundSection
} from '../sections/OutdoorFeaturesSection';
import {
  InternalContactSection, PricingMembershipsSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import HoursSelector from '../../HoursSelector';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import {
  AdminOnlyAccordionItem, IdealForGrouped, ArrivalMethodsGroup, What3WordsInput,
  AccessibleParkingChecklist, AccessibleRestroomChecklist, FullAmenitiesBlock,
  ConnectivityRow, PARKING_OPTIONS
} from './_shared';
import {
  ALCOHOL_OPTIONS, SMOKING_OPTIONS, DRONE_USAGE_OPTIONS, PARK_FACILITIES
} from '../../../utils/constants';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  TRAIL_ROUTE_TYPES, GRANDFATHERED_ROUTE_TYPES, TRAIL_LIGHTING_OPTIONS
} from '../../../utils/outdoorConstants';
import {
  FeaturedImageUpload, GalleryPhotosUpload, ParkingPhotosUpload,
  TrailHeadPhotoUpload, AccessPointPhotoUpload, shouldUseImageUpload
} from '../ImageIntegration';
import { addTitledLink, removeTitledLink, updateTitledLink } from '../../../utils/fieldHelpers';
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
  const [hasPlayground, setHasPlayground] = useState(!!form.values.playground_available);

  const articleLinks = form.values.article_links || [];

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
    form.setFieldValue('access_points', [...accessPoints, { name: '', type: 'access', latitude: null, longitude: null, what3words: '', notes: '', photo_ids: [] }]);
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
          <Stack>
            <CoreInformationSection form={form} isTrail id={poiId} />
            <ContactSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Trail in Park */}
      <Accordion.Item value="s2-trail-in-park">
        <Accordion.Control><Text fw={600}>Trail in Park</Text></Accordion.Control>
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

      {/* 3. Categories + Discovery */}
      <Accordion.Item value="s3-categories">
        <Accordion.Control><Text fw={600}>Categories + Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <TrailCategoriesSection form={form} />
            <IdealForGrouped form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Hours */}
      <Accordion.Item value="s4-hours">
        <Accordion.Control><Text fw={600}>Hours of Operation</Text></Accordion.Control>
        <Accordion.Panel>
          <HoursSelector
            value={form.values.hours}
            onChange={(value) => form.setFieldValue('hours', value)}
            poiType={form.values.poi_type}
            appointmentRequired={form.values.hours_but_appointment_required || false}
            onAppointmentRequiredChange={(v) => form.setFieldValue('hours_but_appointment_required', v)}
            bookingUrl={form.values.appointment_booking_url || ''}
            onBookingUrlChange={(v) => form.setFieldValue('appointment_booking_url', v)}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Address */}
      <Accordion.Item value="s5-address">
        <Accordion.Control><Text fw={600}>Address</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isTrail id={poiId} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Parking */}
      <Accordion.Item value="s6-parking">
        <Accordion.Control><Text fw={600}>Parking</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Checkbox.Group
              label="Parking Types Available"
              value={form.values.parking_types || []}
              onChange={(value) => form.setFieldValue('parking_types', value)}
            >
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {PARKING_OPTIONS.map(type => (
                  <Checkbox key={type} value={type} label={type} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>

            <RichTextEditor
              label="Parking Notes"
              placeholder="Additional parking information"
              value={form.values.parking_notes || ''}
              onChange={(html) => form.setFieldValue('parking_notes', html)}
              error={form.errors.parking_notes}
            />

            <Divider my="md" label="Primary Parking Location" />
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <NumberInput
                label="Primary Parking Latitude"
                placeholder="35.7128"
                precision={6}
                value={form.values.primary_parking_lat || ''}
                onChange={(value) => form.setFieldValue('primary_parking_lat', value)}
              />
              <NumberInput
                label="Primary Parking Longitude"
                placeholder="-79.0064"
                precision={6}
                value={form.values.primary_parking_lng || ''}
                onChange={(value) => form.setFieldValue('primary_parking_lng', value)}
              />
            </SimpleGrid>
            <TextInput
              label="Primary Parking Area Name"
              placeholder="e.g., Main Lot, Trailhead Parking"
              value={form.values.primary_parking_name || ''}
              onChange={(e) => form.setFieldValue('primary_parking_name', e.target.value)}
            />
            {shouldUseImageUpload(poiId) ? (
              <ParkingPhotosUpload poiId={poiId} parkingName={form.values.primary_parking_name || 'Primary'} form={form} />
            ) : (
              <Text size="sm" c="dimmed">Save POI first to enable parking photo upload</Text>
            )}

            <Divider my="md" label="Additional Parking Locations" />
            {(form.values.parking_locations || []).map((parking, index) => (
              <Card key={index} withBorder p="md" mb="sm">
                <Stack>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <NumberInput
                      label="Parking Latitude"
                      placeholder="35.7128"
                      precision={6}
                      value={parking.lat || ''}
                      onChange={(value) => {
                        const locations = [...(form.values.parking_locations || [])];
                        locations[index] = { ...locations[index], lat: value };
                        form.setFieldValue('parking_locations', locations);
                      }}
                    />
                    <NumberInput
                      label="Parking Longitude"
                      placeholder="-79.0064"
                      precision={6}
                      value={parking.lng || ''}
                      onChange={(value) => {
                        const locations = [...(form.values.parking_locations || [])];
                        locations[index] = { ...locations[index], lng: value };
                        form.setFieldValue('parking_locations', locations);
                      }}
                    />
                  </SimpleGrid>
                  <TextInput
                    label="Parking Area Name"
                    placeholder="e.g., East Lot, Overflow Parking"
                    value={parking.name || ''}
                    onChange={(e) => {
                      const locations = [...(form.values.parking_locations || [])];
                      locations[index] = { ...locations[index], name: e.target.value };
                      form.setFieldValue('parking_locations', locations);
                    }}
                  />
                  {shouldUseImageUpload(poiId) ? (
                    <ParkingPhotosUpload poiId={poiId} parkingIndex={index} parkingName={parking.name} form={form} />
                  ) : (
                    <Text size="sm" c="dimmed">Save POI first to enable parking photo upload</Text>
                  )}
                  <Button
                    color="red"
                    variant="light"
                    size="xs"
                    onClick={() => {
                      const locations = [...(form.values.parking_locations || [])];
                      locations.splice(index, 1);
                      form.setFieldValue('parking_locations', locations);
                    }}
                  >
                    Remove Parking Location
                  </Button>
                </Stack>
              </Card>
            ))}
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                const locations = [...(form.values.parking_locations || [])];
                locations.push({ lat: null, lng: null, name: '' });
                form.setFieldValue('parking_locations', locations);
              }}
            >
              Add Another Parking Location
            </Button>

            <Divider my="md" label="Accessible Parking" />
            <AccessibleParkingChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Pricing + Passes */}
      <Accordion.Item value="s7-pricing">
        <Accordion.Control><Text fw={600}>Pricing + Passes</Text></Accordion.Control>
        <Accordion.Panel>
          <PricingMembershipsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Trail Guide */}
      <Accordion.Item value="s8-trail-guide">
        <Accordion.Control><Text fw={600}>Trail Guide</Text></Accordion.Control>
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

            <Divider my="md" label={waterTrail ? 'Primary Put-In' : 'Primary Trailhead'} />
            <TextInput
              label={waterTrail ? 'Put-In Name' : 'Primary Trailhead Name'}
              placeholder={waterTrail ? 'e.g. River Road Launch' : 'e.g. Main Trailhead'}
              description="Named identifier for the primary entry point"
              value={form.values.primary_trailhead_name ?? ''}
              onChange={(e) => form.setFieldValue('primary_trailhead_name', e.currentTarget.value)}
            />
            <ArrivalMethodsGroup form={form} />

            {shouldUseImageUpload(poiId) ? (
              <TrailHeadPhotoUpload poiId={poiId} form={form} />
            ) : (
              <Text size="sm" c="dimmed">Save POI first to enable trailhead photo upload</Text>
            )}
            <RichTextEditor
              label={waterTrail ? 'Primary Put-In Notes' : 'Primary Trailhead Notes'}
              placeholder="Access details, directions, hazards..."
              value={form.values.trailhead_access_details || ''}
              onChange={(html) => form.setFieldValue('trailhead_access_details', html)}
            />

            <Divider my="md" label="Trail Markings + Symbols" />
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
                  <TextInput label={waterTrail ? 'Point Name' : 'Access Point Name'} style={{ flex: 1 }}
                    placeholder={waterTrail ? 'e.g. North Take-Out' : 'e.g. East Entrance'}
                    value={ap.name || ''}
                    onChange={(e) => form.setFieldValue(`access_points.${idx}.name`, e.currentTarget.value)} />
                  <Select
                    label="Type"
                    style={{ width: 140 }}
                    data={waterTrail
                      ? [{ value: 'put_in', label: 'Put-In' }, { value: 'take_out', label: 'Take-Out' }, { value: 'access', label: 'Access' }]
                      : [{ value: 'access', label: 'Access' }, { value: 'exit', label: 'Exit' }, { value: 'trailhead', label: 'Trailhead' }]
                    }
                    value={ap.type || 'access'}
                    onChange={(v) => form.setFieldValue(`access_points.${idx}.type`, v)}
                  />
                  <ActionIcon variant="light" color="red" mt={24} onClick={() => removeAP(idx)} aria-label="Remove">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <NumberInput label="Latitude" decimalScale={6}
                    value={ap.latitude}
                    onChange={(v) => form.setFieldValue(`access_points.${idx}.latitude`, v)} />
                  <NumberInput label="Longitude" decimalScale={6}
                    value={ap.longitude}
                    onChange={(v) => form.setFieldValue(`access_points.${idx}.longitude`, v)} />
                </SimpleGrid>
                <TextInput label="what3words"
                  value={ap.what3words || ''}
                  onChange={(e) => form.setFieldValue(`access_points.${idx}.what3words`, e.currentTarget.value)} />
                {shouldUseImageUpload(poiId) ? (
                  <AccessPointPhotoUpload poiId={poiId} apIndex={idx} apName={ap.name} waterTrail={waterTrail} />
                ) : (
                  <Text size="sm" c="dimmed">Save POI first to enable access point photo upload</Text>
                )}
                <RichTextEditor
                  label={waterTrail ? 'Put-In / Take-Out Notes' : 'Access Point Notes'}
                  placeholder="Directions, parking, hazards..."
                  value={ap.notes || ''}
                  onChange={(html) => form.setFieldValue(`access_points.${idx}.notes`, html)}
                />
              </Stack>
            ))}
            <Button leftSection={<IconPlus size={14} />} variant="light" onClick={addAP}>
              {waterTrail ? 'Add Put-In + Take-Out Point' : 'Add Access Point'}
            </Button>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Accessibility + Mobility Access */}
      <Accordion.Item value="s9-accessibility">
        <Accordion.Control><Text fw={600}>Accessibility + Mobility Access</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Text size="sm" c="dimmed">
              These fields help users with mobility needs find accessible locations.
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Select
                label="Step-Free Entry"
                placeholder="Select..."
                data={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'unknown', label: 'Unknown' }
                ]}
                value={form.values.mobility_access?.step_free_entry || null}
                onChange={(v) => form.setFieldValue('mobility_access.step_free_entry', v)}
                clearable
              />
              <Select
                label="Main Service Area Accessible"
                placeholder="Select..."
                data={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'unknown', label: 'Unknown' }
                ]}
                value={form.values.mobility_access?.main_area_accessible || null}
                onChange={(v) => form.setFieldValue('mobility_access.main_area_accessible', v)}
                clearable
              />
              <Select
                label="Ground Level Service"
                placeholder="Select..."
                data={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                  { value: 'unknown', label: 'Unknown' }
                ]}
                value={form.values.mobility_access?.ground_level_service || null}
                onChange={(v) => form.setFieldValue('mobility_access.ground_level_service', v)}
                clearable
              />
            </SimpleGrid>
            <RichTextEditor
              label="Accessibility Details"
              placeholder="Describe accessibility features, accommodations, and any known limitations"
              value={form.values.wheelchair_details || ''}
              onChange={(html) => form.setFieldValue('wheelchair_details', html)}
              error={form.errors.wheelchair_details}
              minRows={3}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Public Restrooms */}
      <Accordion.Item value="s10-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PublicAmenitiesSection form={form} isTrail id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Playground */}
      <Accordion.Item value="s11-playground">
        <Accordion.Control><Text fw={600}>Playground</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Switch
              label="This trail has a playground"
              checked={hasPlayground}
              onChange={(e) => {
                setHasPlayground(e.currentTarget.checked);
                form.setFieldValue('playground_available', e.currentTarget.checked);
              }}
            />
            {hasPlayground && <PlaygroundSection form={form} id={poiId} />}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. On Site Facilities + Amenities */}
      <Accordion.Item value="s12-facilities-amenities">
        <Accordion.Control><Text fw={600}>On Site Facilities + Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Checkbox.Group
              label="Facilities"
              value={form.values.facilities_options || []}
              onChange={(value) => form.setFieldValue('facilities_options', value)}
            >
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {PARK_FACILITIES.map(f => (
                  <Checkbox key={f} value={f} label={f} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
            <FullAmenitiesBlock form={form} poiType={form.values.poi_type} />
            <ConnectivityRow form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Pet Policy */}
      <Accordion.Item value="s13-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Alcohol + Smoking */}
      <Accordion.Item value="s14-alcohol-smoking">
        <Accordion.Control><Text fw={600}>Alcohol + Smoking</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Divider label="Alcohol" />
            <Radio.Group
              label="Is alcohol available?"
              value={form.values.alcohol_available || 'no'}
              onChange={(value) => {
                form.setFieldValue('alcohol_available', value);
                if (value === 'no') form.setFieldValue('alcohol_options', []);
              }}
            >
              <Stack mt="xs">
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
              </Stack>
            </Radio.Group>
            {form.values.alcohol_available === 'yes' && (
              <>
                <Checkbox.Group label="Alcohol Options" {...getCheckboxGroupProps(form, 'alcohol_options')}>
                  <SimpleGrid cols={{ base: 2, sm: 3 }}>
                    {ALCOHOL_OPTIONS.filter(o => !['Yes', 'No Alcohol Allowed'].includes(o)).map(o => (
                      <Checkbox key={o} value={o} label={o} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
                <RichTextEditor
                  label="Alcohol Policy Details"
                  placeholder="BYOB policy, concession details, restrictions, etc."
                  value={form.values.alcohol_policy_details || ''}
                  onChange={(html) => form.setFieldValue('alcohol_policy_details', html)}
                  error={form.errors.alcohol_policy_details}
                />
              </>
            )}

            <Divider label="Smoking" />
            <Checkbox.Group label="Smoking Policy" {...getCheckboxGroupProps(form, 'smoking_options')}>
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {SMOKING_OPTIONS.map(o => <Checkbox key={o} value={o} label={o} />)}
              </SimpleGrid>
            </Checkbox.Group>
            <RichTextEditor
              label="Smoking Policy Details"
              placeholder="Additional smoking policy information"
              value={form.values.smoking_details || ''}
              onChange={(html) => form.setFieldValue('smoking_details', html)}
              error={form.errors.smoking_details}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Outdoor Features */}
      <Accordion.Item value="s15-outdoor-features">
        <Accordion.Control><Text fw={600}>Outdoor Features</Text></Accordion.Control>
        <Accordion.Panel>
          <OutdoorFeaturesSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Drone Policy */}
      <Accordion.Item value="s16-drone">
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
            <RichTextEditor
              label="Drone Policy Details"
              placeholder="Describe the full drone policy, restrictions, permit requirements, etc."
              value={form.values.drone_policy || ''}
              onChange={(html) => form.setFieldValue('drone_policy', html)}
              error={form.errors.drone_policy}
              minRows={3}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Hunting + Fishing */}
      <Accordion.Item value="s17-hunting-fishing">
        <Accordion.Control><Text fw={600}>Hunting + Fishing</Text></Accordion.Control>
        <Accordion.Panel>
          <HuntingFishingSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Rentals */}
      <Accordion.Item value="s18-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Locally Found + History */}
      <Accordion.Item value="s19-locally-found-history">
        <Accordion.Control><Text fw={600}>Locally Found + History</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Divider label="Article Links" />
            {articleLinks.map((link, index) => (
              <Group key={index} align="flex-end" wrap="nowrap">
                <TextInput
                  label="Title"
                  style={{ flex: 1 }}
                  value={link.title || ''}
                  onChange={(e) => updateTitledLink(form, 'article_links', index, 'title', e.currentTarget.value)}
                />
                <TextInput
                  label="URL"
                  style={{ flex: 2 }}
                  value={link.url || ''}
                  onChange={(e) => updateTitledLink(form, 'article_links', index, 'url', e.currentTarget.value)}
                />
                <ActionIcon
                  variant="light"
                  color="red"
                  onClick={() => removeTitledLink(form, 'article_links', index)}
                  aria-label="Remove"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button
              leftSection={<IconPlus size={14} />}
              variant="light"
              onClick={() => addTitledLink(form, 'article_links')}
            >
              Add Article Link
            </Button>

            <Divider label="Community Impact" mt="md" />
            <RichTextEditor
              label="Community Impact"
              placeholder="Describe this trail's impact on the local community"
              value={form.values.community_impact || ''}
              onChange={(html) => form.setFieldValue('community_impact', html)}
              error={form.errors.community_impact}
              minRows={3}
            />

            <Divider label="History" mt="md" />
            <RichTextEditor
              label="History"
              placeholder="Share the history and background of this trail"
              value={form.values.history_paragraph || ''}
              onChange={(html) => form.setFieldValue('history_paragraph', html)}
              error={form.errors.history_paragraph}
              minRows={3}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 20. Images */}
      <Accordion.Item value="s20-images">
        <Accordion.Control><Text fw={600}>Images</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            {shouldUseImageUpload(poiId) ? (
              <>
                <FeaturedImageUpload poiId={poiId} form={form} />
                <GalleryPhotosUpload poiId={poiId} form={form} />
              </>
            ) : (
              <Text size="sm" c="dimmed">Save POI first to enable image upload</Text>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 21. Contact + Compliance (Admin only) */}
      <Accordion.Item value="s21-contact-compliance">
        <Accordion.Control>
          <Group>
            <Text fw={600}>Contact + Compliance</Text>
            <Badge size="sm" variant="light" color="orange">Internal Only</Badge>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Alert color="orange" variant="light" fw={500}>
              FOR INTERNAL USE — NOT DISPLAYED PUBLICLY
            </Alert>
            <InternalContactSection form={form} />
            <CorporateComplianceSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 22. Admin-Only */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
