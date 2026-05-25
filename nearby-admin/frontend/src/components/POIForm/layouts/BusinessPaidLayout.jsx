import React from 'react';
import {
  Accordion, Stack, Group, Text, Badge, TextInput, Textarea, Select,
  MultiSelect, Switch, Divider
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
  InternalContactSection, CommunityConnectionsSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import HoursSelector from '../../HoursSelector';
import DynamicAttributeForm from '../../DynamicAttributeForm';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import {
  AdminOnlyAccordionItem, IdealForGrouped, ArrivalMethodsGroup, What3WordsInput,
  AccessibleParkingChecklist, FullAmenitiesBlock, ConnectivityRow,
  AlcoholAvailableSelect, PAYMENT_METHODS, DISCOUNT_TYPES
} from './_shared';
import { PRICE_RANGE_OPTIONS } from '../../../utils/constants';

// Wave 4 #53 — Business Paid + Community Comped + Sponsor variants:
// finalized 18-section accordion order per
// `Paid + Community Comped Slug Section Order.docx`. Section component
// internals are unchanged — this is a pure reorder + rename pass plus
// the NEW Pricing section, re-added Rentals section, and the simple
// Alcohol + Smoking gate (full #69 rebuild deferred to Phase 2).
//
// Verified columns in nearby-admin/backend/app/models/poi.py:
//   - price_range_per_person (line 146) — drives Select
//   - pricing_details         (line 85)  — drives Textarea
//   - teaser_paragraph        (line 23)  — used inside BusinessDetailsSection
//   - description_long        (line 21)  — used inside BusinessDetailsSection
//
// status + status_message stay in Section 1 (NOT Admin-Only) per spec.
export default function BusinessPaidLayout({ form, userRole, poiId }) {
  return (
    <>
      {/* 1. Business Identity — absorbs ContactSection socials/phone/email/website
              and keeps status + status_message inline (spec doc, table row 7). */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Business Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CoreInformationSection form={form} isBusiness isPaidListing id={poiId} />
            <ContactSection form={form} isFreeListing={false} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Categories + Discovery — IdealForGrouped without totalCap
              (Business Paid has higher / unlimited caps vs Free's 5). */}
      <Accordion.Item value="s2-categories">
        <Accordion.Control><Text fw={600}>Categories + Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isPaidListing isFreeListing={false} />
            <Divider my="sm" />
            <IdealForGrouped form={form} listingType="Business Paid" />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Hours — Wave 3 #46/#54 HoursSelector (needs form= prop). */}
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

      {/* 4. Address — LocationSection + ArrivalMethodsGroup + W3W. */}
      <Accordion.Item value="s4-address">
        <Accordion.Control><Text fw={600}>Address</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isBusiness id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Parking & Accessibility — AccessibleParkingChecklist only for now.
              Repeatable ParkingLocationGroup (Wave 3 #67) is NOT yet available
              in this worktree's baseline; when #67 merges, add it here. */}
      <Accordion.Item value="s5-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <AccessibleParkingChecklist form={form} />
            {/* TODO Wave 3 #67: <ParkingLocationGroup form={form} /> once merged */}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Contact & Social Media — spec lists this as its own section even
              though many fields are mirrored into Section 1. Keep it visible
              so users can find/edit socials directly. */}
      <Accordion.Item value="s6-contact">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} isFreeListing={false} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Business Details — teaser_paragraph + description_long + history + story
              (all rendered inside BusinessDetailsSection). */}
      <Accordion.Item value="s7-details">
        <Accordion.Control><Text fw={600}>Business Details</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessDetailsSection form={form} isFreeListing={false} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Pricing (NEW) — price_range_per_person Select + pricing_details Textarea.
              Both columns verified present on the POI model. */}
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

      {/* 9. Menu & Booking — renamed from "Menu, Booking & Online Ordering". */}
      <Accordion.Item value="s9-menu">
        <Accordion.Control><Text fw={600}>Menu & Booking</Text></Accordion.Control>
        <Accordion.Panel>
          <MenuBookingSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Business Entry — entry photo + business_entry_notes. */}
      <Accordion.Item value="s10-entry">
        <Accordion.Control><Text fw={600}>Business Entry</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessEntrySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Gallery — renamed from "Gallery" (already verbatim). */}
      <Accordion.Item value="s11-gallery">
        <Accordion.Control><Text fw={600}>Gallery</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Payments & Discounts — unchanged content, moved in order. */}
      <Accordion.Item value="s12-payments">
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

      {/* 13. Amenities & Facilities — FacilitiesSection + FullAmenitiesBlock + ConnectivityRow.
              Wave 2 #56 removed the embedded duplicate Alcohol dropdown; canonical
              alcohol selector lives in Section 15 now. */}
      <Accordion.Item value="s13-amenities">
        <Accordion.Control><Text fw={600}>Amenities & Facilities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FacilitiesSection form={form} isBusiness isFreeListing={false} id={poiId} />
            <FullAmenitiesBlock form={form} poiType="BUSINESS" />
            <ConnectivityRow form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Restrooms — PublicAmenitiesSection renders the inline ADA checklist
              per Wave 3 #47 (do NOT add a standalone <AccessibleRestroomChecklist>). */}
      <Accordion.Item value="s14-restrooms">
        <Accordion.Control><Text fw={600}>Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <PublicAmenitiesSection form={form} isBusiness isFreeListing={false} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Alcohol + Smoking — Alcohol gate only for now.
              Smoking is a JSONB list (smoking_options + smoking_details) that
              needs its own MultiSelect; full Smoking UI ships with Phase 2 #69
              rebuild. Do NOT bind a boolean to a non-existent column. */}
      <Accordion.Item value="s15-alcohol">
        <Accordion.Control><Text fw={600}>Alcohol + Smoking</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <AlcoholAvailableSelect form={form} />
            {/* TODO #69: Smoking MultiSelect (smoking_options JSONB) + smoking_details Textarea */}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Pet Policy — PetPolicySection + ServiceAnimalAlert (Wave 3 #48). */}
      <Accordion.Item value="s16-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Playground Information — gated on playground_available toggle. */}
      <Accordion.Item value="s17-playground">
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

      {/* 18. Rentals (NEW / re-added for Business Paid per PLAN #191). */}
      <Accordion.Item value="s18-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Internal & Compliance — InternalContact + CommunityConnections + CorporateCompliance. */}
      <Accordion.Item value="s19-internal">
        <Accordion.Control><Text fw={600}>Internal & Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <InternalContactSection form={form} />
            <CommunityConnectionsSection form={form} />
            <CorporateComplianceSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 20. Dynamic Attributes. */}
      <Accordion.Item value="s20-attrs">
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
