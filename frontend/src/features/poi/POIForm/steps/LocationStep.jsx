import { TextInput, SimpleGrid, Stack, Box, Text } from '@mantine/core';
import { MapContainer, TileLayer } from 'react-leaflet';
import { ChangeView, DraggableMarker } from '../../../../components/maps/MapComponents';

function LocationStep({ form }) {
  const currentPosition = [form.values.latitude, form.values.longitude];

  return (
    <Stack mt="xl" p="md">
      <Text size="sm" c="dimmed" mb="xs">
        Click on the map or drag the marker to set the location (required)
      </Text>
      <Box style={{ height: '300px', width: '100%' }} mb="md">
        <MapContainer center={currentPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
          <ChangeView center={currentPosition} zoom={13} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <DraggableMarker 
            position={currentPosition} 
            onPositionChange={(latlng) => {
              form.setFieldValue('latitude', latlng.lat);
              form.setFieldValue('longitude', latlng.lng);
            }} 
          />
        </MapContainer>
      </Box>

      <SimpleGrid cols={2}>
        <TextInput label="Street Address" {...form.getInputProps('address_street')} />
        <TextInput label="City" {...form.getInputProps('address_city')} />
      </SimpleGrid>
      <SimpleGrid cols={3}>
        <TextInput label="State" {...form.getInputProps('address_state')} />
        <TextInput label="ZIP Code" {...form.getInputProps('address_zip')} />
        <TextInput label="Full Address" {...form.getInputProps('address_full')} />
      </SimpleGrid>
      <SimpleGrid cols={2}>
        <TextInput 
          withAsterisk 
          label="Latitude" 
          type="number" 
          step="any" 
          {...form.getInputProps('latitude')} 
        />
        <TextInput 
          withAsterisk 
          label="Longitude" 
          type="number" 
          step="any" 
          {...form.getInputProps('longitude')} 
        />
      </SimpleGrid>
    </Stack>
  );
}

export default LocationStep;