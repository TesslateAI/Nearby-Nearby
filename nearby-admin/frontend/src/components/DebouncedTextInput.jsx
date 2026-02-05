import { useState, useEffect, useRef } from 'react';
import { TextInput } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';

/**
 * DebouncedTextInput - A TextInput that uses local state and debouncing
 * to prevent lag when typing quickly.
 *
 * This component maintains its own internal state and only updates the
 * parent form after the user stops typing for 300ms, preventing expensive
 * re-renders of the entire form on every keystroke.
 */
export function DebouncedTextInput({ value: externalValue, onChange, ...props }) {
  const [internalValue, setInternalValue] = useState(externalValue || '');
  const isInitialMount = useRef(true);

  // Debounced callback to update parent form
  const debouncedOnChange = useDebouncedCallback((newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  }, 300);

  // Sync external value to internal state (only on initial load or external changes)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only update internal value if external value changed from outside
    // (not from our own debounced update)
    if (externalValue !== undefined && externalValue !== internalValue) {
      setInternalValue(externalValue || '');
    }
  }, [externalValue]);

  const handleChange = (event) => {
    const newValue = event.currentTarget.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  };

  return (
    <TextInput
      {...props}
      value={internalValue}
      onChange={handleChange}
    />
  );
}

export default DebouncedTextInput;
