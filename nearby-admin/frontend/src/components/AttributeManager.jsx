import { useState, useEffect } from 'react';
import {
  Table, Button, Group, Box, Title, TextInput, Select, Switch, Stack,
  Modal, Textarea, NumberInput, ActionIcon, Text, Badge, UnstyledButton,
  Center, Paper
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconPlus, IconSearch, IconChevronUp, IconChevronDown, IconSelector, IconX } from '@tabler/icons-react';
import api from '../utils/api';
import { handleSort, clearAllFilters, sortData, filterByText, filterByField, filterByBoolean, getUniqueValues } from '../utils/filterUtils';

const ATTRIBUTE_TYPES = [
  'PAYMENT_METHOD', 'AMENITY', 'ENTERTAINMENT', 'IDEAL_FOR', 'FACILITY',
  'NATURAL_FEATURE', 'ACTIVITY', 'ACCESSIBILITY', 'PARKING', 'PET_POLICY',
  'SMOKING_POLICY', 'ALCOHOL_POLICY', 'DISCOUNT', 'BUSINESS_TYPE'
];

const POI_TYPES = ['BUSINESS', 'PARK', 'TRAIL', 'EVENT'];

function AttributeManager() {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [poiTypeFilter, setPoiTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const form = useForm({
    initialValues: {
      name: '',
      type: '',
      applicable_to: [],
      is_active: true,
      sort_order: 0,
      parent_id: null
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must have at least 2 characters' : null),
      type: (value) => (!value ? 'Type is required' : null),
      applicable_to: (value) => (value.length === 0 ? 'Must apply to at least one POI type' : null)
    }
  });

  const fetchAttributes = async () => {
    try {
      const response = await api.get('/attributes/');
      const data = await response.json();
      setAttributes(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to fetch attributes',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleSubmit = async (values) => {
    try {
      if (editingAttribute) {
        const response = await api.put(`/attributes/${editingAttribute.id}/`, values);
        if (response.ok) {
          notifications.show({
            title: 'Success',
            message: 'Attribute updated successfully',
            color: 'green'
          });
        } else {
          throw new Error('Failed to update attribute');
        }
      } else {
        const response = await api.post('/attributes/', values);
        if (response.ok) {
          notifications.show({
            title: 'Success',
            message: 'Attribute created successfully',
            color: 'green'
          });
        } else {
          throw new Error('Failed to create attribute');
        }
      }
      setModalOpened(false);
      form.reset();
      setEditingAttribute(null);
      fetchAttributes();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save attribute',
        color: 'red'
      });
    }
  };

  const handleEdit = (attribute) => {
    setEditingAttribute(attribute);
    form.setValues({
      name: attribute.name,
      type: attribute.type,
      applicable_to: attribute.applicable_to || [],
      is_active: attribute.is_active,
      sort_order: attribute.sort_order || 0,
      parent_id: attribute.parent_id
    });
    setModalOpened(true);
  };

  const handleDelete = async (attributeId) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return;
    
    try {
      const response = await api.delete(`/attributes/${attributeId}/`);
      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Attribute deleted successfully',
          color: 'green'
        });
        fetchAttributes();
      } else {
        throw new Error('Failed to delete attribute');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete attribute',
        color: 'red'
      });
    }
  };

  const openCreateModal = () => {
    setEditingAttribute(null);
    form.reset();
    setModalOpened(true);
  };

  const handleSortClick = (field) => {
    handleSort(field, sortBy, sortOrder, setSortBy, setSortOrder);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <IconSelector size={14} />;
    }
    return sortOrder === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />;
  };

  const clearFilters = () => {
    clearAllFilters(setSearchText, setTypeFilter, setPoiTypeFilter, setActiveFilter);
  };

  const filteredAndSortedAttributes = () => {
    let filtered = attributes;

    // Apply filters
    filtered = filterByText(filtered, searchText, ['name', 'type']);
    filtered = filterByField(filtered, typeFilter, 'type');
    filtered = filterByField(filtered, poiTypeFilter, 'applicable_to');
    filtered = filterByBoolean(filtered, activeFilter, 'is_active');

    // Apply sorting
    const customSortHandlers = {
      applicable_to: (a, b, sortOrder) => {
        const aValue = a.applicable_to?.join(', ').toLowerCase() || '';
        const bValue = b.applicable_to?.join(', ').toLowerCase() || '';
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }
    };

    return sortData(filtered, sortBy, sortOrder, customSortHandlers);
  };

  const filteredAttributes = filteredAndSortedAttributes();
  const rows = filteredAttributes.map((attribute) => (
    <Table.Tr key={attribute.id}>
      <Table.Td>{attribute.name}</Table.Td>
      <Table.Td>
        <Badge variant="light">{attribute.type}</Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {attribute.applicable_to?.map((type) => (
            <Badge key={type} size="xs" variant="outline">
              {type}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Switch checked={attribute.is_active} readOnly />
      </Table.Td>
      <Table.Td>{attribute.sort_order}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleEdit(attribute)}
          >
            <IconEdit size="1rem" />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(attribute.id)}
          >
            <IconTrash size="1rem" />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper>
      <Group justify="space-between" mb="lg">
        <Title order={2} c="deep-purple.7">Manage Attributes</Title>
        <Button leftSection={<IconPlus size="1rem" />} onClick={openCreateModal}>
          Add Attribute
        </Button>
      </Group>

      {/* Filters */}
      <Stack gap="md" mb="lg">
        <Group align="flex-end">
          <TextInput
            placeholder="Search attributes..."
            value={searchText}
            onChange={(event) => setSearchText(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1, minWidth: 300 }}
          />
          <Select
            placeholder="Filter by Type"
            value={typeFilter}
            onChange={setTypeFilter}
            data={getUniqueValues(attributes, 'type')}
            clearable
            style={{ minWidth: 150 }}
          />
          <Select
            placeholder="Filter by POI Type"
            value={poiTypeFilter}
            onChange={setPoiTypeFilter}
            data={POI_TYPES.map(type => ({ value: type, label: type }))}
            clearable
            style={{ minWidth: 150 }}
          />
          <Select
            placeholder="Filter by Status"
            value={activeFilter}
            onChange={setActiveFilter}
            data={[
              { value: 'true', label: 'Active Only' },
              { value: 'false', label: 'Inactive Only' }
            ]}
            clearable
            style={{ minWidth: 150 }}
          />
          {(searchText || typeFilter || poiTypeFilter || activeFilter) && (
            <Button variant="light" color="gray" onClick={clearFilters} leftSection={<IconX size={16} />}>
              Clear Filters
            </Button>
          )}
        </Group>
        {(searchText || typeFilter || poiTypeFilter || activeFilter) && (
          <Text size="sm" c="dimmed">
            Showing {filteredAttributes.length} of {attributes.length} attributes
          </Text>
        )}
      </Stack>

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
              <UnstyledButton onClick={() => handleSortClick('type')} style={{ width: '100%' }}>
                <Group justify="space-between">
                  <Text fw={500}>Type</Text>
                  <Center>{getSortIcon('type')}</Center>
                </Group>
              </UnstyledButton>
            </Table.Th>
            <Table.Th>
              <UnstyledButton onClick={() => handleSortClick('applicable_to')} style={{ width: '100%' }}>
                <Group justify="space-between">
                  <Text fw={500}>Applicable To</Text>
                  <Center>{getSortIcon('applicable_to')}</Center>
                </Group>
              </UnstyledButton>
            </Table.Th>
            <Table.Th>
              <UnstyledButton onClick={() => handleSortClick('is_active')} style={{ width: '100%' }}>
                <Group justify="space-between">
                  <Text fw={500}>Active</Text>
                  <Center>{getSortIcon('is_active')}</Center>
                </Group>
              </UnstyledButton>
            </Table.Th>
            <Table.Th>
              <UnstyledButton onClick={() => handleSortClick('sort_order')} style={{ width: '100%' }}>
                <Group justify="space-between">
                  <Text fw={500}>Sort Order</Text>
                  <Center>{getSortIcon('sort_order')}</Center>
                </Group>
              </UnstyledButton>
            </Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredAttributes.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text c="dimmed" ta="center" py="xl">
                  {attributes.length === 0
                    ? "No attributes found. Create your first attribute to get started!"
                    : "No attributes match your current filters. Try adjusting your search criteria."
                  }
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            rows
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingAttribute ? 'Edit Attribute' : 'Create Attribute'}
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="e.g., Live Music, Credit Card, Family Friendly"
              required
              {...form.getInputProps('name')}
            />
            
            <Select
              label="Type"
              placeholder="Select attribute type"
              data={ATTRIBUTE_TYPES}
              required
              {...form.getInputProps('type')}
            />
            
            <Select
              label="Applicable To"
              placeholder="Select POI types"
              data={POI_TYPES}
              multiple
              required
              {...form.getInputProps('applicable_to')}
            />
            
            <Switch
              label="Active"
              {...form.getInputProps('is_active', { type: 'checkbox' })}
            />
            
            <NumberInput
              label="Sort Order"
              placeholder="0"
              min={0}
              {...form.getInputProps('sort_order')}
            />
            
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAttribute ? 'Update' : 'Create'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Paper>
  );
}

export default AttributeManager; 