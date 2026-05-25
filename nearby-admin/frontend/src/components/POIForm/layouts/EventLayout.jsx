import React, { useState } from 'react';
import {
  Accordion, Stack, Group, Text, Badge, TextInput, Divider,
  Autocomplete
} from '@mantine/core';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import RecurringEventSection from '../sections/RecurringEventSection';
import {
  EventVendorsSection, EventMapsSection,
  EventVenueSection, EventStatusSection, EventCostSection,
  EventSponsorsSection,
} from '../sections/EventSpecificSections';
import {
  FacilitiesSection, PublicAmenitiesSection, RentalsSection, PlaygroundsSection
} from '../sections/FacilitiesSection';
import { PetPolicySection } from '../sections/OutdoorFeaturesSection';
import {
  InternalContactSection, CommunityConnectionsSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import DynamicAttributeForm from '../../DynamicAttributeForm';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import AlcoholAccordionItem from '../components/AlcoholAccordionItem';
import {
  AdminOnlyAccordionItem, IdealForGrouped, ArrivalMethodsGroup, What3WordsInput,
  AccessibleParkingChecklist, FullAmenitiesBlock,
  ConnectivityRow
} from './_shared';
import { api } from '../../../utils/api';

function useOrganizerSearch() {
  const [options, setOptions] = useState([]);
  const [byId, setById] = useState({});
  const search = async (q) => {
    if (!q || q.length < 2) { setOptions([]); return; }
    try {
      const resp = await api.get(`/pois/search?q=${encodeURIComponent(q)}&types=BUSINESS&types=PARK&types=TRAIL&publication_status=published`);
      if (resp.ok) {
        const data = await resp.json();
        const list = Array.isArray(data) ? data : (data.results || data.items || []);
        setOptions(list.map(x => x.name));
        const m = {};
        list.forEach(x => { m[x.name] = x; });
        setById(m);
      }
    } catch (e) { /* ignore */ }
  };
  return { options, byId, search };
}

export default function EventLayout({ form, userRole, poiId }) {
  const organizerSearch = useOrganizerSearch();

  return (
    <>
      {/* 1. Event Identity — absorbs status_message + contact intro */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Event Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <CoreInformationSection form={form} isEvent id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Categories + Discovery (Ideal For 5-group) */}
      <Accordion.Item value="s2-categories">
        <Accordion.Control><Text fw={600}>Categories & Discovery</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isPaidListing isFreeListing={false} />
            <Divider my="sm" />
            <IdealForGrouped form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Event Details — MEGA-CONSOLIDATION of datetime + status + venue */}
      <Accordion.Item value="s3-event-details">
        <Accordion.Control>
          <Group><Text fw={600}>Event Details</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <RecurringEventSection form={form} />
            <Divider my="sm" />
            <EventStatusSection form={form} />
            <Divider my="sm" />
            <EventVenueSection form={form} id={poiId} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Venue Details — additional event_venue setup (placeholder for future fields) */}
      <Accordion.Item value="s4-venue-details">
        <Accordion.Control><Text fw={600}>Venue Details</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Text size="sm" c="dimmed">
              Additional venue configuration is handled through the venue selector above.
              Use this section to capture event-specific overrides (capacity, indoor/outdoor flag,
              venue address) once those fields are wired up.
            </Text>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Location & Arrival */}
      <Accordion.Item value="s5-location">
        <Accordion.Control><Text fw={600}>Location & Arrival</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isEvent id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Parking & Accessibility */}
      <Accordion.Item value="s6-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Text size="sm" c="dimmed">
              Parking locations are managed in the Location & Arrival section.
              Use this section for ADA accessible parking details.
            </Text>
            <AccessibleParkingChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Event Organizer */}
      <Accordion.Item value="s7-organizer">
        <Accordion.Control><Text fw={600}>Event Organizer</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <Autocomplete
              label="Link organizer to existing POI"
              placeholder="Search businesses, parks, or trails…"
              data={organizerSearch.options}
              onChange={organizerSearch.search}
              onOptionSubmit={(val) => {
                const poi = organizerSearch.byId[val];
                if (!poi) return;
                form.setFieldValue('event.organizer_poi_id', poi.id);
                form.setFieldValue('event.organizer_name', poi.name || '');
                if (poi.email) form.setFieldValue('event.organizer_email', poi.email);
                if (poi.phone_number) form.setFieldValue('event.organizer_phone', poi.phone_number);
                if (poi.website_url) form.setFieldValue('event.organizer_website', poi.website_url);
              }}
            />
            <TextInput label="Organizer Name" {...form.getInputProps('event.organizer_name')} />
            <TextInput label="Organizer Email" {...form.getInputProps('event.organizer_email')} />
            <TextInput label="Organizer Phone" {...form.getInputProps('event.organizer_phone')} />
            <TextInput label="Organizer Website" {...form.getInputProps('event.organizer_website')} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Sponsors — Tier-first via EventSponsorsSection (#51) */}
      <Accordion.Item value="s8-sponsors">
        <Accordion.Control><Text fw={600}>Sponsors</Text></Accordion.Control>
        <Accordion.Panel>
          <EventSponsorsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 9. Facilities & Amenities */}
      <Accordion.Item value="s9-amenities">
        <Accordion.Control><Text fw={600}>Facilities & Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <FullAmenitiesBlock form={form} poiType="EVENT" />
            <ConnectivityRow form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Restrooms — PublicAmenitiesSection renders the inline ADA checklist
              per Wave 3 #47. Do NOT add a standalone <AccessibleRestroomChecklist>. */}
      <Accordion.Item value="s10-restrooms">
        <Accordion.Control><Text fw={600}>Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <PublicAmenitiesSection form={form} isEvent id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. On-Site Facilities */}
      <Accordion.Item value="s11-onsite-facilities">
        <Accordion.Control><Text fw={600}>On-Site Facilities</Text></Accordion.Control>
        <Accordion.Panel>
          <FacilitiesSection form={form} isEvent id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Playground — #49 per-playground age groups + grouped ADA checklist.
              PlaygroundsSection owns its own playground_available Switch. */}
      <Accordion.Item value="s12-playground">
        <Accordion.Control><Text fw={600}>Playground</Text></Accordion.Control>
        <Accordion.Panel>
          <PlaygroundsSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Alcohol — #69 accordion with conditional sub-options
              (granular availability, BYOB, notes) when alcohol_available !== 'no'. */}
      <AlcoholAccordionItem form={form} value="s13-alcohol" />

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

      {/* 15. Cost & Ticketing */}
      <Accordion.Item value="s15-cost">
        <Accordion.Control><Text fw={600}>Cost & Ticketing</Text></Accordion.Control>
        <Accordion.Panel>
          <EventCostSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Vendors */}
      <Accordion.Item value="s16-vendors">
        <Accordion.Control><Text fw={600}>Vendors</Text></Accordion.Control>
        <Accordion.Panel>
          <EventVendorsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Contact & Social Media */}
      <Accordion.Item value="s17-contact-social">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} isFreeListing={false} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Rentals */}
      <Accordion.Item value="s18-rentals">
        <Accordion.Control><Text fw={600}>Rentals</Text></Accordion.Control>
        <Accordion.Panel>
          <RentalsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Miscellaneous — event maps + community connections (article_links, community_impact) */}
      <Accordion.Item value="s19-misc">
        <Accordion.Control><Text fw={600}>Miscellaneous</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <EventMapsSection form={form} id={poiId} />
            <Divider my="sm" />
            <CommunityConnectionsSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 20. Internal & Compliance */}
      <Accordion.Item value="s20-internal-compliance">
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
