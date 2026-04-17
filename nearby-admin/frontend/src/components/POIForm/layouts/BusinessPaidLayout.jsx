import React from 'react';
import {
  Accordion, Stack, Group, Text, Badge, TextInput, Textarea, Select,
  MultiSelect, Switch, Title, Divider
} from '@mantine/core';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import {
  BusinessDetailsSection, MenuBookingSection, BusinessGallerySection, BusinessEntrySection
} from '../sections/BusinessDetailsSection';
import {
  FacilitiesSection, PublicAmenitiesSection, RentalsSection
} from '../sections/FacilitiesSection';
import {
  PetPolicySection, PlaygroundSection
} from '../sections/OutdoorFeaturesSection';
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
  ConnectivityRow, AlcoholAvailableSelect, PAYMENT_METHODS, DISCOUNT_TYPES
} from './_shared';

export default function BusinessPaidLayout({ form, userRole, poiId }) {
  return (
    <>
      {/* 1. Business Identity (Core) */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Business Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <CoreInformationSection form={form} isBusiness isPaidListing id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Categories & Ideal For */}
      <Accordion.Item value="s2-categories">
        <Accordion.Control><Text fw={600}>Categories & Ideal For</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isPaidListing isFreeListing={false} />
            <Divider my="sm" />
            <IdealForGrouped form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Location & Arrival */}
      <Accordion.Item value="s3-location">
        <Accordion.Control><Text fw={600}>Location & Arrival</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isBusiness id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Parking & Accessibility */}
      <Accordion.Item value="s4-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Text size="sm" c="dimmed">Parking + ADA accessibility details</Text>
            <AccessibleParkingChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Hours of Operation */}
      <Accordion.Item value="s5-hours">
        <Accordion.Control><Text fw={600}>Hours of Operation</Text></Accordion.Control>
        <Accordion.Panel>
          <HoursSelector
            value={form.values.hours}
            onChange={(value) => form.setFieldValue('hours', value)}
            poiType={form.values.poi_type}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Contact & Social Media */}
      <Accordion.Item value="s6-contact">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} isFreeListing={false} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Business Details (Description, History, Story) */}
      <Accordion.Item value="s7-details">
        <Accordion.Control><Text fw={600}>Business Details</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessDetailsSection form={form} isFreeListing={false} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Gallery */}
      <Accordion.Item value="s8-gallery">
        <Accordion.Control><Text fw={600}>Gallery</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Menu, Booking & Online Ordering */}
      <Accordion.Item value="s9-menu">
        <Accordion.Control><Text fw={600}>Menu, Booking & Online Ordering</Text></Accordion.Control>
        <Accordion.Panel>
          <MenuBookingSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Business Entry */}
      <Accordion.Item value="s10-entry">
        <Accordion.Control><Text fw={600}>Business Entry</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessEntrySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Payments & Discounts */}
      <Accordion.Item value="s11-payments">
        <Accordion.Control><Text fw={600}>Payments & Discounts</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <MultiSelect
              label="Payment Methods Accepted"
              data={PAYMENT_METHODS}
              searchable
              value={form.values.payment_methods || []}
              onChange={(v) => form.setFieldValue('payment_methods', v)}
            />
            <MultiSelect
              label="Discounts Offered"
              data={DISCOUNT_TYPES}
              searchable
              value={form.values.discounts || []}
              onChange={(v) => form.setFieldValue('discounts', v)}
            />
            <Select
              label="Gift Cards"
              data={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
              value={form.values.gift_cards}
              onChange={(v) => form.setFieldValue('gift_cards', v)}
            />
            <TextInput label="Pricing Notes" {...form.getInputProps('pricing')} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Amenities & Facilities */}
      <Accordion.Item value="s12-amenities">
        <Accordion.Control><Text fw={600}>Amenities & Facilities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FacilitiesSection form={form} isBusiness isFreeListing={false} id={poiId} />
            <FullAmenitiesBlock form={form} />
            <ConnectivityRow form={form} />
            <AlcoholAvailableSelect form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Public Restrooms */}
      <Accordion.Item value="s13-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PublicAmenitiesSection form={form} isBusiness isFreeListing={false} id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Pet Policy */}
      <Accordion.Item value="s14-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Playground (optional, gated by has_playground/playground_available) */}
      <Accordion.Item value="s15-playground">
        <Accordion.Control><Text fw={600}>Playground Information</Text></Accordion.Control>
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

      {/* 16. Internal & Compliance */}
      <Accordion.Item value="s16-internal">
        <Accordion.Control><Text fw={600}>Internal & Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <InternalContactSection form={form} />
            <CorporateComplianceSection form={form} />
            <CommunityConnectionsSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Dynamic Attributes */}
      <Accordion.Item value="s17-attrs">
        <Accordion.Control><Text fw={600}>Dynamic Attributes</Text></Accordion.Control>
        <Accordion.Panel>
          <DynamicAttributeForm
            poiType={form.values.poi_type}
            value={form.values.dynamic_attributes || {}}
            onChange={(value) => form.setFieldValue('dynamic_attributes', value)}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* Admin-Only (only renders for admins) */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
