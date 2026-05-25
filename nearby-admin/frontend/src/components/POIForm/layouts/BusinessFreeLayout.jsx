import React from 'react';
import {
  Accordion, Stack, Group, Text, Badge
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
  What3WordsInput
} from './_shared';
export default function BusinessFreeLayout({ form, userRole, poiId }) {
  return (
    <>
      {/* 1. Business Identity */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Business Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <CoreInformationSection form={form} isBusiness isFreeListing id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* Issue #43: removed duplicate Short Description accordion (s2-short-desc).
          The rich-text Short Description in Section 1 (Business Identity, via
          CoreInformationSection) is the canonical source. */}

      {/* 2. Categories & Ideal For (capped) */}
      <Accordion.Item value="s3-categories">
        <Accordion.Control><Text fw={600}>Categories & Ideal For</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <IdealForGrouped form={form} listingType="Business Free" />
            <CategoriesSection form={form} isFreeListing isPaidListing={false} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Location & Arrival */}
      <Accordion.Item value="s4-location">
        <Accordion.Control><Text fw={600}>Location & Arrival</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isBusiness isFreeListing id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
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
            form={form}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Contact (no socials in Free) */}
      <Accordion.Item value="s6-contact">
        <Accordion.Control><Text fw={600}>Contact</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} isFreeListing={true} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Facilities & Accessibility (minimal) */}
      <Accordion.Item value="s7-facilities">
        <Accordion.Control><Text fw={600}>Facilities & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <FacilitiesSection form={form} isBusiness isFreeListing id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Public Restrooms */}
      <Accordion.Item value="s8-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <PublicAmenitiesSection form={form} isBusiness isFreeListing id={poiId} />
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

      {/* 10. Internal Contact */}
      <Accordion.Item value="s10-internal">
        <Accordion.Control><Text fw={600}>Internal Contact</Text></Accordion.Control>
        <Accordion.Panel>
          <InternalContactSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Logo / Images */}
      <Accordion.Item value="s11-images">
        <Accordion.Control><Text fw={600}>Logo / Images</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} isFreeListing />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Corporate Compliance */}
      <Accordion.Item value="s12-compliance">
        <Accordion.Control><Text fw={600}>Corporate Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <CorporateComplianceSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Admin-Only */}
      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
