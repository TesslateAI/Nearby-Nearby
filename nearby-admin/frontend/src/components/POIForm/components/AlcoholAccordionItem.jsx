import React from 'react';
import { Accordion, Stack, Text, Checkbox, Textarea } from '@mantine/core';
import { AlcoholAvailableSelect } from '../layouts/_shared';
import { ALCOHOL_AVAILABILITY_OPTIONS } from '../../../utils/constants';

// Issue #69 — Alcohol accordion with conditional sub-options.
//
// Renders only the Yes/No gate by default; when alcohol_available is set to
// anything other than 'no_alcohol' (and is not null), it surfaces the granular
// availability multi-select, the byob_allowed flag, and a free-form notes
// field. The Smoking UI remains deferred per the existing TODO on
// BusinessPaidLayout — only Alcohol ships in this issue.
//
// Persists to columns:
//   alcohol_available     (existing String — gate)
//   alcohol_availability  (JSONB list of strings — multi-select)
//   byob_allowed          (Boolean)
//   alcohol_notes         (Text)
export default function AlcoholAccordionItem({ form, value = 's15-alcohol' }) {
  const showSubFields =
    form.values.alcohol_available && form.values.alcohol_available !== 'no_alcohol';

  return (
    <Accordion.Item value={value}>
      <Accordion.Control>
        <Text fw={600}>Alcohol</Text>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack>
          <AlcoholAvailableSelect form={form} />
          {showSubFields && (
            <>
              <Checkbox.Group
                label="Availability"
                description="Select all that apply"
                value={form.values.alcohol_availability || []}
                onChange={(v) => form.setFieldValue('alcohol_availability', v)}
              >
                <Stack mt="xs">
                  {ALCOHOL_AVAILABILITY_OPTIONS.map((o) => (
                    <Checkbox key={o.value} value={o.value} label={o.label} />
                  ))}
                </Stack>
              </Checkbox.Group>
              <Checkbox
                label="BYOB Allowed"
                checked={form.values.byob_allowed || false}
                onChange={(e) =>
                  form.setFieldValue('byob_allowed', e.currentTarget.checked)
                }
              />
              <Textarea
                label="Alcohol Notes"
                placeholder="Wine list highlights, last call, age policy, etc."
                value={form.values.alcohol_notes || ''}
                onChange={(e) =>
                  form.setFieldValue('alcohol_notes', e.currentTarget.value)
                }
                autosize
                minRows={2}
              />
            </>
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
