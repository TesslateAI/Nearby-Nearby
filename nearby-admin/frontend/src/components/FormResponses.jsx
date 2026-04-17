import { useEffect, useMemo, useState } from 'react';
import {
  Paper, Title, Tabs, Table, Text, Badge, Group, Anchor, Image,
  ScrollArea, Stack, TextInput, Button, Tooltip, Loader, Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconInbox, IconMail, IconMessage, IconBug, IconBriefcase,
  IconUsersGroup, IconCalendarEvent, IconRefresh, IconSearch,
  IconDownload, IconFileZip,
} from '@tabler/icons-react';
import api from '../utils/api';

const FORM_TABS = [
  { slug: 'waitlist', label: 'Waitlist', icon: IconMail },
  { slug: 'contact', label: 'Contact', icon: IconMessage },
  { slug: 'feedback', label: 'Feedback', icon: IconBug },
  { slug: 'business-claims', label: 'Business Claims', icon: IconBriefcase },
  { slug: 'community-interest', label: 'Community Interest', icon: IconUsersGroup },
  { slug: 'event-suggestions', label: 'Event Suggestions', icon: IconCalendarEvent },
];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function StatusBadge({ value }) {
  if (!value) return <Badge color="gray" variant="light">—</Badge>;
  const colorMap = { pending: 'yellow', approved: 'green', rejected: 'red', closed: 'gray' };
  return (
    <Badge color={colorMap[value.toLowerCase()] || 'blue'} variant="filled">
      {value}
    </Badge>
  );
}

function FileUrlsCell({ urls }) {
  if (!Array.isArray(urls) || urls.length === 0) return <Text size="xs" c="dimmed">—</Text>;
  return (
    <Group gap={6} wrap="wrap">
      {urls.map((u, i) => (
        <Tooltip label={u} key={`${u}-${i}`}>
          <Anchor href={u} target="_blank" rel="noopener noreferrer">
            <Image src={u} w={48} h={48} radius="sm" fit="cover" alt={`attachment ${i + 1}`} />
          </Anchor>
        </Tooltip>
      ))}
    </Group>
  );
}

function CellValue({ column, value }) {
  if (value === null || value === undefined || value === '') {
    return <Text size="sm" c="dimmed">—</Text>;
  }
  if (column === 'created_at') return <Text size="sm">{formatDate(value)}</Text>;
  if (column === 'status') return <StatusBadge value={value} />;
  if (column === 'file_urls') return <FileUrlsCell urls={value} />;
  if (column === 'role' && Array.isArray(value)) {
    return (
      <Group gap={4} wrap="wrap">
        {value.map((r) => (
          <Badge key={r} variant="light" color="grape" size="sm">{r}</Badge>
        ))}
      </Group>
    );
  }
  if (column === 'email' || column === 'contact_email' || column === 'organizer_email') {
    return <Anchor href={`mailto:${value}`} size="sm">{value}</Anchor>;
  }
  if (column === 'contact_phone' || column === 'organizer_phone') {
    return <Anchor href={`tel:${value}`} size="sm">{value}</Anchor>;
  }
  if (column === 'additional_info' && typeof value === 'string' && /^https?:\/\//i.test(value)) {
    return <Anchor href={value} target="_blank" rel="noopener noreferrer" size="sm">{value}</Anchor>;
  }
  if (typeof value === 'string' && value.length > 140) {
    return (
      <Tooltip label={<div style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{value}</div>} multiline withArrow>
        <Text size="sm" lineClamp={2}>{value}</Text>
      </Tooltip>
    );
  }
  if (column === 'id') {
    const short = String(value).slice(0, 8);
    return <Tooltip label={value}><Text size="xs" c="dimmed" ff="monospace">{short}…</Text></Tooltip>;
  }
  return <Text size="sm">{String(value)}</Text>;
}

const COLUMN_LABELS = {
  id: 'ID',
  email: 'Email',
  contact_email: 'Email',
  organizer_email: 'Email',
  contact_phone: 'Phone',
  organizer_phone: 'Phone',
  contact_name: 'Contact',
  organizer_name: 'Organizer',
  business_name: 'Business',
  business_address: 'Address',
  event_name: 'Event',
  event_date: 'Date',
  event_location: 'Location',
  event_description: 'Description',
  additional_info: 'More info',
  how_heard: 'How heard',
  anything_else: 'Notes',
  role_other: 'Other role',
  file_urls: 'Attachments',
  created_at: 'Submitted',
  name: 'Name',
  message: 'Message',
  feedback: 'Feedback',
  location: 'Location',
  role: 'Role',
  why: 'Why',
  status: 'Status',
};

