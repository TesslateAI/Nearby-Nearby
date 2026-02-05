import { useCallback, useEffect, useState } from 'react';
import { Select, Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import api from '../utils/api';

export function PrimaryTypeSelector({ value, onChange, error }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPrimaryTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/primary-types');
      if (res.ok) {
        const data = await res.json();
        const formatted = (data || []).map((pt) => ({ value: pt.id, label: pt.name }));
        setOptions(formatted);
      } else {
        console.error('Failed to fetch primary types:', res.status, res.statusText);
      }
    } catch (e) {
      console.error('Error fetching primary types:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrimaryTypes();
  }, [fetchPrimaryTypes]);

  return (
    <div>
      <Group justify="space-between" mb="xs" align="flex-end">
        <div style={{ flex: 1 }}>
          <Select
            label="Primary Type"
            description="Select one primary type for this POI"
            placeholder="Choose a primary type"
            data={options}
            value={value}
            onChange={onChange}
            searchable
            clearable
            error={error}
            disabled={loading}
            nothingFoundMessage="No primary types found"
          />
        </div>
        <Button
          variant="light"
          size="xs"
          onClick={fetchPrimaryTypes}
          loading={loading}
        >
          <IconRefresh size={16} />
        </Button>
      </Group>
    </div>
  );
}

export default PrimaryTypeSelector;
