import React from 'react';
import { Button, Card, Divider, Stack, Text } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

/**
 * Generic add/remove-row component for repeatable JSONB location arrays.
 *
 * Use this to render arrays of "location" objects (parking lots, restrooms,
 * playgrounds, payphones, etc.) where each row is a caller-supplied field
 * group with a shared structure. Encapsulates the "+ Add Another" / "Remove"
 * UX and the Mantine form list-item plumbing so individual layouts don't
 * have to re-implement it.
 *
 * Props
 * -----
 * - form           Mantine `useForm` instance (required)
 * - fieldName      Dotted-path form key for the array (e.g. 'parking_locations')
 * - label          Section heading rendered above the rows
 * - addButtonLabel Text for the "add" button (default "+ Add Another")
 * - defaultRow     Object shape for a new row (passed to insertListItem)
 * - renderRow      (row, index, remove) => JSX  — caller-supplied row body
 * - min            Minimum number of rows (Remove hidden if min would be violated)
 * - max            Maximum number of rows (Add hidden once reached)
 * - emptyText      Text shown when the array is empty (optional)
 *
 * Existing JSONB data shape must continue to work — we never mutate the
 * structure of the row objects themselves; we only insert/remove entries.
 */
export const RepeatableLocationGroup = React.memo(function RepeatableLocationGroup({
  form,
  fieldName,
  label,
  addButtonLabel = '+ Add Another',
  defaultRow,
  renderRow,
  min = 0,
  max,
  emptyText,
}) {
  // Read the current array, defaulting to []. Some legacy data may have stored
  // a single object instead of an array (e.g. playground_location); the
  // backend migration coerces that, but we also guard here.
  const rawValue = form.values?.[fieldName];
  const rows = Array.isArray(rawValue) ? rawValue : (rawValue ? [rawValue] : []);

  const canRemove = rows.length > min;
  const canAdd = max == null || rows.length < max;

  const handleAdd = () => {
    // Use Mantine v8 insertListItem so form list-item validation/error keys stay coherent.
    form.insertListItem(fieldName, { ...(defaultRow || {}) });
  };

  const handleRemove = (index) => {
    form.removeListItem(fieldName, index);
  };

  return (
    <Stack>
      {label && <Divider my="md" label={label} />}

      {rows.length === 0 && emptyText && (
        <Text size="sm" c="dimmed">{emptyText}</Text>
      )}

      {rows.map((row, index) => (
        <Card key={index} withBorder p="md" mb="sm">
          <Stack>
            {renderRow(row, index, canRemove ? () => handleRemove(index) : null)}
            {canRemove && (
              <Button
                color="red"
                variant="light"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => handleRemove(index)}
              >
                Remove
              </Button>
            )}
          </Stack>
        </Card>
      ))}

      {canAdd && (
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={handleAdd}
        >
          {addButtonLabel}
        </Button>
      )}
    </Stack>
  );
});

export default RepeatableLocationGroup;
