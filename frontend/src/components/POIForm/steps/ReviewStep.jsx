import { Paper, Stack, SimpleGrid, Text, Group, Alert } from '@mantine/core';

function ReviewStep({ form, isEditing }) {
  return (
    <Paper p="xl" withBorder mt="xl" radius="md">
      <Stack spacing="lg">
        <Group>
          <Text size="xl" fw={700} c="deep-purple.7">Ready to Submit</Text>
          <Text size="sm" c="dimmed" style={{ flex: 1 }}>
            You are about to {isEditing ? 'update' : 'create'} a Point of Interest. Please review your information below.
          </Text>
        </Group>

        <SimpleGrid cols={2} spacing="lg">
          {/* Basic Information */}
          <Paper p="md" withBorder radius="sm">
            <Text size="sm" fw={600} c="blue.7" mb="xs">📋 Basic Information</Text>
            <Stack spacing="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Name:</Text>
                <Text size="sm" fw={500}>{form.values.name}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Type:</Text>
                <Text size="sm" fw={500}>{form.values.poi_type}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Status:</Text>
                <Text size="sm" fw={500}>{form.values.status}</Text>
              </Group>
              {form.values.description_short && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Summary:</Text>
                  <Text size="sm" fw={500} style={{ maxWidth: '200px' }}>{form.values.description_short}</Text>
                </Group>
              )}
              {form.values.status_message && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Status Message:</Text>
                  <Text size="sm" fw={500} style={{ maxWidth: '200px' }}>{form.values.status_message}</Text>
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Location Information */}
          <Paper p="md" withBorder radius="sm">
            <Text size="sm" fw={600} c="green.7" mb="xs">📍 Location</Text>
            <Stack spacing="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Coordinates:</Text>
                <Text size="sm" fw={500}>{form.values.latitude.toFixed(6)}, {form.values.longitude.toFixed(6)}</Text>
              </Group>
              {form.values.address_street && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Street:</Text>
                  <Text size="sm" fw={500}>{form.values.address_street}</Text>
                </Group>
              )}
              {form.values.address_city && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">City:</Text>
                  <Text size="sm" fw={500}>{form.values.address_city}, {form.values.address_state}</Text>
                </Group>
              )}
              {form.values.address_zip && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">ZIP:</Text>
                  <Text size="sm" fw={500}>{form.values.address_zip}</Text>
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Contact Information */}
          <Paper p="md" withBorder radius="sm">
            <Text size="sm" fw={600} c="orange.7" mb="xs">📞 Contact</Text>
            <Stack spacing="xs">
              {form.values.website_url && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Website:</Text>
                  <Text size="sm" fw={500} style={{ maxWidth: '150px' }}>{form.values.website_url}</Text>
                </Group>
              )}
              {form.values.phone_number && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Phone:</Text>
                  <Text size="sm" fw={500}>{form.values.phone_number}</Text>
                </Group>
              )}
              {form.values.email && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Email:</Text>
                  <Text size="sm" fw={500}>{form.values.email}</Text>
                </Group>
              )}
            </Stack>
          </Paper>

          {/* Categories & Type-Specific */}
          <Paper p="md" withBorder radius="sm">
            <Text size="sm" fw={600} c="purple.7" mb="xs">🏷️ Categories & Details</Text>
            <Stack spacing="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Categories:</Text>
                <Text size="sm" fw={500}>{form.values.category_ids.length} selected</Text>
              </Group>
              {form.values.poi_type === 'BUSINESS' && form.values.business && (
                <>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Listing Tier:</Text>
                    <Text size="sm" fw={500}>{form.values.business.listing_tier}</Text>
                  </Group>
                  {form.values.business.price_range && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Price Range:</Text>
                      <Text size="sm" fw={500}>{form.values.business.price_range}</Text>
                    </Group>
                  )}
                </>
              )}
              {form.values.poi_type === 'EVENT' && form.values.event && (
                <>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Start Date:</Text>
                    <Text size="sm" fw={500}>{form.values.event.start_datetime}</Text>
                  </Group>
                  {form.values.event.end_datetime && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">End Date:</Text>
                      <Text size="sm" fw={500}>{form.values.event.end_datetime}</Text>
                    </Group>
                  )}
                  {form.values.event.cost_text && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Cost:</Text>
                      <Text size="sm" fw={500}>{form.values.event.cost_text}</Text>
                    </Group>
                  )}
                </>
              )}
              {form.values.poi_type === 'TRAIL' && form.values.trail && (
                <>
                  {form.values.trail.length_text && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Length:</Text>
                      <Text size="sm" fw={500}>{form.values.trail.length_text}</Text>
                    </Group>
                  )}
                  {form.values.trail.difficulty && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Difficulty:</Text>
                      <Text size="sm" fw={500}>{form.values.trail.difficulty}</Text>
                    </Group>
                  )}
                  {form.values.trail.route_type && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Route Type:</Text>
                      <Text size="sm" fw={500}>{form.values.trail.route_type}</Text>
                    </Group>
                  )}
                </>
              )}
              {form.values.poi_type === 'PARK' && form.values.park && (
                <>
                  {form.values.park.drone_usage_policy && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Drone Policy:</Text>
                      <Text size="sm" fw={500}>{form.values.park.drone_usage_policy}</Text>
                    </Group>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Additional Information */}
        {(form.values.description_long || form.values.photos?.featured) && (
          <Paper p="md" withBorder radius="sm">
            <Text size="sm" fw={600} c="teal.7" mb="xs">📝 Additional Information</Text>
            <Stack spacing="xs">
              {form.values.description_long && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Full Description:</Text>
                  <Text size="sm" fw={500} style={{ maxWidth: '300px' }}>{form.values.description_long}</Text>
                </Group>
              )}
              {form.values.photos?.featured && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Featured Photo:</Text>
                  <Text size="sm" fw={500} style={{ maxWidth: '200px' }}>{form.values.photos.featured}</Text>
                </Group>
              )}
            </Stack>
          </Paper>
        )}

        {/* Compliance and Emergency Information */}
        <Paper p="md" withBorder radius="sm">
          <Text size="sm" fw={600} c="violet.7" mb="xs">📋 Compliance & Emergency Info</Text>
          <Stack spacing="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Compliance Requirements:</Text>
              <Text size="sm" fw={500}>
                {form.values.corporate_compliance?.has_compliance_requirements ? "✓ Yes" : "✗ No"}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Comments Restricted:</Text>
              <Text size="sm" fw={500}>
                {form.values.corporate_compliance?.disable_comments ? "✓ Yes" : "✗ No"}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Pre-approval Required:</Text>
              <Text size="sm" fw={500}>
                {form.values.corporate_compliance?.pre_approval_required ? "✓ Yes" : "✗ No"}
              </Text>
            </Group>
            {form.values.main_emergency_contact?.name && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Emergency Contact:</Text>
                <Text size="sm" fw={500}>{form.values.main_emergency_contact.name}</Text>
              </Group>
            )}
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Public Toilets:</Text>
              <Text size="sm" fw={500}>
                {form.values.public_toilets?.available ? "✓ Available" : "✗ Not Available"}
              </Text>
            </Group>
            {form.values.corporate_compliance?.social_media_restrictions?.length > 0 && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Social Media Restrictions:</Text>
                <Text size="sm" fw={500}>{form.values.corporate_compliance.social_media_restrictions.length} platforms</Text>
              </Group>
            )}
          </Stack>
        </Paper>

        {/* Flags and Verification */}
        <Paper p="md" withBorder radius="sm" bg="gray.0">
          <Text size="sm" fw={600} c="red.7" mb="xs">🏁 Flags & Verification</Text>
          <Group>
            <Group gap="xs">
              <Text size="sm" c="dimmed">Verified:</Text>
              <Text size="sm" fw={500}>
                {form.values.is_verified ? "✓ Yes" : "✗ No"}
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" c="dimmed">Disaster Hub:</Text>
              <Text size="sm" fw={500}>
                {form.values.is_disaster_hub ? "✓ Yes" : "✗ No"}
              </Text>
            </Group>
          </Group>
        </Paper>

        <Alert color="blue" variant="light" mt="md">
          <Text size="sm">
            <strong>Tip:</strong> After saving this POI, you can manage relationships with other POIs 
            from the main POI list using the link icon (🔗) in the actions column.
          </Text>
        </Alert>

      </Stack>
    </Paper>
  );
}

export default ReviewStep;