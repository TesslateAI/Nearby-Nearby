import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import {
  Button,
  Group,
  Title,
  Paper,
  ActionIcon,
  Tooltip,
  Text,
  Stack,
  TextInput,
  Modal,
  UnstyledButton,
  Center,
  Table,
  Box,
  Textarea
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconX
} from '@tabler/icons-react';

function slugify(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PrimaryTypeList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', slug: '', description: '' });
  const [current, setCurrent] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
  const res = await api.get('/primary-types');
  if (!res || !res.ok) throw new Error('Failed to fetch');
  const data = await res.json().catch(() => []);
      setItems(data || []);
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Failed to load primary types.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // Safe handler factory to avoid React event pooling nulling out currentTarget
  const updateDraft = (field) => (e) => {
    const value = e?.currentTarget?.value ?? '';
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const handleSortClick = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <IconSelector size={14} />;
    return sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />;
  };

  const filteredSorted = useMemo(() => {
    let list = [...items];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(i =>
        i.name?.toLowerCase().includes(s) ||
        i.slug?.toLowerCase().includes(s) ||
        i.description?.toLowerCase().includes(s)
      );
    }
    list.sort((a, b) => {
      let av = a[sortBy] ?? '';
      let bv = b[sortBy] ?? '';
      av = typeof av === 'string' ? av.toLowerCase() : av;
      bv = typeof bv === 'string' ? bv.toLowerCase() : bv;
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [items, searchTerm, sortBy, sortOrder]);

  const onCreate = async () => {
    const payload = { ...draft, slug: draft.slug || slugify(draft.name) };
    try {
  const res = await api.post('/primary-types', payload);
      if (!res.ok) throw new Error();
      notifications.show({ title: 'Created', message: 'Primary type created.', color: 'green' });
      setCreateOpen(false);
      setDraft({ name: '', slug: '', description: '' });
      fetchItems();
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Failed to create primary type.', color: 'red' });
    }
  };

  const startEdit = (item) => {
    setCurrent(item);
    setDraft({ name: item.name || '', slug: item.slug || '', description: item.description || '' });
    setEditOpen(true);
  };

  const onUpdate = async () => {
    if (!current) return;
    const payload = { ...draft };
    if (!payload.slug) payload.slug = slugify(payload.name);
    try {
  const res = await api.put(`/primary-types/${current.id}`, payload);
      if (!res.ok) throw new Error();
      notifications.show({ title: 'Updated', message: 'Primary type updated.', color: 'green' });
      setEditOpen(false);
      setCurrent(null);
      fetchItems();
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Failed to update primary type.', color: 'red' });
    }
  };

  const startDelete = (item) => {
    setCurrent(item);
    setDeleteOpen(true);
  };

  const onDelete = async () => {
    if (!current) return;
    try {
  const res = await api.delete(`/primary-types/${current.id}`);
      if (!res.ok) throw new Error();
      notifications.show({ title: 'Deleted', message: `Deleted "${current.name}".`, color: 'green' });
      setDeleteOpen(false);
      setCurrent(null);
      fetchItems();
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Failed to delete primary type.', color: 'red' });
    }
  };

  const rows = filteredSorted.map((pt) => (
    <Table.Tr key={pt.id} style={{ transition: 'background-color 0.2s' }}>
      <Table.Td>{pt.name}</Table.Td>
      <Table.Td>{pt.slug}</Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" lineClamp={2}>{pt.description || '—'}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Edit Primary Type">
            <ActionIcon variant="subtle" color="gray" onClick={() => startEdit(pt)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete Primary Type">
            <ActionIcon variant="subtle" color="red" onClick={() => startDelete(pt)}>
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper>
      <Group justify="space-between" mb="lg">
        <Title order={2} c="deep-purple.7">Manage Primary Types</Title>
        <Button onClick={() => setCreateOpen(true)} leftSection={<IconPlus size={18} />}>Create New Primary Type</Button>
      </Group>

      <Stack gap="md" mb="lg">
        <Group align="flex-end">
          <TextInput
            placeholder="Search primary types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.currentTarget?.value ?? '')}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1, minWidth: 300 }}
          />
          {(searchTerm) && (
            <Button variant="light" color="gray" onClick={() => setSearchTerm('')} leftSection={<IconX size={16} />}>
              Clear Filters
            </Button>
          )}
        </Group>
      </Stack>

      {loading ? (
        <Text c="dimmed" ta="center" py="xl">Loading primary types...</Text>
      ) : filteredSorted.length > 0 ? (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead style={{ backgroundColor: 'var(--mantine-color-deep-purple-0)' }}>
            <Table.Tr>
              <Table.Th>
                <UnstyledButton onClick={() => handleSortClick('name')} style={{ width: '100%' }}>
                  <Group justify="space-between">
                    <Text fw={500}>Name</Text>
                    <Center>{getSortIcon('name')}</Center>
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th>
                <UnstyledButton onClick={() => handleSortClick('slug')} style={{ width: '100%' }}>
                  <Group justify="space-between">
                    <Text fw={500}>Slug</Text>
                    <Center>{getSortIcon('slug')}</Center>
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th>
                <Text fw={500}>Description</Text>
              </Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="xl">No primary types found. Create your first one!</Text>
      )}

      {/* Create Modal */}
      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title={<Text fw={600}>Create Primary Type</Text>} centered>
        <Stack>
          <TextInput label="Name" placeholder="e.g., Food Truck" value={draft.name} onChange={updateDraft('name')} required />
          <TextInput label="Slug" placeholder="auto-generated" value={draft.slug} onChange={updateDraft('slug')} description="Leave blank to auto-generate from name" />
          <Textarea label="Description" placeholder="Optional" value={draft.description} onChange={updateDraft('description')} minRows={3} />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={onCreate}>Create</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit Modal */}
      <Modal opened={editOpen} onClose={() => setEditOpen(false)} title={<Text fw={600}>Edit Primary Type</Text>} centered>
        <Stack>
          <TextInput label="Name" value={draft.name} onChange={updateDraft('name')} required />
          <TextInput label="Slug" value={draft.slug} onChange={updateDraft('slug')} />
          <Textarea label="Description" value={draft.description} onChange={updateDraft('description')} minRows={3} />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={onUpdate}>Save Changes</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Modal */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title={<Text fw={600}>Confirm Deletion</Text>} centered>
        <Stack>
          <Text>Are you sure you want to delete <Text component="span" fw={600}>"{current?.name}"</Text>?</Text>
          <Box>
            <Text size="sm" c="dimmed">• POIs will simply lose the reference (set to null)</Text>
          </Box>
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button color="red" leftSection={<IconTrash size={16} />} onClick={onDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
