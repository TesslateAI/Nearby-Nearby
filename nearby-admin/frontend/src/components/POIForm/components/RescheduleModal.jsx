import React, { useState } from 'react';
import { Modal, Stack, Button, Group, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';

/**
 * RescheduleModal — shown when an editor clicks "Reschedule" on an event.
 *
 * Props:
 *   opened        {boolean}   Whether the modal is visible
 *   onClose       {function}  Called when the user cancels or closes
 *   onConfirm     {function}  Called with { new_start_datetime, new_end_datetime }
 *                             when the user confirms the new dates
 */
export default function RescheduleModal({ opened, onClose, onConfirm }) {
  const [newStartDatetime, setNewStartDatetime] = useState(null);
  const [newEndDatetime, setNewEndDatetime] = useState(null);

  function handleConfirm() {
    if (!newStartDatetime) return;
    onConfirm({
      new_start_datetime: newStartDatetime,
      new_end_datetime: newEndDatetime || null,
    });
  }

  function handleClose() {
    // Reset state on close so the modal starts fresh next time
    setNewStartDatetime(null);
    setNewEndDatetime(null);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Reschedule Event"
      size="md"
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Enter the new date and time for this event. The original dates will be
          preserved for reference.
        </Text>

        <DateTimePicker
          label="New Start Date & Time"
          placeholder="Select new start date and time"
          value={newStartDatetime}
          onChange={setNewStartDatetime}
          required
          withSeconds={false}
        />

        <DateTimePicker
          label="New End Date & Time"
          placeholder="Select new end date and time (optional)"
          value={newEndDatetime}
          onChange={setNewEndDatetime}
          withSeconds={false}
          minDate={newStartDatetime || undefined}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newStartDatetime}
          >
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
