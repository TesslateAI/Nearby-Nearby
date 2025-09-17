import { useState, useEffect } from 'react';
import { Checkbox, Stack, Accordion, Text, Group, Badge, SimpleGrid } from '@mantine/core';
import { IDEAL_FOR_OPTIONS } from '../utils/constants';

export function IdealForSelector({ value = [], onChange, keyIdealFor = [], maxSelections, showAll = true }) {
  const [selectedValues, setSelectedValues] = useState(value);

  // Sync internal state with external value prop
  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  // Group options by their group property
  const groupedOptions = IDEAL_FOR_OPTIONS.reduce((acc, option) => {
    const group = option.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {});

  // When key ideal for changes, update the main selections
  useEffect(() => {
    if (keyIdealFor && keyIdealFor.length > 0) {
      // Find matching values in the full ideal for list
      // keyIdealFor contains string values, we need to match them with IDEAL_FOR_OPTIONS
      const matchingValues = IDEAL_FOR_OPTIONS
        .filter(opt => keyIdealFor.includes(opt.value) || keyIdealFor.includes(opt.label))
        .map(opt => opt.value);

      // Merge with existing selections (avoid duplicates)
      const newValues = [...new Set([...selectedValues, ...matchingValues])];
      setSelectedValues(newValues);
      onChange(newValues);
    }
  }, [keyIdealFor]);

  const handleChange = (optionValue, checked) => {
    let newValues;
    if (checked) {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return; // Don't allow more selections
      }
      newValues = [...selectedValues, optionValue];
    } else {
      newValues = selectedValues.filter(v => v !== optionValue);
    }
    setSelectedValues(newValues);
    onChange(newValues);
  };

  const isDisabled = (optionValue) => {
    return maxSelections && 
           selectedValues.length >= maxSelections && 
           !selectedValues.includes(optionValue);
  };

  if (!showAll) {
    // Simple grid view for free listings
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
        {IDEAL_FOR_OPTIONS.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            checked={selectedValues.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.currentTarget.checked)}
            disabled={isDisabled(option.value)}
          />
        ))}
      </SimpleGrid>
    );
  }

  // Full grouped view for paid listings
  return (
    <Stack>
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={500}>Select all that apply to your POI</Text>
        {maxSelections && (
          <Badge color="blue" variant="light">
            {selectedValues.length} / {maxSelections} selected
          </Badge>
        )}
      </Group>
      
      <Accordion multiple defaultValue={Object.keys(groupedOptions)}>
        {Object.entries(groupedOptions).map(([group, options]) => (
          <Accordion.Item key={group} value={group}>
            <Accordion.Control>
              <Group justify="space-between">
                <Text fw={500}>{group}</Text>
                <Badge size="sm" variant="dot">
                  {options.filter(opt => selectedValues.includes(opt.value)).length} selected
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                {options.map((option) => (
                  <Checkbox
                    key={option.value}
                    label={option.label}
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => handleChange(option.value, e.currentTarget.checked)}
                    disabled={isDisabled(option.value)}
                  />
                ))}
              </SimpleGrid>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}

export default IdealForSelector;