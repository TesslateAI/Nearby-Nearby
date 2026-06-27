import { useEffect, useState } from 'react';
import { Group, Loader, Text, Tooltip, Badge, ActionIcon } from '@mantine/core';
import { IconCheck, IconAlertTriangle, IconCloudOff, IconRefresh } from '@tabler/icons-react';

function timeAgo(date) {
  if (!date) return null;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleTimeString();
}

export function SaveStatus({ status, lastSaved, errorMsg, onRetry }) {
  const [, force] = useState(0);
  // tick every 15s so "Saved 12s ago" updates
  useEffect(() => {
    const i = setInterval(() => force((n) => n + 1), 15000);
    return () => clearInterval(i);
  }, []);

  if (status === 'saving') {
    return (
      <Group gap={6} wrap="nowrap">
        <Loader size="xs" />
        <Text size="sm" c="dimmed">Saving…</Text>
      </Group>
    );
  }

  if (status === 'error') {
    return (
      <Tooltip label={errorMsg || 'Save failed'} multiline w={260} withArrow>
        <Group gap={6} wrap="nowrap">
          <Badge color="red" leftSection={<IconAlertTriangle size={12} />} variant="light">
            Save failed
          </Badge>
          {onRetry && (
            <ActionIcon size="sm" variant="subtle" onClick={onRetry} aria-label="Retry save">
              <IconRefresh size={14} />
            </ActionIcon>
          )}
        </Group>
      </Tooltip>
    );
  }

  if (status === 'offline') {
    return (
      <Group gap={6} wrap="nowrap">
        <Badge color="gray" leftSection={<IconCloudOff size={12} />} variant="light">
          Offline — changes queued
        </Badge>
      </Group>
    );
  }

  if (status === 'saved' || lastSaved) {
    return (
      <Group gap={6} wrap="nowrap">
        <IconCheck size={14} color="var(--mantine-color-green-6)" />
        <Text size="sm" c="dimmed">
          Saved {timeAgo(lastSaved)}
        </Text>
      </Group>
    );
  }

  return (
    <Text size="sm" c="dimmed">Not yet saved</Text>
  );
}

export default SaveStatus;
