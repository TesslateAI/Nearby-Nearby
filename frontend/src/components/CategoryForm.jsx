import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, Button, Group, Box, Title, Select, Paper, MultiSelect, Switch, Stack, Text } from '@mantine/core';
import api from '../utils/api';
import { notifications } from '@mantine/notifications';

function CategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [categories, setCategories] = useState([]);

  const form = useForm({
    initialValues: {
      name: '',
      parent_id: null,
      poi_types: [],
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name must have at least 2 characters' : null),
      poi_types: (value) => (value.length === 0 ? 'At least one POI type must be selected' : null),
    },
  });

  useEffect(() => {
    // Fetch all categories to populate the 'parent' dropdown
    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories/tree');
            const data = await response.json();
            const flattened = [];
            const flatten = (cats, depth = 0) => {
                cats.forEach(cat => {
                    flattened.push({ value: cat.id, label: `${'\u00A0\u00A0\u00A0\u00A0'.repeat(depth)}${cat.name}` });
                    if (cat.children) flatten(cat.children, depth + 1);
                });
            };
            flatten(data);
            setCategories(flattened);
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Could not fetch categories for parent selection.', color: 'red' });
        }
    };
    fetchCategories();

    // Fetch category data for editing
    if (isEditing) {
      const fetchCategory = async () => {
        try {
          const response = await api.get(`/categories/${id}`);
          if (response.ok) {
            const data = await response.json();
            form.setValues({
              name: data.name || '',
              parent_id: data.parent_id || null,
              poi_types: data.applicable_to || [],
            });
          } else {
            throw new Error('Failed to fetch category');
          }
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: 'Could not load category data.',
            color: 'red'
          });
          navigate('/categories');
        }
      };
      fetchCategory();
    }
  }, [id, isEditing]);

  const handleSubmit = async (values) => {
    const payload = {
        name: values.name,
        parent_id: values.parent_id || null, // Ensure null is sent if empty
        applicable_to: values.poi_types,  // Map poi_types to applicable_to
    };

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/categories/${id}`, payload);
      } else {
        response = await api.post('/categories/', payload);
      }

      if (response.ok) {
        notifications.show({
          title: 'Success!',
          message: `Category "${values.name}" ${isEditing ? 'updated' : 'created'}!`,
          color: 'green'
        });
        navigate('/categories'); // Go back to the category list
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to ${isEditing ? 'update' : 'create'} category`);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || `Failed to ${isEditing ? 'update' : 'create'} category.`,
        color: 'red'
      });
    }
  };

  return (
    <Paper maw={600} mx="auto">
      <Title order={2} c="deep-purple.7" mb="xl">
        {isEditing ? 'Edit Category' : 'Create New Category'}
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack spacing="md">
          <TextInput 
            withAsterisk 
            label="Category Name" 
            placeholder="e.g., Food & Drinks" 
            {...form.getInputProps('name')} 
          />
          
          <MultiSelect
            withAsterisk
            label="POI Types"
            placeholder="Select applicable POI types"
            description="This category will be available for the selected POI types"
            data={[
              { value: 'BUSINESS', label: 'Business' },
              { value: 'SERVICES', label: 'Services' },
              { value: 'PARK', label: 'Park' },
              { value: 'TRAIL', label: 'Trail' },
              { value: 'EVENT', label: 'Event' },
              { value: 'YOUTH_ACTIVITIES', label: 'Youth Activities' },
              { value: 'JOBS', label: 'Jobs' },
              { value: 'VOLUNTEER_OPPORTUNITIES', label: 'Volunteer Opportunities' },
              { value: 'DISASTER_HUBS', label: 'Disaster Hubs' }
            ]}
            {...form.getInputProps('poi_types')}
          />

          <Select
            label="Parent Category (Optional)"
            placeholder="Leave blank for root-level category"
            data={categories}
            {...form.getInputProps('parent_id')}
            clearable
            searchable
            description="Select a parent to nest this category. Leave blank to create a root-level category."
          />

          {form.values.parent_id && (
            <Text size="sm" c="blue">
              This will be a subcategory. The hierarchy is infinitely scalable.
            </Text>
          )}

          {!form.values.parent_id && (
            <Text size="sm" c="dimmed">
              This will be a root-level category. You can add subcategories later.
            </Text>
          )}
        </Stack>
        
        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={() => navigate('/categories')}>Cancel</Button>
          <Button type="submit">
            {isEditing ? 'Update Category' : 'Create Category'}
          </Button>
        </Group>
      </form>
    </Paper>
  );
}

export default CategoryForm;