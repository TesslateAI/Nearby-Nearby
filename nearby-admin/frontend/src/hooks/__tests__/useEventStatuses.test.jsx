import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

// Mock must be declared before the import that uses it
vi.mock('../../utils/api', () => ({
  default: { get: vi.fn() },
  api: { get: vi.fn() },
}));

import { api } from '../../utils/api';
import useEventStatuses from '../useEventStatuses';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_STATUSES = [
  {
    status: 'Scheduled',
    helper_text: 'Event is confirmed and scheduled to take place.',
    valid_transitions: [
      'Canceled',
      'Postponed',
      'Updated Date and/or Time',
      'Rescheduled',
      'Moved Online',
      'Unofficial Proposed Date',
    ],
  },
  {
    status: 'Canceled',
    helper_text: 'Event has been permanently canceled.',
    valid_transitions: ['Scheduled'],
  },
  {
    status: 'Postponed',
    helper_text: 'Event is temporarily on hold.',
    valid_transitions: ['Scheduled', 'Canceled', 'Rescheduled', 'Updated Date and/or Time'],
  },
];

// ---------------------------------------------------------------------------
// Test component — renders hook output into the DOM so @testing-library/react
// can inspect it without needing renderHook.
// ---------------------------------------------------------------------------

function HookHarness({ onResult }) {
  const result = useEventStatuses();
  onResult(result);
  const { statuses, loading } = result;

  return (
    <MantineProvider>
      <div>
        <span data-testid="loading">{String(loading)}</span>
        <span data-testid="count">{statuses.length}</span>
        {statuses.map((s) => (
          <span key={s.status} data-testid={`status-${s.status}`}>
            {s.status}
          </span>
        ))}
      </div>
    </MantineProvider>
  );
}

function makeResponse(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useEventStatuses', () => {
  it('fetches from GET /api/event-statuses on mount', async () => {
    api.get.mockResolvedValue(makeResponse(MOCK_STATUSES));

    const capturedResult = {};
    await act(async () => {
      render(<HookHarness onResult={(r) => Object.assign(capturedResult, r)} />);
    });

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/event-statuses');
  });

  it('populates statuses array after fetch resolves', async () => {
    api.get.mockResolvedValue(makeResponse(MOCK_STATUSES));

    await act(async () => {
      render(
        <MantineProvider>
          <HookHarness onResult={() => {}} />
        </MantineProvider>,
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('count').textContent).toBe('3');
    });

    expect(screen.getByTestId('status-Scheduled')).toBeInTheDocument();
    expect(screen.getByTestId('status-Canceled')).toBeInTheDocument();
    expect(screen.getByTestId('status-Postponed')).toBeInTheDocument();
  });

  it('getValidTransitions returns correct transitions for "Scheduled" status', async () => {
    api.get.mockResolvedValue(makeResponse(MOCK_STATUSES));

    let hookResult = {};

    await act(async () => {
      render(<HookHarness onResult={(r) => { hookResult = r; }} />);
    });

    await waitFor(() => {
      expect(hookResult.statuses.length).toBe(3);
    });

    const transitions = hookResult.getValidTransitions('Scheduled');
    expect(transitions).toEqual([
      'Canceled',
      'Postponed',
      'Updated Date and/or Time',
      'Rescheduled',
      'Moved Online',
      'Unofficial Proposed Date',
    ]);
  });

  it('getValidTransitions returns ["Scheduled"] for "Canceled" status', async () => {
    api.get.mockResolvedValue(makeResponse(MOCK_STATUSES));

    let hookResult = {};

    await act(async () => {
      render(<HookHarness onResult={(r) => { hookResult = r; }} />);
    });

    await waitFor(() => {
      expect(hookResult.statuses.length).toBe(3);
    });

    const transitions = hookResult.getValidTransitions('Canceled');
    expect(transitions).toEqual(['Scheduled']);
  });

  it('getHelperText returns helper text for a status', async () => {
    api.get.mockResolvedValue(makeResponse(MOCK_STATUSES));

    let hookResult = {};

    await act(async () => {
      render(<HookHarness onResult={(r) => { hookResult = r; }} />);
    });

    await waitFor(() => {
      expect(hookResult.statuses.length).toBe(3);
    });

    const text = hookResult.getHelperText('Scheduled');
    expect(text).toBe('Event is confirmed and scheduled to take place.');

    const canceledText = hookResult.getHelperText('Canceled');
    expect(canceledText).toBe('Event has been permanently canceled.');
  });

  it('getValidTransitions returns empty array for unknown status', async () => {
    api.get.mockResolvedValue(makeResponse(MOCK_STATUSES));

    let hookResult = {};

    await act(async () => {
      render(<HookHarness onResult={(r) => { hookResult = r; }} />);
    });

    await waitFor(() => {
      expect(hookResult.statuses.length).toBe(3);
    });

    expect(hookResult.getValidTransitions('UnknownStatus')).toEqual([]);
  });

  it('getHelperText returns empty string for unknown status', async () => {
    api.get.mockResolvedValue(makeResponse(MOCK_STATUSES));

    let hookResult = {};

    await act(async () => {
      render(<HookHarness onResult={(r) => { hookResult = r; }} />);
    });

    await waitFor(() => {
      expect(hookResult.statuses.length).toBe(3);
    });

    expect(hookResult.getHelperText('UnknownStatus')).toBe('');
  });
});
