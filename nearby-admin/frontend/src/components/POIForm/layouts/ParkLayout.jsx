import React, { useState } from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Switch, Divider,
  Checkbox, SimpleGrid, Alert, Radio, NumberInput, Button, ActionIcon,
  Card, TextInput
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import {
  PublicAmenitiesSection, RentalsSection
} from '../sections/FacilitiesSection';
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
  ALCOHOL_OPTIONS, SMOKING_OPTIONS, DRONE_USAGE_OPTIONS
} from '../../../utils/constants';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  FeaturedImageUpload, GalleryPhotosUpload, ParkingPhotosUpload, shouldUseImageUpload
} from '../ImageIntegration';
import { addTitledLink, removeTitledLink, updateTitledLink } from '../../../utils/fieldHelpers';

export default function ParkLayout({ form, userRole, poiId }) {
  const [hasPlayground, setHasPlayground] = useState(
    !!form.values.playground_available
  );

  const articleLinks = form.values.article_links || [];

  return (
    <>
      {/* 1. Park Identity */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Park Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CoreInformationSection form={form} isPark id={poiId} />
            <ContactSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Categories + Discovery */}
      <Accordion.Item value="s2-categories">
        <Accordion.Control><Text fw={600}>Categories + Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isPaidListing isFreeListing={false} />
            <IdealForGrouped form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Hours */}
      <Accordion.Item value="s3-hours">
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

      {/* 4. Address */}
      <Accordion.Item value="s4-address">
        <Accordion.Control><Text fw={600}>Address</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isPark hideParking id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Parking */}
      <Accordion.Item value="s5-parking">
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
            <Text size="sm" c="dimmed" mb="sm">
              Set the coordinates and photos for the main parking area. Use "Add Another Parking Location" below for additional lots.
            </Text>
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
              placeholder="e.g., Main Lot, Visitor Center Parking"
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
                    placeholder="e.g., Main Lot, Visitor Center Parking"
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

      {/* 6. Pricing + Passes */}
      <Accordion.Item value="s6-pricing">
        <Accordion.Control><Text fw={600}>Pricing + Passes</Text></Accordion.Control>
        <Accordion.Panel>
          <PricingMembershipsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Accessibility + Mobility Access */}
      <Accordion.Item value="s7-accessibility">
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

      {/* 8. Public Restrooms */}
      <Accordion.Item value="s8-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PublicAmenitiesSection form={form} isPark id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Playground */}
      <Accordion.Item value="s9-playground">
        <Accordion.Control><Text fw={600}>Playground</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Switch
              label="This park has a playground"
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

      {/* 10. On Site Facilities + Amenities */}
      <Accordion.Item value="s10-facilities-amenities">
        <Accordion.Control><Text fw={600}>On Site Facilities + Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FullAmenitiesBlock form={form} poiType={form.values.poi_type} />
            <ConnectivityRow form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Pet Policy */}
      <Accordion.Item value="s11-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Alcohol + Smoking */}
      <Accordion.Item value="s12-alcohol-smoking">
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

      {/* 13. Outdoor Features */}
      <Accordion.Item value="s13-outdoor-features">
        <Accordion.Control><Text fw={600}>Outdoor Features</Text></Accordion.Control>
        <Accordion.Panel>
          <OutdoorFeaturesSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Drone Policy */}
      <Accordion.Item value="s14-drone">
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

      {/* 15. Hunting + Fishing */}
      <Accordion.Item value="s15-hunting-fishing">
        <Accordion.Control><Text fw={600}>Hunting + Fishing</Text></Accordion.Control>
        <Accordion.Panel>
          <HuntingFishingSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Rentals */}
      <Accordion.Item value="s16-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Locally Found + History */}
      <Accordion.Item value="s17-locally-found-history">
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
              placeholder="Describe this park's impact on the local community"
              value={form.values.community_impact || ''}
              onChange={(html) => form.setFieldValue('community_impact', html)}
              error={form.errors.community_impact}
              minRows={3}
            />

            <Divider label="History" mt="md" />
            <RichTextEditor
              label="History"
              placeholder="Share the history and background of this park"
              value={form.values.history_paragraph || ''}
              onChange={(html) => form.setFieldValue('history_paragraph', html)}
              error={form.errors.history_paragraph}
              minRows={3}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Images */}
      <Accordion.Item value="s18-images">
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

      {/* 19. Contact + Compliance (Admin only) */}
      <Accordion.Item value="s19-contact-compliance">
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

      {/* Admin-Only (Section 20) */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
