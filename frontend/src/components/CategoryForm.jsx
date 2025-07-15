import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, Button, Group, Box, Title, Select, Paper } from '@mantine/core';
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
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name must have at least 2 characters' : null),
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

    if (isEditing) {
      // Fetch data for the specific category being edited
      // Note: A GET /api/categories/{id} endpoint would be needed on the backend
      // For now, we'll assume we can't edit.
    }
  }, [id, isEditing]);

  const handleSubmit = async (values) => {
    const payload = {
        name: values.name,
        parent_id: values.parent_id || null, // Ensure null is sent if empty
    };

    try {
      const response = await api.post('/categories/', payload);
      if (response.ok) {
        notifications.show({ title: 'Success!', message: `Category "${values.name}" created!`, color: 'green' });
        navigate('/categories'); // Go back to the category list
      } else {
        throw new Error('Failed to create category');
      }
    } catch (error) {
      notifications.show({ title: 'Error', message: 'Failed to create category.', color: 'red' });
    }
  };

  return (
    <Paper maw={600} mx="auto">
      <Title order={2} c="deep-purple.7" mb="xl">
        {isEditing ? 'Edit Category' : 'Create New Category'}
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput withAsterisk label="Category Name" placeholder="e.g., Food & Drinks" {...form.getInputProps('name')} />
        <Select
          label="Parent Category (Optional)"
          placeholder="Select a parent to make this a subcategory"
          data={categories}
          {...form.getInputProps('parent_id')}
          mt="md"
          clearable
          searchable
        />
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