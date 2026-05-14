import React from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Switch,
  Checkbox, SimpleGrid, Textarea, Divider, Alert, Radio
} from '@mantine/core';
import RichTextEditor from '../../RichTextEditor';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import { PublicAmenitiesSection } from '../sections/FacilitiesSection';
import { BusinessGallerySection } from '../sections/BusinessDetailsSection';
import { PetPolicySection } from '../sections/OutdoorFeaturesSection';
import {
  InternalContactSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import HoursSelector from '../../HoursSelector';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import {
  AdminOnlyAccordionItem, IdealForGrouped, What3WordsInput,
  AccessibleRestroomChecklist, PARKING_OPTIONS
} from './_shared';
import {
  ALCOHOL_OPTIONS, SMOKING_OPTIONS, PRICE_RANGE_OPTIONS,
  getFieldsForListingType
} from '../../../utils/constants';
import { getCheckboxGroupProps } from '../constants/helpers';

export default function BusinessFreeLayout({ form, userRole, poiId }) {
  const fields = getFieldsForListingType('BUSINESS', 'free');

  return (
    <>
      {/* 1. Business Identity */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Business Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CoreInformationSection form={form} isBusiness isFreeListing id={poiId} />
            <Textarea
              label="Short Description"
              description={`Up to 250 characters. (${(form.values.description_short || '').length}/250)`}
              maxLength={250}
              autosize
              minRows={3}
              value={form.values.description_short || ''}
              onChange={(e) => form.setFieldValue('description_short', e.currentTarget.value.slice(0, 250))}
            />
            <ContactSection form={form} isFreeListing={true} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Categories + Discovery */}
      <Accordion.Item value="s2-categories">
        <Accordion.Control><Text fw={600}>Categories + Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isFreeListing isPaidListing={false} />
            <IdealForGrouped form={form} totalCap={fields.maxIdealFor} />
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
            <LocationSection form={form} isBusiness isFreeListing id={poiId} hideParking />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Parking */}
      <Accordion.Item value="s5-parking">
        <Accordion.Control><Text fw={600}>Parking</Text></Accordion.Control>
        <Accordion.Panel>
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
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Pricing + Passes */}
      <Accordion.Item value="s6-pricing">
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
          </Stack>
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
            <PublicAmenitiesSection form={form} isBusiness isFreeListing id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Pet Policy */}
      <Accordion.Item value="s9-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Alcohol + Smoking */}
      <Accordion.Item value="s10-alcohol-smoking">
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

      {/* 11. Logo */}
      <Accordion.Item value="s11-logo">
        <Accordion.Control><Text fw={600}>Logo</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} isFreeListing />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Contact + Compliance (Admin only) */}
      <Accordion.Item value="s12-contact-compliance">
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

      {/* 13. Admin-Only */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
