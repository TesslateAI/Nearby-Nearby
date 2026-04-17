import React, { useEffect, useState } from 'react';
import {
  Accordion, Stack, Group, Text, Badge, Select, Textarea, Switch, Divider
} from '@mantine/core';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import { ParkCategoriesSection } from '../sections/ParkCategoriesSection';
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
import { PLAYGROUND_AGE_GROUPS, PLAYGROUND_ADA_CHECKLIST } from '../../../utils/outdoorConstants';
import { api } from '../../../utils/api';
import { Checkbox, SimpleGrid, MultiSelect } from '@mantine/core';

function usePARKCategories() {
  const [opts, setOpts] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get('/categories/by-poi-type/PARK');
        if (resp.ok) {
          const data = await resp.json();
          const list = Array.isArray(data) ? data : (data.items || []);
          setOpts(list.map(c => ({ value: c.name, label: c.name })));
        }
      } catch (e) { /* ignore */ }
    })();
  }, []);
  return opts;
}

export default function ParkLayout({ form, userRole, poiId }) {
  const parkCatOpts = usePARKCategories();
  const selectedParkCat = (form.values.outdoor_types && form.values.outdoor_types[0]) || null;
  const playgroundAda = Array.isArray(form.values.playground_ada_checklist) ? form.values.playground_ada_checklist : [];

  const toggleAda = (opt) => {
    const next = playgroundAda.includes(opt)
      ? playgroundAda.filter(x => x !== opt)
      : [...playgroundAda, opt];
    form.setFieldValue('playground_ada_checklist', next);
    // Derive inclusive_playground = all 3 required items present
    const required = [
      'Accessible route to play area',
      'Ground-level play components accessible',
      'Unitary surface (poured-rubber/tiles)',
    ];
    form.setFieldValue('inclusive_playground', required.every(r => next.includes(r)));
  };

  return (
    <>
      {/* 1. Park Identity */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Park Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <CoreInformationSection form={form} isPark id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Park Category (single-select from API) */}
      <Accordion.Item value="s2-park-category">
        <Accordion.Control><Text fw={600}>Park Category</Text></Accordion.Control>
        <Accordion.Panel>
          <Select
            label="Park Category"
            placeholder="Select a category"
            data={parkCatOpts}
            value={selectedParkCat}
            onChange={(v) => form.setFieldValue('outdoor_types', v ? [v] : [])}
            clearable
            searchable
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Things to Do / Ideal For */}
      <Accordion.Item value="s3-things">
        <Accordion.Control><Text fw={600}>Things to Do / Ideal For</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <ParkCategoriesSection form={form} />
            <IdealForGrouped form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Location & Arrival */}
      <Accordion.Item value="s4-location">
        <Accordion.Control><Text fw={600}>Location & Arrival</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isPark id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Park Entry Notes */}
      <Accordion.Item value="s5-entry">
        <Accordion.Control><Text fw={600}>Park Entry</Text></Accordion.Control>
        <Accordion.Panel>
          <Textarea
            label="Park Entry Notes"
            autosize
            minRows={3}
            {...form.getInputProps('park_entry_notes')}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Parking & Accessibility */}
      <Accordion.Item value="s6-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <AccessibleParkingChecklist form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Hours of Operation */}
      <Accordion.Item value="s7-hours">
        <Accordion.Control><Text fw={600}>Hours of Operation</Text></Accordion.Control>
        <Accordion.Panel>
          <HoursSelector
            value={form.values.hours}
            onChange={(value) => form.setFieldValue('hours', value)}
            poiType={form.values.poi_type}
          />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Contact & Social Media */}
      <Accordion.Item value="s8-contact">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Gallery */}
      <Accordion.Item value="s9-gallery">
        <Accordion.Control><Text fw={600}>Gallery</Text></Accordion.Control>
        <Accordion.Panel>
          <BusinessGallerySection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Outdoor Features */}
      <Accordion.Item value="s10-outdoor">
        <Accordion.Control><Text fw={600}>Outdoor Features</Text></Accordion.Control>
        <Accordion.Panel>
          <OutdoorFeaturesSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Facilities */}
      <Accordion.Item value="s11-facilities">
        <Accordion.Control><Text fw={600}>Facilities & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FacilitiesSection form={form} isPark id={poiId} />
            <FullAmenitiesBlock form={form} />
            <ConnectivityRow form={form} />
            <AlcoholAvailableSelect form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Public Restrooms */}
      <Accordion.Item value="s12-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PublicAmenitiesSection form={form} isPark id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Rentals */}
      <Accordion.Item value="s13-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Hunting & Fishing */}
      <Accordion.Item value="s14-hunting">
        <Accordion.Control><Text fw={600}>Hunting & Fishing</Text></Accordion.Control>
        <Accordion.Panel>
          <HuntingFishingSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Pet Policy */}
      <Accordion.Item value="s15-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Playground (gated by has_playground/playground_available) */}
      <Accordion.Item value="s16-playground">
        <Accordion.Control><Text fw={600}>Playground Information</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Switch
              label="This park has a playground"
              checked={!!form.values.playground_available}
              onChange={(e) => form.setFieldValue('playground_available', e.currentTarget.checked)}
            />
            {form.values.playground_available && (
              <>
                <PlaygroundSection form={form} id={poiId} />
                <MultiSelect
                  label="Playground Age Groups"
                  data={PLAYGROUND_AGE_GROUPS}
                  value={form.values.playground_age_groups || []}
                  onChange={(v) => form.setFieldValue('playground_age_groups', v)}
                />
                <Text fw={500}>Playground ADA Checklist</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  {PLAYGROUND_ADA_CHECKLIST.map(opt => (
                    <Checkbox
                      key={opt}
                      label={opt}
                      checked={playgroundAda.includes(opt)}
                      onChange={() => toggleAda(opt)}
                    />
                  ))}
                </SimpleGrid>
                {form.values.inclusive_playground && (
                  <Badge color="green">Inclusive Playground (ADA criteria met)</Badge>
                )}
              </>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Pricing & Memberships */}
      <Accordion.Item value="s17-pricing">
        <Accordion.Control><Text fw={600}>Pricing & Memberships</Text></Accordion.Control>
        <Accordion.Panel>
          <PricingMembershipsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Connections */}
      <Accordion.Item value="s18-connections">
        <Accordion.Control><Text fw={600}>Connections</Text></Accordion.Control>
        <Accordion.Panel>
          <ConnectionsSection form={form} isPark />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Community */}
      <Accordion.Item value="s19-community">
        <Accordion.Control><Text fw={600}>Community Connections</Text></Accordion.Control>
        <Accordion.Panel>
          <CommunityConnectionsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 20. Internal & Compliance */}
      <Accordion.Item value="s20-internal">
        <Accordion.Control><Text fw={600}>Internal & Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <InternalContactSection form={form} />
            <CorporateComplianceSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 21. Dynamic Attributes */}
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

      <AdminOnlyAccordionItem form={form} userRole={userRole} />
    </>
  );
}
