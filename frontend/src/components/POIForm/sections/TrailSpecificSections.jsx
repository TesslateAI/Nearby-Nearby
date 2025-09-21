import {
  Stack, SimpleGrid, TextInput, Select, NumberInput, Divider,
  Text, Checkbox, Alert
} from '@mantine/core';
import RichTextEditor from '../../RichTextEditor';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  TRAIL_ROUTE_TYPES, TRAIL_DIFFICULTIES, TRAIL_SURFACES,
  TRAIL_CONDITIONS, TRAIL_EXPERIENCES
} from '../../../utils/outdoorConstants';
import {
  TrailHeadPhotoUpload,
  TrailExitPhotoUpload,
  shouldUseImageUpload
} from '../ImageIntegration';

export function TrailDetailsSection({ form, id }) {
  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Trail Length"
          placeholder="e.g., 2.5 miles"
          {...form.getInputProps('trail.length_text')}
        />
        <Select
          label="Route Type"
          placeholder="Select route type"
          data={TRAIL_ROUTE_TYPES}
          {...form.getInputProps('trail.route_type')}
        />
      </SimpleGrid>

      <Select
        label="Difficulty"
        placeholder="Select difficulty"
        data={TRAIL_DIFFICULTIES.map(d => ({ value: d.value, label: d.label }))}
        {...form.getInputProps('trail.difficulty')}
        onChange={(value) => {
          form.setFieldValue('trail.difficulty', value);
          const difficultyInfo = TRAIL_DIFFICULTIES.find(d => d.value === value);
          if (difficultyInfo) {
            form.setFieldValue('trail.difficulty_description', difficultyInfo.description);
          }
        }}
      />
      {form.values.trail?.difficulty && (
        <Alert color="blue" variant="light">
          {TRAIL_DIFFICULTIES.find(d => d.value === form.values.trail.difficulty)?.description}
        </Alert>
      )}

      <Divider my="md" label="Trail Surface" />
      <Stack spacing="md">
        {Object.entries(TRAIL_SURFACES).map(([category, surfaces]) => (
          <div key={category}>
            <Text fw={500} size="sm" mb="xs">{category}</Text>
            <Checkbox.Group
              {...getCheckboxGroupProps(form, 'trail.trail_surfaces')}
            >
              <SimpleGrid cols={{ base: 2, sm: 3 }}>
                {surfaces.map(surface => (
                  <Checkbox key={surface} value={surface} label={surface} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
          </div>
        ))}
      </Stack>

      <Divider my="md" label="Trail Conditions" />
      <Checkbox.Group {...getCheckboxGroupProps(form, 'trail.trail_conditions')}>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {TRAIL_CONDITIONS.map(condition => (
            <Checkbox key={condition} value={condition} label={condition} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <Divider my="md" label="Trail Experiences" />
      <Checkbox.Group {...getCheckboxGroupProps(form, 'trail.trail_experiences')}>
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {TRAIL_EXPERIENCES.map(experience => (
            <Checkbox key={experience} value={experience} label={experience} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <RichTextEditor
        label="Trail Markings"
        placeholder="Describe trail markers and wayfinding"
        value={form.values.trail?.trail_markings || ''}
        onChange={(html) => form.setFieldValue('trail.trail_markings', html)}
        error={form.errors?.trail?.trail_markings}
      />

      <RichTextEditor
        label="Trailhead Access Details"
        placeholder="Parking, access points, facilities at trailhead"
        value={form.values.trail?.trailhead_access_details || ''}
        onChange={(html) => form.setFieldValue('trail.trailhead_access_details', html)}
        error={form.errors?.trail?.trailhead_access_details}
      />

      <TextInput
        label="Downloadable Trail Map"
        placeholder="URL to trail map PDF"
        {...form.getInputProps('trail.downloadable_trail_map')}
      />

      <Divider my="md" label="Trailhead Location" />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <NumberInput
          label="Trailhead Latitude"
          placeholder="35.7128"
          precision={6}
          {...form.getInputProps('trail.trailhead_latitude')}
        />
        <NumberInput
          label="Trailhead Longitude"
          placeholder="-79.0064"
          precision={6}
          {...form.getInputProps('trail.trailhead_longitude')}
        />
      </SimpleGrid>
      {shouldUseImageUpload(id) ? (
        <TrailHeadPhotoUpload poiId={id} form={form} />
      ) : (
        <TextInput
          label="Trailhead Photo"
          placeholder="URL to photo of trailhead entrance"
          {...form.getInputProps('trail.trailhead_photo')}
          description="Save the POI first to enable image upload"
        />
      )}

      <Divider my="md" label="Trail Exit Location" />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <NumberInput
          label="Trail Exit Latitude"
          placeholder="35.7128"
          precision={6}
          {...form.getInputProps('trail.trail_exit_latitude')}
        />
        <NumberInput
          label="Trail Exit Longitude"
          placeholder="-79.0064"
          precision={6}
          {...form.getInputProps('trail.trail_exit_longitude')}
        />
      </SimpleGrid>
      {shouldUseImageUpload(id) ? (
        <TrailExitPhotoUpload poiId={id} form={form} />
      ) : (
        <TextInput
          label="Trail Exit Photo"
          placeholder="URL to photo of trail exit"
          {...form.getInputProps('trail.trail_exit_photo')}
          description="Save the POI first to enable image upload"
        />
      )}
    </Stack>
  );
}