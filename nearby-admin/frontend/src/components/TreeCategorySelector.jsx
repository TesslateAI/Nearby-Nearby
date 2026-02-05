import React, { useState, useEffect } from 'react';
import { Checkbox, Stack, Text, Group, Loader, Collapse, ActionIcon, Badge } from '@mantine/core';
import { IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import api from '../utils/api';

/**
 * Recursive tree node component for category selection
 */
const CategoryTreeNode = ({ category, selectedIds, onToggle, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedIds.includes(category.id);
  const indentation = depth * 24; // 24px per level

  // Check if any descendant is selected
  const hasSelectedDescendant = (cat) => {
    if (selectedIds.includes(cat.id)) return true;
    if (cat.children) {
      return cat.children.some(child => hasSelectedDescendant(child));
    }
    return false;
  };

  const descendantSelected = hasSelectedDescendant(category);

  return (
    <Stack gap="xs">
      <Group gap="xs" style={{ paddingLeft: `${indentation}px` }} wrap="nowrap">
        {hasChildren ? (
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ minWidth: 24 }}
          >
            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </ActionIcon>
        ) : (
          <div style={{ minWidth: 24 }} /> // Spacer for alignment
        )}

        <Checkbox
          checked={isSelected}
          onChange={(event) => onToggle(category.id, event.currentTarget.checked)}
          label={
            <Group gap="xs">
              <Text size="sm">{category.name}</Text>
              {depth === 0 && <Badge size="xs" color="grape">Root</Badge>}
              {depth === 1 && <Badge size="xs" color="blue">Level 1</Badge>}
              {depth === 2 && <Badge size="xs" color="teal">Level 2</Badge>}
              {depth >= 3 && <Badge size="xs" color="gray">Level {depth}</Badge>}
              {!isSelected && descendantSelected && (
                <Badge size="xs" variant="outline" color="gray">Child selected</Badge>
              )}
            </Group>
          }
          styles={{
            label: { cursor: 'pointer' }
          }}
        />
      </Group>

      {hasChildren && (
        <Collapse in={isExpanded}>
          <Stack gap="xs">
            {category.children.map(child => (
              <CategoryTreeNode
                key={child.id}
                category={child}
                selectedIds={selectedIds}
                onToggle={onToggle}
                depth={depth + 1}
              />
            ))}
          </Stack>
        </Collapse>
      )}
    </Stack>
  );
};

/**
 * Tree-based category selector for POI forms
 * Shows categories in a hierarchical tree structure with checkboxes
 */
export const TreeCategorySelector = React.memo(function TreeCategorySelector({
  value = [],
  onChange,
  poiType,
  error,
  label
}) {
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!poiType) return;

    const fetchCategoryTree = async () => {
      setLoading(true);
      try {
        // Use the new tree endpoint for hierarchical data
        const response = await api.get(`/categories/tree/${poiType}`);
        if (response.ok) {
          const data = await response.json();
          setCategoryTree(data);
        } else {
          console.error('Failed to fetch category tree:', response.status);
        }
      } catch (error) {
        console.error('Error fetching category tree:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryTree();
  }, [poiType]);

  const handleToggle = (categoryId, checked) => {
    const newValue = checked
      ? [...value, categoryId]
      : value.filter(id => id !== categoryId);
    onChange(newValue);
  };

  // Custom label based on POI type
  const getLabel = () => {
    if (label) return label;

    switch(poiType) {
      case 'BUSINESS':
        return 'Business Categories';
      case 'SERVICES':
        return 'Service Categories';
      case 'PARK':
        return 'Park Categories & Things to Do';
      case 'TRAIL':
        return 'Trail Categories & Features';
      case 'EVENT':
        return 'Event Categories';
      case 'YOUTH_ACTIVITIES':
        return 'Youth Activity Categories';
      case 'JOBS':
        return 'Job Categories';
      case 'VOLUNTEER_OPPORTUNITIES':
        return 'Volunteer Opportunity Categories';
      case 'DISASTER_HUBS':
        return 'Disaster Hub Categories';
      default:
        return 'Categories';
    }
  };

  if (!poiType) {
    return (
      <div>
        <Text size="sm" fw={500} mb="xs">{getLabel()}</Text>
        <Text size="sm" c="dimmed">Select a POI type first to see available categories</Text>
      </div>
    );
  }

  return (
    <Stack gap="xs">
      <div>
        <Text size="sm" fw={500} mb="xs">{getLabel()}</Text>
        <Text size="xs" c="dimmed" mb="md">
          Select all categories that apply (from any level). Expand/collapse to navigate the tree.
        </Text>
      </div>

      {loading ? (
        <Group gap="xs">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading categories...</Text>
        </Group>
      ) : categoryTree.length === 0 ? (
        <Text size="sm" c="dimmed">No categories found for this POI type</Text>
      ) : (
        <Stack
          gap="xs"
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 'var(--mantine-radius-sm)',
            padding: 'var(--mantine-spacing-md)',
            maxHeight: '400px',
            overflowY: 'auto',
            backgroundColor: error ? 'var(--mantine-color-red-0)' : undefined
          }}
        >
          {categoryTree.map(category => (
            <CategoryTreeNode
              key={category.id}
              category={category}
              selectedIds={value}
              onToggle={handleToggle}
              depth={0}
            />
          ))}
        </Stack>
      )}

      {value.length > 0 && (
        <Text size="xs" c="dimmed">
          {value.length} {value.length === 1 ? 'category' : 'categories'} selected
        </Text>
      )}

      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </Stack>
  );
});

export default TreeCategorySelector;
