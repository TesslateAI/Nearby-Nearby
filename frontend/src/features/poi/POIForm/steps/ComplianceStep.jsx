import { 
  TextInput, Textarea, SimpleGrid, Stack, Divider, Text, 
  Checkbox, Radio, Group, Button, Paper 
} from '@mantine/core';
import { SOCIAL_MEDIA_PLATFORMS, TOILET_TYPES } from '../constants';

function ComplianceStep({ form }) {
  return (
    <Stack mt="xl" p="md">
      
      <Divider my="md" label="Corporate Compliance (For ALL POIs)" />
      
      <Checkbox
        label="Do you have any corporate compliance requirements we should be aware of? (e.g., required disclaimers, phrasing, or placement restrictions)"
        {...form.getInputProps('corporate_compliance.has_compliance_requirements', { type: 'checkbox' })}
      />
      
      {form.values.corporate_compliance?.has_compliance_requirements && (
        <Textarea
          label="Please describe your compliance requirements"
          placeholder="Describe any required disclaimers, phrasing, or placement restrictions"
          {...form.getInputProps('corporate_compliance.compliance_description')}
          minRows={3}
        />
      )}

      <Divider my="md" label="Comments & Community Tips" />
      
      <Radio.Group
        label="Are there any restrictions on public comments or community tips being shown on your listing?"
        value={form.values.corporate_compliance?.disable_comments ? 'true' : 'false'}
        onChange={(value) => form.setFieldValue('corporate_compliance.disable_comments', value === 'true')}
      >
        <Group mt="xs">
          <Radio value="false" label="No" />
          <Radio value="true" label="Yes" />
        </Group>
      </Radio.Group>

      {form.values.corporate_compliance?.disable_comments && (
        <Textarea
          label="If yes, please explain. Would disabling the comments section on your listing satisfy requirements?"
          placeholder="Please explain your comment restrictions and if disabling comments would satisfy your requirements"
          {...form.getInputProps('corporate_compliance.comments_restriction_reason')}
          minRows={3}
        />
      )}

      <Divider my="md" label="Social Media Restrictions" />
      
      <Checkbox.Group
        label="Are there any social media platforms where your event cannot be mentioned or tagged?"
        {...form.getInputProps('corporate_compliance.social_media_restrictions')}
      >
        <Stack mt="xs">
          {SOCIAL_MEDIA_PLATFORMS.map(platform => (
            <Checkbox key={platform.value} value={platform.value} label={platform.label} />
          ))}
        </Stack>
      </Checkbox.Group>

      <TextInput
        label="Other social media restrictions"
        placeholder="Please specify any other social media platforms or restrictions"
        {...form.getInputProps('corporate_compliance.other_social_media')}
      />

      <Divider my="md" label="Pre-approval Requirements" />
      
      <Radio.Group
        label="Do you require pre-approval before we feature or promote your location in any posts, newsletters, or other materials?"
        value={form.values.corporate_compliance?.pre_approval_required ? 'true' : 'false'}
        onChange={(value) => form.setFieldValue('corporate_compliance.pre_approval_required', value === 'true')}
      >
        <Group mt="xs">
          <Radio value="false" label="No" />
          <Radio value="true" label="Yes" />
        </Group>
      </Radio.Group>

      {form.values.corporate_compliance?.pre_approval_required && (
        <Stack>
          <TextInput
            label="How long of a lead time do you need?"
            placeholder="e.g., 5 business days, 1 week"
            {...form.getInputProps('corporate_compliance.approval_lead_time')}
          />
          <SimpleGrid cols={1}>
            <TextInput
              label="Contact Name for Approval Submissions"
              placeholder="Name of person to contact"
              {...form.getInputProps('corporate_compliance.approval_contact_name')}
            />
          </SimpleGrid>
          <SimpleGrid cols={2}>
            <TextInput
              label="Contact Email"
              type="email"
              placeholder="email@example.com"
              {...form.getInputProps('corporate_compliance.approval_contact_email')}
            />
            <TextInput
              label="Contact Phone"
              placeholder="Phone number"
              {...form.getInputProps('corporate_compliance.approval_contact_phone')}
            />
          </SimpleGrid>
        </Stack>
      )}

      <Divider my="md" label="Branding Requirements" />
      
      <Radio.Group
        label="Is there any language or branding you are required to use (or avoid) when referring to your location?"
        value={form.values.corporate_compliance?.has_branding_requirements ? 'true' : 'false'}
        onChange={(value) => form.setFieldValue('corporate_compliance.has_branding_requirements', value === 'true')}
      >
        <Group mt="xs">
          <Radio value="false" label="No" />
          <Radio value="true" label="Yes" />
        </Group>
      </Radio.Group>

      {form.values.corporate_compliance?.has_branding_requirements && (
        <Textarea
          label="Please describe or attach brand guidelines"
          placeholder="Describe required language, branding, or provide link to brand guidelines"
          {...form.getInputProps('corporate_compliance.branding_description')}
          minRows={3}
        />
      )}

      <Divider my="md" label="Main and Emergency Contacts (All POIs)" />
      <Text size="sm" c="dimmed" mb="md">
        We need contact info that&apos;s not public for best contact when it comes to problems and for us to reach out to someone
      </Text>
      
      <SimpleGrid cols={1}>
        <TextInput
          label="Contact Name"
          placeholder="Main contact person name"
          {...form.getInputProps('main_emergency_contact.name')}
        />
      </SimpleGrid>
      <SimpleGrid cols={2}>
        <TextInput
          label="Contact Email"
          type="email"
          placeholder="contact@example.com"
          {...form.getInputProps('main_emergency_contact.email')}
        />
        <TextInput
          label="Contact Phone"
          placeholder="Phone number"
          {...form.getInputProps('main_emergency_contact.phone')}
        />
      </SimpleGrid>

      <Divider my="md" label="Public Toilets (All POIs)" />
      
      <Radio.Group
        label="Public Toilets Available?"
        value={form.values.public_toilets?.available ? 'true' : 'false'}
        onChange={(value) => form.setFieldValue('public_toilets.available', value === 'true')}
      >
        <Group mt="xs">
          <Radio value="false" label="No" />
          <Radio value="true" label="Yes" />
        </Group>
      </Radio.Group>

      {form.values.public_toilets?.available && (
        <Stack>
          <Checkbox.Group
            label="Toilet Types (check all that apply)"
            {...form.getInputProps('public_toilets.types')}
          >
            <Stack mt="xs">
              {TOILET_TYPES.map(type => (
                <Checkbox key={type.value} value={type.value} label={type.label} />
              ))}
            </Stack>
          </Checkbox.Group>

          <Textarea
            label="Toilet Description"
            placeholder="Please provide a brief description where visitors can find the public toilets"
            {...form.getInputProps('public_toilets.description')}
            minRows={2}
          />

          <Text size="sm" fw={500} mt="md">Toilet Locations (Lat & Long)</Text>
          <Text size="xs" c="dimmed" mb="xs">You can add multiple toilet locations if needed</Text>
          
          {form.values.public_toilets?.locations?.map((location, index) => (
            <Paper key={index} p="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>Location {index + 1}</Text>
                <Button
                  size="xs"
                  variant="outline"
                  color="red"
                  onClick={() => {
                    const newLocations = [...(form.values.public_toilets?.locations || [])];
                    newLocations.splice(index, 1);
                    form.setFieldValue('public_toilets.locations', newLocations);
                  }}
                >
                  Remove
                </Button>
              </Group>
              <SimpleGrid cols={2}>
                <TextInput
                  label="Latitude"
                  type="number"
                  step="any"
                  value={location.latitude || ''}
                  onChange={(e) => {
                    const newLocations = [...(form.values.public_toilets?.locations || [])];
                    newLocations[index] = { ...newLocations[index], latitude: parseFloat(e.target.value) };
                    form.setFieldValue('public_toilets.locations', newLocations);
                  }}
                />
                <TextInput
                  label="Longitude"
                  type="number"
                  step="any"
                  value={location.longitude || ''}
                  onChange={(e) => {
                    const newLocations = [...(form.values.public_toilets?.locations || [])];
                    newLocations[index] = { ...newLocations[index], longitude: parseFloat(e.target.value) };
                    form.setFieldValue('public_toilets.locations', newLocations);
                  }}
                />
              </SimpleGrid>
            </Paper>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              const newLocations = [...(form.values.public_toilets?.locations || []), { latitude: 0, longitude: 0 }];
              form.setFieldValue('public_toilets.locations', newLocations);
            }}
          >
            Add Toilet Location
          </Button>
        </Stack>
      )}

    </Stack>
  );
}

export default ComplianceStep;