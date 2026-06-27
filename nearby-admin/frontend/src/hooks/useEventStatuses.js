import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

/**
 * Fetches event statuses from GET /api/event-statuses and exposes helper
 * functions for looking up valid transitions and helper text by status name.
 */
export default function useEventStatuses() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatuses() {
      try {
        const response = await api.get('/event-statuses');
        if (!cancelled && response && response.ok) {
          const data = await response.json();
          setStatuses(data);
        }
      } catch (_err) {
        // Silently fail — component falls back to empty array
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStatuses();

    return () => {
      cancelled = true;
    };
  }, []);

  const getValidTransitions = useCallback(
    (statusName) => {
      const found = statuses.find((s) => s.status === statusName);
      return found ? found.valid_transitions : [];
    },
    [statuses],
  );

  const getHelperText = useCallback(
    (statusName) => {
      const found = statuses.find((s) => s.status === statusName);
      return found ? found.helper_text : '';
    },
    [statuses],
  );

  return { statuses, loading, getValidTransitions, getHelperText };
}
