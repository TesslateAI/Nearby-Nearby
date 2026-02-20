import React, { useState, useEffect } from 'react';
import {
  Stack, Select, Button, Card, Text, Group, Badge, Alert,
  Loader, Divider, Checkbox, SimpleGrid
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBuilding, IconTree, IconCopy, IconCheck } from '@tabler/icons-react';
import { api } from '../../../utils/api';

/**
 * VenueSelector component for selecting a venue (BUSINESS or PARK)
 * and copying venue data to an event.
 */
export function VenueSelector({ form, poiId }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [venueLoading, setVenueLoading] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [venueData, setVenueData] = useState(null);
  const [copying, setCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyOptions, setCopyOptions] = useState({
    address: true,
    contact: true,
    parking: true,
    accessibility: true,
    restrooms: true,
    hours: true,
    amenities: true,
    images: true
  });

  // Fetch available venues on mount
  useEffect(() => {
    const fetchVenues = async () => {
      setLoading(true);
      try {
        const response = await api.get('/pois/venues/list');
        if (response.ok) {
          const data = await response.json();
          setVenues(data);
        }
      } catch (error) {
        console.error('Failed to fetch venues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  // Fetch venue data when a venue is selected
  const handleVenueSelect = async (venueId) => {
    setSelectedVenueId(venueId);
    setVenueData(null);
    setCopySuccess(false);

    if (!venueId) return;

    setVenueLoading(true);
    try {
      const response = await api.get(`/pois/${venueId}/venue-data`);
      if (response.ok) {
        const data = await response.json();
        setVenueData(data);
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch venue data',
          color: 'red'
        });
      }
    } catch (error) {
      console.error('Failed to fetch venue data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch venue data',
        color: 'red'
      });
    } finally {
      setVenueLoading(false);
    }
  };

  // Copy venue data to event form
  const handleCopyVenueData = async () => {
    if (!venueData) return;

    setCopying(true);
    try {
      // Copy address fields
      if (copyOptions.address) {
        form.setFieldValue('address_full', venueData.address_full || '');
        form.setFieldValue('address_street', venueData.address_street || '');
        form.setFieldValue('address_city', venueData.address_city || '');
        form.setFieldValue('address_state', venueData.address_state || '');
        form.setFieldValue('address_zip', venueData.address_zip || '');
        form.setFieldValue('address_county', venueData.address_county || '');

        // Copy location coordinates
        if (venueData.location?.coordinates) {
          form.setFieldValue('longitude', venueData.location.coordinates[0]);
          form.setFieldValue('latitude', venueData.location.coordinates[1]);
        }
        if (venueData.front_door_latitude) {
          form.setFieldValue('front_door_latitude', venueData.front_door_latitude);
        }
        if (venueData.front_door_longitude) {
          form.setFieldValue('front_door_longitude', venueData.front_door_longitude);
        }
      }

      // Copy contact fields
      if (copyOptions.contact) {
        if (venueData.phone_number) form.setFieldValue('phone_number', venueData.phone_number);
        if (venueData.email) form.setFieldValue('email', venueData.email);
        if (venueData.website_url) form.setFieldValue('website_url', venueData.website_url);
      }

      // Copy parking fields
      if (copyOptions.parking) {
        if (venueData.parking_types) form.setFieldValue('parking_types', venueData.parking_types);
        if (venueData.parking_notes) form.setFieldValue('parking_notes', venueData.parking_notes);
        if (venueData.parking_locations) form.setFieldValue('parking_locations', venueData.parking_locations);
        if (venueData.expect_to_pay_parking) form.setFieldValue('expect_to_pay_parking', venueData.expect_to_pay_parking);
        if (venueData.public_transit_info) form.setFieldValue('public_transit_info', venueData.public_transit_info);
      }

      // Copy accessibility fields
      if (copyOptions.accessibility) {
        if (venueData.wheelchair_accessible) form.setFieldValue('wheelchair_accessible', venueData.wheelchair_accessible);
        if (venueData.wheelchair_details) form.setFieldValue('wheelchair_details', venueData.wheelchair_details);
      }

      // Copy restroom fields
      if (copyOptions.restrooms) {
        if (venueData.public_toilets) form.setFieldValue('public_toilets', venueData.public_toilets);
        if (venueData.toilet_description) form.setFieldValue('toilet_description', venueData.toilet_description);
        if (venueData.toilet_locations) form.setFieldValue('toilet_locations', venueData.toilet_locations);
      }

      // Copy hours (store in event.venue_hours)
      if (copyOptions.hours && venueData.hours) {
        form.setFieldValue('event.venue_hours', venueData.hours);
      }

      // Copy amenities
      if (copyOptions.amenities && venueData.amenities) {
        form.setFieldValue('amenities', venueData.amenities);
      }

      // Copy images if there are copyable images and the option is enabled
      if (copyOptions.images && venueData.copyable_images?.length > 0 && poiId) {
        const imageTypes = venueData.copyable_images.map(img => img.image_type);
        const uniqueTypes = [...new Set(imageTypes)];

        try {
          const response = await api.request(`/images/copy/${venueData.venue_id}/to/${poiId}?${uniqueTypes.map(t => `image_types=${t}`).join('&')}`, {
            method: 'POST'
          });

          if (response.ok) {
            const result = await response.json();
            notifications.show({
              title: 'Images Copied',
              message: `${result.successful_uploads?.length || 0} images copied from venue`,
              color: 'green'
            });
          }
        } catch (imgError) {
          console.error('Failed to copy images:', imgError);
          notifications.show({
            title: 'Warning',
            message: 'Venue data copied but images could not be copied',
            color: 'yellow'
          });
        }
      }

      // Store venue reference
      form.setFieldValue('event.venue_poi_id', venueData.venue_id);
      form.setFieldValue('event.venue_name', venueData.venue_name);
      form.setFieldValue('event.venue_type', venueData.venue_type);

      setCopySuccess(true);
      notifications.show({
        title: 'Venue Data Copied',
        message: `Data from "${venueData.venue_name}" has been copied to the event`,
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to copy venue data:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to copy venue data',
        color: 'red'
      });
    } finally {
      setCopying(false);
    }
  };

  // Format venues for Select component — use Mantine v8 grouped format
  const venueOptions = Object.entries(
    venues.reduce((groups, venue) => {
      const group = venue.poi_type || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push({ value: venue.id, label: venue.name });
      return groups;
    }, {})
  ).map(([group, items]) => ({ group, items }));

  return (
    <Stack>
      <Alert color="blue" variant="light" mb="md">
        <Text size="sm">
          Select a venue (Business or Park) to copy its location, parking, accessibility,
          and restroom information to this event. This is a one-time copy - changes to the
          venue will not automatically update the event.
        </Text>
      </Alert>

      <Select
        label="Select Venue"
        placeholder={loading ? 'Loading venues...' : 'Search for a venue...'}
        data={venueOptions}
        value={selectedVenueId}
        onChange={handleVenueSelect}
        searchable
        clearable
        leftSection={loading ? <Loader size="xs" /> : null}
        disabled={loading}
        renderOption={({ option }) => {
          const isBusiness = option.label?.includes('BUSINESS') || venues.find(v => v.id === option.value)?.poi_type === 'BUSINESS';
          return (
            <Group gap="sm">
              {isBusiness ? (
                <IconBuilding size={16} style={{ color: '#6366f1' }} />
              ) : (
                <IconTree size={16} style={{ color: '#22c55e' }} />
              )}
              <span>{option.label}</span>
            </Group>
          );
        }}
      />

      {venueLoading && (
        <Card withBorder p="md">
          <Group justify="center">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Loading venue data...</Text>
          </Group>
        </Card>
      )}

      {venueData && !venueLoading && (
        <Card withBorder p="md">
          <Stack>
            <Group justify="space-between">
              <Group gap="sm">
                {venueData.venue_type === 'BUSINESS' ? (
                  <IconBuilding size={20} style={{ color: '#6366f1' }} />
                ) : (
                  <IconTree size={20} style={{ color: '#22c55e' }} />
                )}
                <Text fw={600}>{venueData.venue_name}</Text>
                <Badge color={venueData.venue_type === 'BUSINESS' ? 'indigo' : 'green'} size="sm">
                  {venueData.venue_type}
                </Badge>
              </Group>
            </Group>

            {venueData.address_full && (
              <Text size="sm" c="dimmed">{venueData.address_full}</Text>
            )}

            <Divider my="sm" label="Data to Copy" />

            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <Checkbox
                label="Address & Location"
                checked={copyOptions.address}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, address: e.target.checked }))}
              />
              <Checkbox
                label="Contact Info"
                checked={copyOptions.contact}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, contact: e.target.checked }))}
              />
              <Checkbox
                label="Parking"
                checked={copyOptions.parking}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, parking: e.target.checked }))}
              />
              <Checkbox
                label="Accessibility"
                checked={copyOptions.accessibility}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, accessibility: e.target.checked }))}
              />
              <Checkbox
                label="Restrooms"
                checked={copyOptions.restrooms}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, restrooms: e.target.checked }))}
              />
              <Checkbox
                label="Hours"
                checked={copyOptions.hours}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, hours: e.target.checked }))}
              />
              <Checkbox
                label="Amenities"
                checked={copyOptions.amenities}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, amenities: e.target.checked }))}
              />
              <Checkbox
                label="Photos (Entry, Parking, Restroom)"
                checked={copyOptions.images}
                onChange={(e) => setCopyOptions(prev => ({ ...prev, images: e.target.checked }))}
                disabled={!venueData.copyable_images?.length}
              />
            </SimpleGrid>

            {venueData.copyable_images?.length > 0 && (
              <Text size="xs" c="dimmed">
                {venueData.copyable_images.length} photo(s) available to copy
              </Text>
            )}

            <Button
              onClick={handleCopyVenueData}
              loading={copying}
              leftSection={copySuccess ? <IconCheck size={16} /> : <IconCopy size={16} />}
              color={copySuccess ? 'green' : 'blue'}
              mt="md"
            >
              {copying ? 'Copying...' : copySuccess ? 'Data Copied!' : 'Copy Data to Event'}
            </Button>

            {copySuccess && (
              <Alert color="green" variant="light">
                <Text size="sm">
                  Venue data has been copied. You can now review and modify the copied
                  information in the relevant form sections.
                </Text>
              </Alert>
            )}
          </Stack>
        </Card>
      )}

      {/* Show current venue link if set */}
      {form.values.event?.venue_poi_id && !selectedVenueId && (
        <Card withBorder p="md" bg="gray.0">
          <Group gap="sm">
            <Text size="sm" c="dimmed">Current venue:</Text>
            <Text size="sm" fw={500}>{form.values.event.venue_name || 'Unknown venue'}</Text>
            <Badge size="xs">{form.values.event.venue_type}</Badge>
          </Group>
        </Card>
      )}
    </Stack>
  );
}

export default VenueSelector;
