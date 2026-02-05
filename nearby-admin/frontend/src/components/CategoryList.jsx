import { useState, useEffect } from 'react';
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
  Badge,
  Select,
  UnstyledButton,
  Center,
  Table,
  Anchor,
  Box
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { handleSort, clearAllFilters } from '../utils/filterUtils';
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconSearch,
  IconAlertTriangle,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconX
} from '@tabler/icons-react';


function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [typeFilter, setTypeFilter] = useState('');
  const [mainCategoryFilter, setMainCategoryFilter] = useState('');
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories/tree');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      notifications.show({
        title: 'Error fetching data',
        message: 'Could not load categories.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (categoryId, categoryName) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    try {
      const response = await api.delete(`/categories/${categoryToDelete.id}`);
      if (response.ok) {
        notifications.show({
          title: 'Success!',
          message: `Category "${categoryToDelete.name}" was deleted.`,
          color: 'green',
        });
        fetchCategories(); // Refresh the list
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      notifications.show({
        title: 'Deletion Error',
        message: 'Failed to delete category.',
        color: 'red',
      });
    } finally {
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleEdit = (categoryId) => {
    navigate(`/category/${categoryId}/edit`);
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

  const getUniquePOITypes = () => {
    const allTypes = new Set();
    const addTypes = (categoryList) => {
      categoryList.forEach(category => {
        if (category.poi_types) {
          category.poi_types.forEach(type => allTypes.add(type));
        }
        if (category.children) {
          addTypes(category.children);
        }
      });
    };
    addTypes(categories);
    return Array.from(allTypes).map(type => ({ value: type, label: type }));
  };

  const clearFilters = () => {
    clearAllFilters(setSearchTerm, setTypeFilter, setMainCategoryFilter);
  };

  const flattenCategories = (categoryList, parentName = '') => {
    let flattened = [];
    categoryList.forEach(category => {
      const fullName = parentName ? `${parentName} > ${category.name}` : category.name;
      flattened.push({ ...category, fullName });
      if (category.children && category.children.length > 0) {
        flattened = flattened.concat(flattenCategories(category.children, fullName));
      }
    });
    return flattened;
  };

  const filteredAndSortedCategories = () => {
    let flatCategories = flattenCategories(categories);

    // Apply filters
    if (typeFilter) {
      flatCategories = flatCategories.filter(category =>
        category.poi_types && category.poi_types.includes(typeFilter)
      );
    }

    if (searchTerm) {
      flatCategories = flatCategories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    flatCategories.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'name' || sortBy === 'fullName') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      } else if (sortBy === 'is_main_category') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      } else if (sortBy === 'poi_types') {
        aValue = aValue ? aValue.join(', ') : '';
        bValue = bValue ? bValue.join(', ') : '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return flatCategories;
  };

  const displayCategories = filteredAndSortedCategories();

  // Calculate category depth from full name
  const getCategoryDepth = (fullName) => {
    if (!fullName) return 0;
    return (fullName.match(/>/g) || []).length;
  };

  const rows = displayCategories.map((category) => {
    const depth = getCategoryDepth(category.fullName);
    const indentation = depth * 20; // 20px per level

    return (
      <Table.Tr key={category.id} style={{ transition: 'background-color 0.2s' }}>
        <Table.Td>
          <Group gap="xs" style={{ paddingLeft: `${indentation}px` }}>
            {depth > 0 && <Text c="dimmed" size="sm">└─</Text>}
            <Anchor onClick={() => handleEdit(category.id)} fw={500} style={{ cursor: 'pointer' }}>
              {category.name}
            </Anchor>
          </Group>
        </Table.Td>
        <Table.Td>
          <Badge size="sm" variant="light" color={depth === 0 ? "grape" : depth === 1 ? "blue" : depth === 2 ? "teal" : "gray"}>
            Level {depth}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed">{category.fullName || category.name}</Text>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            {category.poi_types && category.poi_types.length > 0 ? (
              category.poi_types.map(type => (
                <Badge key={type} size="xs" variant="dot" color="blue">
                  {type}
                </Badge>
              ))
            ) : (
              <Text size="sm" c="dimmed">None</Text>
            )}
          </Group>
        </Table.Td>
        <Table.Td>
          <Group gap="xs" justify="flex-end">
            <Tooltip label="Edit Category">
              <ActionIcon variant="subtle" color="gray" onClick={() => handleEdit(category.id)}>
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
    );
  });

  return (
    <Paper>
      <Group justify="space-between" mb="lg">
        <Title order={2} c="deep-purple.7">Manage Categories</Title>
        <Button
          onClick={() => navigate('/category/new')}
          leftSection={<IconPlus size={18} />}
        >
          Create New Category
        </Button>
      </Group>

      {/* Filters */}
      <Stack gap="md" mb="lg">
        <Group align="flex-end">
          <TextInput
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1, minWidth: 300 }}
          />
          <Select
            placeholder="Filter by POI Type"
            value={typeFilter}
            onChange={setTypeFilter}
            data={getUniquePOITypes()}
            clearable
            style={{ minWidth: 150 }}
          />
          {(searchTerm || typeFilter) && (
            <Button variant="light" color="gray" onClick={clearFilters} leftSection={<IconX size={16} />}>
              Clear Filters
            </Button>
          )}
        </Group>


        {(searchTerm || typeFilter || sortBy !== 'name') && (
          <Text size="sm" c="dimmed">
            {(() => {
              const filteredCategories = filteredAndSortedCategories();
              const totalCategories = flattenCategories(categories).length;
              return `Showing ${filteredCategories.length} of ${totalCategories} categories`;
            })()}
          </Text>
        )}
      </Stack>

      {loading ? (
        <Text c="dimmed" ta="center" py="xl">
          Loading categories...
        </Text>
      ) : displayCategories.length > 0 ? (
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
                <Text fw={500}>Level</Text>
              </Table.Th>
              <Table.Th>
                <Text fw={500}>Full Path</Text>
              </Table.Th>
              <Table.Th>
                <UnstyledButton onClick={() => handleSortClick('poi_types')} style={{ width: '100%' }}>
                  <Group justify="space-between">
                    <Text fw={500}>POI Types</Text>
                    <Center>{getSortIcon('poi_types')}</Center>
                  </Group>
                </UnstyledButton>
              </Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          {categories.length === 0
            ? "No categories found. Create your first category to get started!"
            : "No categories match your current filters. Try adjusting your search criteria."
          }
        </Text>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={
          <Group gap="xs">
            <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
            <Text fw={600}>Confirm Category Deletion</Text>
          </Group>
        }
        centered
        size="md"
        styles={{
          title: {
            color: 'var(--mantine-color-red-7)',
          }
        }}
      >
        <Stack gap="lg">
          <Text>
            Are you sure you want to delete the category{' '}
            <Text component="span" fw={600} c="red.7">
              "{categoryToDelete?.name}"
            </Text>
            ?
          </Text>
          
          <Text size="sm" c="dimmed">
            This action will:
          </Text>
          
          <Box pl="md">
            <Text size="sm" c="dimmed" mb="xs">
              • Remove this category from all associated POIs
            </Text>
            <Text size="sm" c="dimmed" mb="xs">
              • Delete all child categories under this category
            </Text>
            <Text size="sm" c="dimmed">
              • This action cannot be undone
            </Text>
          </Box>

          <Group justify="flex-end" gap="md" mt="lg">
            <Button 
              variant="subtle" 
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={confirmDelete}
              leftSection={<IconTrash size={16} />}
            >
              Delete Category
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}

export default CategoryList;