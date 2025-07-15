import { useState, useEffect } from 'react';
import { Box, Checkbox, Group, Text, Pill, ScrollArea, TextInput, ActionIcon, Collapse, Stack, Loader } from '@mantine/core';
import { IconSearch, IconChevronRight } from '@tabler/icons-react';
import api from '../utils/api';
import { notifications } from '@mantine/notifications';

// This is a recursive component to render categories and their children
function CategoryTree({ categories, selected, onToggle, searchTerm, parentIsOpened = false }) {
  const [opened, setOpened] = useState({});

  const handleToggleCollapse = (id) => {
    setOpened(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(cat => {
    const nameMatch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const childMatch = cat.children && cat.children.some(child => 
      child.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return nameMatch || childMatch;
  });

  return (
    <Stack gap="xs">
      {filteredCategories.map(category => {
        const isOpened = opened[category.id] || (searchTerm.length > 0);
        const isSelected = selected.includes(category.id);
        
        return (
          <Box key={category.id}>
            <Group wrap="nowrap">
              {category.children && category.children.length > 0 && (
                <ActionIcon onClick={() => handleToggleCollapse(category.id)} size="sm" variant="transparent">
                  <IconChevronRight size={14} style={{ transform: isOpened ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </ActionIcon>
              )}
              <Checkbox
                label={category.name}
                checked={isSelected}
                onChange={() => onToggle(category.id, category)}
                styles={{ 
                    label: { 
                        color: isSelected ? 'var(--mantine-color-brand-green-8)' : 'inherit',
                        fontWeight: isSelected ? 500 : 400
                    } 
                }}
              />
            </Group>
            {category.children && category.children.length > 0 && (
              <Collapse in={isOpened}>
                <Box pl="xl" pt="xs">
                  {/* Recursive call for subcategories */}
                  <CategoryTree 
                    categories={category.children} 
                    selected={selected} 
                    onToggle={onToggle} 
                    searchTerm={searchTerm}
                    parentIsOpened={isOpened}
                  />
                </Box>
              </Collapse>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

export function CategorySelector({ value, onChange }) {
  const [allCategories, setAllCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories/tree');
        const data = await response.json();
        setAllCategories(data);

        const map = {};
        const flatten = (cats) => {
          cats.forEach(c => {
            map[c.id] = c.name;
            if (c.children) flatten(c.children);
          });
        };
        flatten(data);
        setCategoryMap(map);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: 'Failed to fetch categories.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleToggle = (id) => {
    const newSelection = value.includes(id) ? value.filter(v => v !== id) : [...value, id];
    onChange(newSelection);
  };

  const selectedPills = value
    .map(id => ({ id, name: categoryMap[id] }))
    .filter(cat => cat.name) // Filter out any IDs that might not have a name yet
    .map(cat => (
      <Pill key={cat.id} withRemoveButton onRemove={() => handleToggle(cat.id)}>
        {cat.name}
      </Pill>
    ));

  return (
    <div>
      <TextInput
        placeholder="Search for categories..."
        leftSection={<IconSearch size={16} />}
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.currentTarget.value)}
        mb="md"
      />
      <Text size="sm" fw={500} mb={selectedPills.length > 0 ? 'xs' : 0}>Selected:</Text>
      <Group mb="md" gap="xs">
        {selectedPills.length > 0 ? selectedPills : <Text size="sm" c="dimmed">None</Text>}
      </Group>
      <ScrollArea h={300} style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }} p="sm">
        {loading ? (
            <Group justify="center" pt="xl"><Loader /></Group>
        ) : (
            <CategoryTree categories={allCategories} selected={value} onToggle={handleToggle} searchTerm={searchTerm} />
        )}
      </ScrollArea>
    </div>
  );
}