import React from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Switch,
  Checkbox, SimpleGrid, Divider, Alert, Radio, NumberInput, TextInput,
  ActionIcon, Button
} from '@mantine/core';
import RichTextEditor from '../../RichTextEditor';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import {
  MenuBookingSection, BusinessGallerySection
} from '../sections/BusinessDetailsSection';
import {
  PublicAmenitiesSection, RentalsSection
} from '../sections/FacilitiesSection';
import {
  PetPolicySection, PlaygroundSection
} from '../sections/OutdoorFeaturesSection';
import {
  InternalContactSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import HoursSelector from '../../HoursSelector';
import DynamicAttributeForm from '../../DynamicAttributeForm';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import {
  AdminOnlyAccordionItem, IdealForGrouped, What3WordsInput,
  AccessibleRestroomChecklist, FullAmenitiesBlock, ConnectivityRow,
  PARKING_OPTIONS, PAYMENT_METHODS, DISCOUNT_TYPES
} from './_shared';
import {
  ALCOHOL_OPTIONS, SMOKING_OPTIONS, PRICE_RANGE_OPTIONS, GIFT_CARD_OPTIONS
} from '../../../utils/constants';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  ParkingPhotosUpload, shouldUseImageUpload
} from '../ImageIntegration';
import { addTitledLink, removeTitledLink, updateTitledLink } from '../../../utils/fieldHelpers';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export default function BusinessPaidLayout({ form, userRole, poiId }) {
  return (
    <>
      {/* 1. Business Identity */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Business Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CoreInformationSection form={form} isBusiness isPaidListing id={poiId} />
            <RichTextEditor
              label="Teaser Paragraph"
              description="Short hook — shown on cards and previews. Max 120 characters."
              placeholder="A one-sentence hook for this listing"
              value={form.values.teaser_paragraph || ''}
              onChange={(html) => form.setFieldValue('teaser_paragraph', html)}
              error={form.errors.teaser_paragraph}
              minRows={2}
            />
            <RichTextEditor
              label="Full Description"
              placeholder="Detailed description of the business"
              value={form.values.description_long || ''}
              onChange={(html) => form.setFieldValue('description_long', html)}
              error={form.errors.description_long}
              minRows={4}
            />
            <ContactSection form={form} isFreeListing={false} />
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

      {/* 3. Hours of Operation */}
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
            <LocationSection form={form} isBusiness id={poiId} hideParking />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Parking */}
      <Accordion.Item value="s5-parking">
        <Accordion.Control><Text fw={600}>Parking</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <TextInput
              label="Primary Parking Area Name"
              placeholder="e.g., Main Lot, Front Parking"
              value={form.values.primary_parking_name || ''}
              onChange={(e) => form.setFieldValue('primary_parking_name', e.target.value)}
            />
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
            {shouldUseImageUpload(poiId) ? (
              <ParkingPhotosUpload poiId={poiId} parkingName={form.values.primary_parking_name || 'Primary'} form={form} />
            ) : (
              <Text size="sm" c="dimmed">Save POI first to enable parking photo upload</Text>
            )}
            <RichTextEditor
              label="Parking Notes"
              placeholder="Additional parking information"
              value={form.values.parking_notes || ''}
              onChange={(html) => form.setFieldValue('parking_notes', html)}
              error={form.errors.parking_notes}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Menu + Online Booking */}
      <Accordion.Item value="s6-menu-booking">
        <Accordion.Control><Text fw={600}>Menu + Online Booking</Text></Accordion.Control>
        <Accordion.Panel>
          <MenuBookingSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Pricing + Passes */}
      <Accordion.Item value="s7-pricing">
        <Accordion.Control><Text fw={600}>Pricing + Passes</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Select
              label="Price Range (Per Person)"
              placeholder="Select price range"
              data={PRICE_RANGE_OPTIONS}
              value={form.values.price_range_per_person || null}
              onChange={(v) => form.setFieldValue('price_range_per_person', v)}
              clearable
            />
            <RichTextEditor
              label="Pricing Details"
              placeholder="Additional pricing info (e.g., Kids under 2 are free)"
              value={form.values.pricing_details || ''}
              onChange={(html) => form.setFieldValue('pricing_details', html)}
              error={form.errors.pricing_details}
              minRows={3}
            />
            <Divider label="Payment Methods" />
            <Checkbox.Group label="Payment Methods Accepted" {...getCheckboxGroupProps(form, 'payment_methods')}>
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {PAYMENT_METHODS.map(m => <Checkbox key={m} value={m} label={m} />)}
              </SimpleGrid>
            </Checkbox.Group>
            <Divider label="Discounts" />
            <Checkbox.Group label="Discounts Offered" {...getCheckboxGroupProps(form, 'discounts')}>
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {DISCOUNT_TYPES.map(d => <Checkbox key={d} value={d} label={d} />)}
              </SimpleGrid>
            </Checkbox.Group>
            <Select
              label="Gift Cards Available?"
              data={GIFT_CARD_OPTIONS}
              value={form.values.gift_cards || null}
              onChange={(v) => form.setFieldValue('gift_cards', v)}
              clearable
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Accessibility + Mobility Access */}
      <Accordion.Item value="s8-accessibility">
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

      {/* 9. Public Restrooms */}
      <Accordion.Item value="s9-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PublicAmenitiesSection form={form} isBusiness isFreeListing={false} id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Playground */}
      <Accordion.Item value="s10-playground">
        <Accordion.Control><Text fw={600}>Playground</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Switch
              label="This business has a playground"
              checked={!!form.values.playground_available}
              onChange={(e) => form.setFieldValue('playground_available', e.currentTarget.checked)}
            />
            {form.values.playground_available && (
              <PlaygroundSection form={form} id={poiId} />
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. On Site Facilities + Amenities */}
      <Accordion.Item value="s11-facilities-amenities">
        <Accordion.Control><Text fw={600}>On Site Facilities + Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FullAmenitiesBlock form={form} poiType={form.values.poi_type} />
            <ConnectivityRow form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Pet Policy */}
      <Accordion.Item value="s12-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Alcohol + Smoking */}
      <Accordion.Item value="s13-alcohol-smoking">
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

      {/* 14. Rentals */}
      <Accordion.Item value="s14-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Locally Found + History */}
      <Accordion.Item value="s15-locally-found-history">
        <Accordion.Control><Text fw={600}>Locally Found + History</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Divider label="Article Links" />
            {(form.values.article_links || []).map((link, index) => (
              <Group key={index} align="flex-end">
                <TextInput
                  style={{ flex: 1 }}
                  label={index === 0 ? 'Link Title' : undefined}
                  placeholder="e.g., Featured in Local News"
                  value={link?.title || ''}
                  onChange={(e) => updateTitledLink(form, 'article_links', index, 'title', e.target.value)}
                />
                <TextInput
                  style={{ flex: 2 }}
                  label={index === 0 ? 'URL' : undefined}
                  placeholder="https://..."
                  value={link?.url || ''}
                  onChange={(e) => updateTitledLink(form, 'article_links', index, 'url', e.target.value)}
                />
                <ActionIcon color="red" onClick={() => removeTitledLink(form, 'article_links', index)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button
              variant="light"
              leftSection={<IconPlus size={16} />}
              onClick={() => addTitledLink(form, 'article_links')}
            >
              Add Article Link
            </Button>
            <Divider label="Community + History" />
            <RichTextEditor
              label="Community Impact"
              placeholder="How does this business contribute to the local community?"
              value={form.values.community_impact || ''}
              onChange={(html) => form.setFieldValue('community_impact', html)}
              error={form.errors.community_impact}
              minRows={3}
            />
            <RichTextEditor
              label="History"
              placeholder="The story and history of this business"
              value={form.values.history_paragraph || ''}
              onChange={(html) => form.setFieldValue('history_paragraph', html)}
              error={form.errors.history_paragraph}
              minRows={3}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Images */}
      <Accordion.Item value="s16-images">
        <Accordion.Control><Text fw={600}>Images</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Contact + Compliance (Admin only) */}
      <Accordion.Item value="s17-contact-compliance">
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

      {/* 18. Dynamic Attributes */}
      <Accordion.Item value="s18-attrs">
        <Accordion.Control><Text fw={600}>Dynamic Attributes</Text></Accordion.Control>
        <Accordion.Panel>
          <DynamicAttributeForm
            poiType={form.values.poi_type}
            value={form.values.dynamic_attributes || {}}
            onChange={(value) => form.setFieldValue('dynamic_attributes', value)}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* Admin-Only */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
