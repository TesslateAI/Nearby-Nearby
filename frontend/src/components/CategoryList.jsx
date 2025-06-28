import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Button, 
  Group, 
  Title, 
  Paper, 
  ActionIcon, 
  Tooltip, 
  Text, 
  Box, 
  Stack, 
  Collapse, 
  TextInput,
  ScrollArea,
  Loader,
  Modal
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { 
  IconPencil, 
  IconTrash, 
  IconPlus, 
  IconChevronRight, 
  IconSearch,
  IconAlertTriangle
} from '@tabler/icons-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Recursive component to render category tree
function CategoryTreeItem({ category, onEdit, onDelete, searchTerm, depth = 0, isEven = false }) {
  const [opened, setOpened] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isVisible = !searchTerm || 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (hasChildren && category.children.some(child => 
      child.name.toLowerCase().includes(searchTerm.toLowerCase())
    ));

  if (!isVisible) return null;

  const handleToggle = () => {
    if (hasChildren) {
      setOpened(!opened);
    }
  };

  // Determine background color based on depth - same color for each level, alternating pattern
  const getBackgroundColor = () => {
    if (depth === 0) {
      return isEven ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-gray-1)';
    } else {
      return 'transparent'; // All children - no background
    }
  };

  // Get border color based on depth
  const getBorderColor = () => {
    if (depth === 0) return 'var(--mantine-color-deep-purple-3)';
    return 'none'; // No border for children
  };

  return (
    <Box>
      <Group 
        wrap="nowrap" 
        style={{ 
          paddingLeft: depth * 24,
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 'var(--mantine-radius-sm)',
          transition: 'background-color 0.2s ease',
          cursor: hasChildren ? 'pointer' : 'default',
          backgroundColor: getBackgroundColor(),
          borderLeft: depth > 0 ? `3px solid ${getBorderColor()}` : 'none',
          marginLeft: depth > 0 ? 8 : 0,
        }}
        styles={{
          root: {
            '&:hover': {
              backgroundColor: 'var(--mantine-color-blue-0)',
            }
          }
        }}
        onClick={handleToggle}
      >
        {hasChildren ? (
          <ActionIcon 
            size="sm" 
            variant="transparent" 
            style={{ 
              transform: opened ? 'rotate(90deg)' : 'none', 
              transition: 'transform 0.2s ease',
              color: depth === 0 ? 'var(--mantine-color-deep-purple-6)' : 'var(--mantine-color-gray-6)'
            }}
          >
            <IconChevronRight size={14} />
          </ActionIcon>
        ) : (
          <Box style={{ width: 22 }} />
        )}
        
        <Text 
          style={{ 
            flex: 1,
            fontWeight: depth === 0 ? 600 : 400,
            color: depth === 0 
              ? 'var(--mantine-color-deep-purple-8)' 
              : 'var(--mantine-color-gray-7)'
          }}
        >
          {category.name}
        </Text>
        
        <Group gap="xs" onClick={(e) => e.stopPropagation()}>
          <Tooltip label="Edit Category">
            <ActionIcon 
              variant="subtle" 
              color={depth === 0 ? "deep-purple" : "gray"}
              size="sm"
              onClick={() => onEdit(category.id)}
            >
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete Category">
            <ActionIcon 
              variant="subtle" 
              color="red" 
              size="sm"
              onClick={() => onDelete(category.id, category.name)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      
      {hasChildren && (
        <Collapse in={opened || searchTerm.length > 0}>
          <Stack gap={0}>
            {category.children.map((child, index) => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                onEdit={onEdit}
                onDelete={onDelete}
                searchTerm={searchTerm}
                depth={depth + 1}
                isEven={index % 2 === 0}
              />
            ))}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
}

function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/categories/tree`);
      setCategories(response.data);
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
      await axios.delete(`${API_URL}/api/categories/${categoryToDelete.id}`);
      notifications.show({
        title: 'Success!',
        message: `Category "${categoryToDelete.name}" was deleted.`,
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
    } finally {
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleEdit = (categoryId) => {
    navigate(`/category/${categoryId}/edit`);
  };

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

      <TextInput
        placeholder="Search categories..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.currentTarget.value)}
        mb="md"
      />

      <ScrollArea 
        h={500} 
        style={{ 
          border: '1px solid var(--mantine-color-gray-3)', 
          borderRadius: 'var(--mantine-radius-md)',
          backgroundColor: 'white'
        }}
      >
        {loading ? (
          <Group justify="center" pt="xl">
            <Loader />
          </Group>
        ) : (
          <Box p="md">
            {categories.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No categories found. Create your first category to get started!
              </Text>
            ) : (
              <Stack gap={0}>
                {categories.map((category, index) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    searchTerm={searchTerm}
                    isEven={index % 2 === 0}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </ScrollArea>

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