import { useState, useEffect } from 'react';
import {
  Table, Button, Group, Box, Title, TextInput, Select, Switch, Stack,
  Modal, Textarea, NumberInput, ActionIcon, Text, Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import api from '../utils/api';

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

  const rows = attributes.map((attribute) => (
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
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={2}>Manage Attributes</Title>
        <Button leftSection={<IconPlus size="1rem" />} onClick={openCreateModal}>
          Add Attribute
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Applicable To</Table.Th>
            <Table.Th>Active</Table.Th>
            <Table.Th>Sort Order</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
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
    </Box>
  );
}

export default AttributeManager; 