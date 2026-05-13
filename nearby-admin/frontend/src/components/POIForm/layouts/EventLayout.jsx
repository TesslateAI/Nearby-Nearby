import React, { useState } from 'react';
import {
  Accordion, Stack, Group, Text, Badge, TextInput, Textarea, Select,
  MultiSelect, Switch, Title, Divider, Autocomplete, Button, ActionIcon
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { CoreInformationSection } from '../sections/CoreInformationSection';
import { CategoriesSection } from '../sections/CategoriesSection';
import { LocationSection } from '../sections/LocationSection';
import { ContactSection } from '../sections/ContactSection';
import {
  EventVendorsSection, EventAmenitiesSection, EventMapsSection,
  EventVenueSection, EventStatusSection, EventCostSection
} from '../sections/EventSpecificSections';
import {
  FacilitiesSection, PublicAmenitiesSection
} from '../sections/FacilitiesSection';
import { PetPolicySection } from '../sections/OutdoorFeaturesSection';
import {
  InternalContactSection, CommunityConnectionsSection, CorporateComplianceSection
} from '../sections/MiscellaneousSections';
import DynamicAttributeForm from '../../DynamicAttributeForm';

import ServiceAnimalAlert from '../components/ServiceAnimalAlert';
import { VenueSelector } from '../components/VenueSelector';
import {
  AdminOnlyAccordionItem, IdealForGrouped, ArrivalMethodsGroup, What3WordsInput,
  AccessibleParkingChecklist, AccessibleRestroomChecklist, FullAmenitiesBlock,
  ConnectivityRow, AlcoholAvailableSelect
} from './_shared';
import { SPONSOR_LEVEL_OPTIONS } from '../../../utils/constants';
import { api } from '../../../utils/api';

const DT_FORMAT = 'MMM D, YYYY hh:mm A';

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
  const sponsorSearch = useOrganizerSearch();

  const ticket_links = form.values.event?.ticket_links || [];
  const sponsors = form.values.event?.sponsors || [];

  const addTicket = () =>
    form.setFieldValue('event.ticket_links', [...ticket_links, { platform: '', url: '' }]);
  const removeTicket = (i) =>
    form.setFieldValue('event.ticket_links', ticket_links.filter((_, idx) => idx !== i));

  const addSponsor = () =>
    form.setFieldValue('event.sponsors', [...sponsors, { tier: '', poi_id: null, name: '', logo_url: '', website: '' }]);
  const removeSponsor = (i) =>
    form.setFieldValue('event.sponsors', sponsors.filter((_, idx) => idx !== i));

  return (
    <>
      {/* 1. Event Identity */}
      <Accordion.Item value="s1-identity">
        <Accordion.Control>
          <Group><Text fw={600}>Event Identity</Text><Badge size="sm" variant="light">Required</Badge></Group>
        </Accordion.Control>
        <Accordion.Panel>
          <CoreInformationSection form={form} isEvent id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 2. Date & Time — 12-hour AM/PM DateTimePicker */}
      <Accordion.Item value="s2-datetime">
        <Accordion.Control><Text fw={600}>Date & Time</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <DateTimePicker
              label="Start"
              required
              valueFormat={DT_FORMAT}
              popoverProps={{ withinPortal: true }}
              value={form.values.event?.start_datetime ? new Date(form.values.event.start_datetime) : null}
              onChange={(v) => form.setFieldValue('event.start_datetime', v)}
            />
            <DateTimePicker
              label="End"
              valueFormat={DT_FORMAT}
              popoverProps={{ withinPortal: true }}
              value={form.values.event?.end_datetime ? new Date(form.values.event.end_datetime) : null}
              onChange={(v) => form.setFieldValue('event.end_datetime', v)}
            />
            <Switch
              label="Repeating event"
              checked={!!form.values.event?.is_repeating}
              onChange={(e) => form.setFieldValue('event.is_repeating', e.currentTarget.checked)}
            />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 3. Event Status */}
      <Accordion.Item value="s3-status">
        <Accordion.Control><Text fw={600}>Event Status</Text></Accordion.Control>
        <Accordion.Panel>
          <EventStatusSection form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 4. Categories & Ideal For */}
      <Accordion.Item value="s4-categories">
        <Accordion.Control><Text fw={600}>Categories & Ideal For</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <CategoriesSection form={form} isPaidListing isFreeListing={false} />
            <IdealForGrouped form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 5. Event Venue (TRAIL now allowed in venue search) */}
      <Accordion.Item value="s5-venue">
        <Accordion.Control><Text fw={600}>Event Venue</Text></Accordion.Control>
        <Accordion.Panel>
          <VenueSelector form={form} poiId={poiId} types={['BUSINESS', 'PARK', 'TRAIL']} />
          <Divider my="sm" />
          <EventVenueSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 6. Location & Arrival */}
      <Accordion.Item value="s6-location">
        <Accordion.Control><Text fw={600}>Location & Arrival</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <LocationSection form={form} isEvent id={poiId} />
            <ArrivalMethodsGroup form={form} />
            <What3WordsInput form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 7. Parking & Accessibility */}
      <Accordion.Item value="s7-parking">
        <Accordion.Control><Text fw={600}>Parking & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <AccessibleParkingChecklist form={form} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 8. Organizer (with POI link + prefill) */}
      <Accordion.Item value="s8-organizer">
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

      {/* 9. Cost & Ticketing — ticket_links repeatable */}
      <Accordion.Item value="s9-cost">
        <Accordion.Control><Text fw={600}>Cost & Ticketing</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <EventCostSection form={form} />
            <Divider label="Ticket Links" />
            {ticket_links.map((tl, idx) => (
              <Group key={idx} align="flex-end" wrap="nowrap">
                <TextInput
                  label="Platform"
                  style={{ flex: 1 }}
                  value={tl.platform || ''}
                  onChange={(e) => form.setFieldValue(`event.ticket_links.${idx}.platform`, e.currentTarget.value)}
                />
                <TextInput
                  label="URL"
                  style={{ flex: 2 }}
                  value={tl.url || ''}
                  onChange={(e) => form.setFieldValue(`event.ticket_links.${idx}.url`, e.currentTarget.value)}
                />
                <ActionIcon variant="light" color="red" onClick={() => removeTicket(idx)} aria-label="Remove">
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button leftSection={<IconPlus size={14} />} variant="light" onClick={addTicket}>
              Add Ticket Link
            </Button>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 10. Sponsors — Tiers (plural) with POI link + prefill */}
      <Accordion.Item value="s10-sponsors">
        <Accordion.Control><Text fw={600}>Sponsors — Tiers</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            {sponsors.map((s, idx) => (
              <Stack key={idx} p="sm" style={{ border: '1px solid #eee', borderRadius: 6 }}>
                <Group align="flex-end" wrap="nowrap">
                  <Select
                    label="Tier"
                    style={{ flex: 1 }}
                    data={SPONSOR_LEVEL_OPTIONS}
                    value={s.tier}
                    onChange={(v) => form.setFieldValue(`event.sponsors.${idx}.tier`, v)}
                    clearable
                  />
                  <ActionIcon variant="light" color="red" onClick={() => removeSponsor(idx)} aria-label="Remove">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
                <Autocomplete
                  label="Link sponsor to existing POI"
                  placeholder="Search…"
                  data={sponsorSearch.options}
                  onChange={(val) => {
                    sponsorSearch.search(val);
                    form.setFieldValue(`event.sponsors.${idx}.name`, val);
                  }}
                  onOptionSubmit={(val) => {
                    const poi = sponsorSearch.byId[val];
                    if (!poi) return;
                    form.setFieldValue(`event.sponsors.${idx}.poi_id`, poi.id);
                    form.setFieldValue(`event.sponsors.${idx}.name`, poi.name || '');
                    if (poi.logo_url) form.setFieldValue(`event.sponsors.${idx}.logo_url`, poi.logo_url);
                    if (poi.website_url) form.setFieldValue(`event.sponsors.${idx}.website`, poi.website_url);
                  }}
                />
                <TextInput label="Name" value={s.name || ''}
                  onChange={(e) => form.setFieldValue(`event.sponsors.${idx}.name`, e.currentTarget.value)} />
                <TextInput label="Logo URL" value={s.logo_url || ''}
                  onChange={(e) => form.setFieldValue(`event.sponsors.${idx}.logo_url`, e.currentTarget.value)} />
                <TextInput label="Website" value={s.website || ''}
                  onChange={(e) => form.setFieldValue(`event.sponsors.${idx}.website`, e.currentTarget.value)} />
              </Stack>
            ))}
            <Button leftSection={<IconPlus size={14} />} variant="light" onClick={addSponsor}>
              Add Sponsor Tier
            </Button>
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 11. Vendors */}
      <Accordion.Item value="s11-vendors">
        <Accordion.Control><Text fw={600}>Vendors</Text></Accordion.Control>
        <Accordion.Panel>
          <EventVendorsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 12. Event Amenities */}
      <Accordion.Item value="s12-amenities">
        <Accordion.Control><Text fw={600}>Event Amenities</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <EventAmenitiesSection form={form} id={poiId} />
            <FullAmenitiesBlock form={form} />
            <ConnectivityRow form={form} />
            <AlcoholAvailableSelect form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 13. Event Maps */}
      <Accordion.Item value="s13-maps">
        <Accordion.Control><Text fw={600}>Event Maps</Text></Accordion.Control>
        <Accordion.Panel>
          <EventMapsSection form={form} id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 14. Public Restrooms */}
      <Accordion.Item value="s14-restrooms">
        <Accordion.Control><Text fw={600}>Public Restrooms</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PublicAmenitiesSection form={form} isEvent id={poiId} />
            <AccessibleRestroomChecklist form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 15. Facilities & Accessibility */}
      <Accordion.Item value="s15-facilities">
        <Accordion.Control><Text fw={600}>Facilities & Accessibility</Text></Accordion.Control>
        <Accordion.Panel>
          <FacilitiesSection form={form} isEvent id={poiId} />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 16. Pet Policy */}
      <Accordion.Item value="s16-pets">
        <Accordion.Control><Text fw={600}>Pet Policy</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <PetPolicySection form={form} />
            <ServiceAnimalAlert />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 17. Contact & Social Media */}
      <Accordion.Item value="s17-contact">
        <Accordion.Control><Text fw={600}>Contact & Social Media</Text></Accordion.Control>
        <Accordion.Panel>
          <ContactSection form={form} isEvent />
        </Accordion.Panel>
      </Accordion.Item>

      {/* 18. Internal & Compliance */}
      <Accordion.Item value="s18-internal">
        <Accordion.Control><Text fw={600}>Internal & Compliance</Text></Accordion.Control>
        <Accordion.Panel>
          <Stack>
            <InternalContactSection form={form} />
            <CommunityConnectionsSection form={form} />
            <CorporateComplianceSection form={form} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>

      {/* 19. Dynamic Attributes */}
      <Accordion.Item value="s19-attrs">
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
