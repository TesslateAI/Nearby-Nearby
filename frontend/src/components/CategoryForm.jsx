import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { TextInput, Button, Group, Box, Title, Select, Paper } from '@mantine/core';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

const API_URL = import.meta.env.VITE_API_BASE_URL;

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
            const response = await axios.get(`${API_URL}/api/categories/tree`);
            const flattened = [];
            const flatten = (cats, depth = 0) => {
                cats.forEach(cat => {
                    flattened.push({ value: cat.id, label: `${'— '.repeat(depth)}${cat.name}` });
                    if (cat.children) flatten(cat.children, depth + 1);
                });
            };
            flatten(response.data);
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
      await axios.post(`${API_URL}/api/categories/`, payload);
      notifications.show({ title: 'Success!', message: `Category "${values.name}" created!`, color: 'green' });
      navigate('/categories'); // Go back to the category list
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