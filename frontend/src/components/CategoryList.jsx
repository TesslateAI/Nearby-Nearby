import { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Group, Title, Paper, ActionIcon, Tooltip, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      // We will fetch a flat list for management
      const response = await axios.get(`${API_URL}/api/categories/tree`); // Using tree to get hierarchy info
      
      // Flatten the tree for table display
      const flattened = [];
      const flatten = (cats, depth = 0) => {
        cats.forEach(cat => {
            flattened.push({ ...cat, depth });
            if (cat.children) {
                flatten(cat.children, depth + 1);
            }
        });
      };
      flatten(response.data);
      setCategories(flattened);

    } catch (error) {
      notifications.show({
        title: 'Error fetching data',
        message: 'Could not load categories.',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will remove it from all POIs. This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_URL}/api/categories/${categoryId}`);
        notifications.show({
          title: 'Success!',
          message: `Category "${categoryName}" was deleted.`,
          color: 'green',
        });
        fetchCategories(); // Refresh the list
      } catch (error) {
        const message = error.response?.data?.detail || 'Failed to delete category.';
        notifications.show({
          title: 'Deletion Error',
          message: message,
          color: 'red',
        });
      }
    }
  };

  const rows = categories.map((category) => (
    <Table.Tr key={category.id}>
      <Table.Td>
        <Text pl={category.depth * 20}>
            {'— '.repeat(category.depth)} {category.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Edit Category">
            <ActionIcon variant="subtle" color="gray" onClick={() => navigate(`/category/${category.id}/edit`)}>
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete Category">
            <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(category.id, category.name)}>
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
        <Title order={2} c="deep-purple.7">Manage Categories</Title>
        <Button onClick={() => navigate('/category/new')} leftSection={<IconPlus size={18} />}>
            Create New Category
        </Button>
      </Group>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}

export default CategoryList;