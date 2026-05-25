import React from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Textarea
} from '@mantine/core';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
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
import { DRONE_USAGE_OPTIONS, getFieldsForListingType } from '../../../utils/constants';

// Issue #60 — Park 22-section accordion reorder per spec.
// Section component bodies are unchanged. The ONLY content move is the Drone
// Policy controls, which have been lifted out of FacilitiesSection into the
// new dedicated s14-drone-policy section.
//
// status + status_message stay in Section 1 (NOT Admin-Only) per spec.
export default function ParkLayout({ form, userRole, poiId }) {
  const fields = getFieldsForListingType('PARK', form.values.listing_type);
  const idealForCap = fields?.maxIdealFor ?? 10;

  return (
    <>
      {/* 1. Park Identity — absorbs ContactSection socials/phone/email/website
              and keeps status + status_message inline. */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Park Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CoreInformationSection form={form} isPark id={poiId} />
            <ContactSection form={form} isFreeListing={false} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Categories + Discovery — replaces legacy single-select s2-park-category.
              IdealForGrouped is rules-gated (Park => visible:false) but rendered
              for forward-compat; cap derived from getFieldsForListingType. */}
      <Accordion.Item value="s2-categories">
        <Accordion.Control><Text fw={600}>Categories + Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isFreeListing={false} />
            <IdealForGrouped form={form} listingType="Park" totalCap={idealForCap} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Hours — NEW for Park (previously absent). */}
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

      {/* 4. Address — LocationSection + ArrivalMethodsGroup + What3Words. */}
      <Accordion.Item value="s4-address">
        <Accordion.Control><Text fw={600}>Address</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isPark id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Parking & Accessibility — repeatable parking_locations + ADA checklist. */}
      <Accordion.Item value="s5-parking">
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

      {/* 6. Entry Notes — single Textarea bound to park_entry_notes. */}
      <Accordion.Item value="s6-entry-notes">
        <Accordion.Control><Text fw={600}>Entry Notes</Text></Accordion.Control>
        <Accordion.Panel>
          <Textarea
            label="Park Entry Notes"
            autosize
            minRows={3}
            {...form.getInputProps('park_entry_notes')}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Contact & Social Media — spec lists Park contact as its own section
              even though many fields are mirrored into Section 1. Keep it
              visible so users can find/edit socials directly. */}
      <Accordion.Item value="s7-contact-social">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} isFreeListing={false} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Gallery. */}
      <Accordion.Item value="s8-gallery">
        <Accordion.Control><Text fw={600}>Gallery</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Outdoor Features. */}
      <Accordion.Item value="s9-outdoor-features">
        <Accordion.Control><Text fw={600}>Outdoor Features</Text></Accordion.Control>
        <Accordion.Panel>
          <OutdoorFeaturesSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Playground — #49 per-row age groups + grouped ADA. */}
      <Accordion.Item value="s10-playground">
        <Accordion.Control><Text fw={600}>Playground</Text></Accordion.Control>
        <Accordion.Panel>
          <PlaygroundsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Facilities & Amenities — FacilitiesSection (drone controls now
              removed; see s14) + FullAmenitiesBlock for the full Park amenities
              list per Section 12 spec (#55). */}
      <Accordion.Item value="s11-amenities">
        <Accordion.Control><Text fw={600}>Facilities & Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FacilitiesSection form={form} isPark id={poiId} />
            <FullAmenitiesBlock form={form} poiType="PARK" />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Restrooms — PublicAmenitiesSection renders the inline ADA checklist
              per Wave 3 #47 (do NOT add a standalone <AccessibleRestroomChecklist>). */}
      <Accordion.Item value="s12-restrooms">
        <Accordion.Control><Text fw={600}>Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <PublicAmenitiesSection form={form} isPark id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Alcohol — Issue #69 accordion with conditional sub-options.
              Smoking deferred to Phase 2. */}
      <AlcoholAccordionItem form={form} value="s13-alcohol" />

      {/* 14. Drone Policy — NEW dedicated section. Extracted from
              FacilitiesSection (previously rendered for Park / Trail / Event). */}
      <Accordion.Item value="s14-drone-policy">
        <Accordion.Control><Text fw={600}>Drone Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Select
              label="Drone Usage"
              placeholder="Select drone policy"
              data={DRONE_USAGE_OPTIONS}
              {...form.getInputProps('drone_usage')}
            />
            <Textarea
              label="Drone Policy Details"
              placeholder="Additional drone policy information"
              autosize
              minRows={3}
              value={form.values.drone_policy || ''}
              onChange={(e) => form.setFieldValue('drone_policy', e.currentTarget.value)}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Pet Policy. */}
      <Accordion.Item value="s15-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Rentals — available_for_rent toggle + rental_info + rental_link
              + rental photos. */}
      <Accordion.Item value="s16-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Hunting & Fishing — Wave 1 #61 fixed the conditional render. */}
      <Accordion.Item value="s17-hunting-fishing">
        <Accordion.Control><Text fw={600}>Hunting & Fishing</Text></Accordion.Control>
        <Accordion.Panel>
          <HuntingFishingSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Pricing & Memberships — cost + pricing_details + membership_details. */}
      <Accordion.Item value="s18-pricing-memberships">
        <Accordion.Control><Text fw={600}>Pricing & Memberships</Text></Accordion.Control>
        <Accordion.Panel>
          <PricingMembershipsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Connections — Connections + Community Connections consolidated. */}
      <Accordion.Item value="s19-connections">
        <Accordion.Control><Text fw={600}>Connections</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <ConnectionsSection form={form} isPark />
            <CommunityConnectionsSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 20. Internal & Compliance. */}
      <Accordion.Item value="s20-internal-compliance">
        <Accordion.Control><Text fw={600}>Internal & Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <InternalContactSection form={form} />
            <CorporateComplianceSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 21. Dynamic Attributes. */}
      <Accordion.Item value="s21-attrs">
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
