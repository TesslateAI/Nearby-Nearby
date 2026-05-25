import React from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Textarea
} from '@mantine/core';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import {
  FacilitiesSection, PublicAmenitiesSection
} from '../sections/FacilitiesSection';
import { BusinessGallerySection } from '../sections/BusinessDetailsSection';
import { PetPolicySection } from '../sections/OutdoorFeaturesSection';
import {
  InternalContactSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import HoursSelector from '../../HoursSelector';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import {
  AdminOnlyAccordionItem, IdealForGrouped, ArrivalMethodsGroup,
  What3WordsInput, AccessibleParkingChecklist, FullAmenitiesBlock,
  ConnectivityRow
} from './_shared';
import { getFieldsForListingType, PRICE_RANGE_OPTIONS } from '../../../utils/constants';

// Wave 4 #52 — Business Free 13-section accordion order per spec.
// Section order is authoritative; section component bodies are unchanged.
export default function BusinessFreeLayout({ form, userRole, poiId }) {
  const fields = getFieldsForListingType('BUSINESS', 'free');

  return (
    <>
      {/* 1. Business Identity (absorbs status + status_message + contact fields) */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Business Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CoreInformationSection form={form} isBusiness isFreeListing id={poiId} />
            <ContactSection form={form} isFreeListing={true} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Categories + Discovery (ideal_for cap 5 for Business Free) */}
      <Accordion.Item value="s2-categories">
        <Accordion.Control><Text fw={600}>Categories + Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isFreeListing isPaidListing={false} />
            <IdealForGrouped form={form} listingType="Business Free" totalCap={fields.maxIdealFor} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Hours (moved before Address per spec) */}
      <Accordion.Item value="s3-hours">
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

      {/* 4. Address */}
      <Accordion.Item value="s4-address">
        <Accordion.Control><Text fw={600}>Address</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isBusiness isFreeListing id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Parking & Accessibility (Business Free MVP: simple checklist; no parking_locations repeatable) */}
      <Accordion.Item value="s5-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <AccessibleParkingChecklist form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Restrooms (PublicAmenitiesSection renders inline ADA checklist post-Wave-3) */}
      <Accordion.Item value="s6-restrooms">
        <Accordion.Control><Text fw={600}>Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <PublicAmenitiesSection form={form} isBusiness isFreeListing id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Amenities (renamed from "Facilities & Accessibility") */}
      <Accordion.Item value="s7-amenities">
        <Accordion.Control><Text fw={600}>Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FacilitiesSection form={form} isBusiness isFreeListing id={poiId} />
            <FullAmenitiesBlock form={form} poiType="BUSINESS" />
            <ConnectivityRow form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Pricing — price_range_per_person + pricing_details (both columns exist in poi.py) */}
      <Accordion.Item value="s8-pricing">
        <Accordion.Control><Text fw={600}>Pricing</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Select
              label="Price Range Per Person"
              placeholder="Select a price range"
              data={PRICE_RANGE_OPTIONS}
              clearable
              value={form.values.price_range_per_person || null}
              onChange={(v) => form.setFieldValue('price_range_per_person', v)}
            />
            <Textarea
              label="Pricing Details"
              description="Free-form notes such as 'Kids Under 2 are Free'"
              autosize
              minRows={3}
              value={form.values.pricing_details || ''}
              onChange={(e) => form.setFieldValue('pricing_details', e.currentTarget.value)}
            />
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

      {/* 10. Gallery (renamed from "Logo / Images") */}
      <Accordion.Item value="s10-gallery">
        <Accordion.Control><Text fw={600}>Gallery</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} isFreeListing />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Internal */}
      <Accordion.Item value="s11-internal">
        <Accordion.Control><Text fw={600}>Internal</Text></Accordion.Control>
        <Accordion.Panel>
          <InternalContactSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Compliance (renamed from "Corporate Compliance") */}
      <Accordion.Item value="s12-compliance">
        <Accordion.Control><Text fw={600}>Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <CorporateComplianceSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Admin-Only (stays last) */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