function ResponsesTable({ slug, columns, items }) {
  const visibleColumns = useMemo(() => columns ?? [], [columns]);

  if (!items || items.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No submissions yet for this form.
      </Text>
    );
  }

  return (
    <ScrollArea type="auto">
      <Table striped highlightOnHover withTableBorder miw={800}>
        <Table.Thead style={{ backgroundColor: 'var(--mantine-color-deep-purple-0)' }}>
          <Table.Tr>
            {visibleColumns.map((col) => (
              <Table.Th key={col}>{COLUMN_LABELS[col] || col}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((row) => (
            <Table.Tr key={`${slug}-${row.id}`}>
              {visibleColumns.map((col) => (
                <Table.Td key={col}><CellValue column={col} value={row[col]} /></Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

function FormResponses() {
  const [activeTab, setActiveTab] = useState(FORM_TABS[0].slug);
  const [summary, setSummary] = useState({});
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [search, setSearch] = useState('');

  const loadSummary = async () => {
    try {
      const res = await api.get('/form-responses/summary');
      if (res.ok) setSummary(await res.json());
    } catch (err) {
      console.error('Failed to load summary', err);
    }
  };

  const loadTab = async (slug) => {
    setLoading((prev) => ({ ...prev, [slug]: true }));
    try {
      const res = await api.get(`/form-responses/${slug}?limit=500`);
      if (res.ok) {
        const payload = await res.json();
        setData((prev) => ({ ...prev, [slug]: payload }));
      } else if (res.status !== 401) {
        notifications.show({
          title: 'Error',
          message: `Could not load ${slug} submissions.`,
          color: 'red',
        });
      }
    } catch (err) {
      console.error(`Failed to load ${slug}`, err);
    } finally {
      setLoading((prev) => ({ ...prev, [slug]: false }));
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (activeTab && !data[activeTab]) loadTab(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const refreshActive = async () => {
    await Promise.all([loadSummary(), loadTab(activeTab)]);
  };

  const triggerBlobDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filenameFromResponse = (res, fallback) => {
    const cd = res.headers.get('content-disposition') || '';
    const match = cd.match(/filename="?([^"]+)"?/i);
    return match ? match[1] : fallback;
  };

  const downloadCurrent = async () => {
    try {
      const res = await api.get(`/form-responses/${activeTab}/export`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      triggerBlobDownload(blob, filenameFromResponse(res, `${activeTab}.csv`));
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Download failed', message: String(err), color: 'red' });
    }
  };

  const downloadAll = async () => {
    try {
      const res = await api.get('/form-responses/export-all');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      triggerBlobDownload(blob, filenameFromResponse(res, 'form-responses.zip'));
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Download failed', message: String(err), color: 'red' });
    }
  };

  const tabPayload = data[activeTab];
  const filteredItems = useMemo(() => {
    if (!tabPayload?.items) return [];
    if (!search.trim()) return tabPayload.items;
    const q = search.trim().toLowerCase();
    return tabPayload.items.filter((row) =>
      Object.values(row).some((v) => {
        if (v === null || v === undefined) return false;
        if (Array.isArray(v)) return v.some((x) => String(x).toLowerCase().includes(q));
        return String(v).toLowerCase().includes(q);
      })
    );
  }, [tabPayload, search]);

  return (
    <Paper>
      <Group justify="space-between" mb="lg" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <IconInbox size={28} />
          <Title order={2} c="deep-purple.7">Form Responses</Title>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={refreshActive}
            loading={loading[activeTab]}
          >
            Refresh
          </Button>
          <Button
            variant="light"
            color="deep-purple"
            leftSection={<IconDownload size={16} />}
            onClick={downloadCurrent}
          >
            Download CSV
          </Button>
          <Button
            variant="filled"
            color="deep-purple"
            leftSection={<IconFileZip size={16} />}
            onClick={downloadAll}
          >
            Download all (ZIP)
          </Button>
        </Group>
      </Group>

      <Text size="sm" c="dimmed" mb="md">
        User-submitted responses from the public app: waitlist signups, contact messages,
        feedback, business claims, community interest, and event suggestions.
      </Text>

      <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false} mb="md">
        <Tabs.List>
          {FORM_TABS.map(({ slug, label, icon: Icon }) => (
            <Tabs.Tab
              key={slug}
              value={slug}
              leftSection={<Icon size={16} />}
              rightSection={
                summary[slug] !== undefined ? (
                  <Badge size="sm" circle variant="light" color="deep-purple">
                    {summary[slug]}
                  </Badge>
                ) : null
              }
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Stack gap="md">
        <TextInput
          placeholder="Filter visible rows…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size={16} />}
        />

        {loading[activeTab] && !tabPayload ? (
          <Center py="xl"><Loader /></Center>
        ) : (
          <>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {tabPayload?.total !== undefined
                  ? `Showing ${filteredItems.length} of ${tabPayload.total} total`
                  : ''}
              </Text>
            </Group>
            <ResponsesTable
              slug={activeTab}
              columns={tabPayload?.columns || (tabPayload?.items?.[0] ? Object.keys(tabPayload.items[0]) : null)}
              items={filteredItems}
            />
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default FormResponses;
