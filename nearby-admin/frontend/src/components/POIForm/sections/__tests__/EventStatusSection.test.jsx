import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { EventStatusSection } from '../EventSpecificSections';

// ---------------------------------------------------------------------------
// Mock useEventStatuses — static data, no network required
// ---------------------------------------------------------------------------

vi.mock('../../../../hooks/useEventStatuses', () => ({
  default: () => ({
    statuses: [
      {
        status: 'Scheduled',
        helper_text: 'Confirmed and happening.',
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
        helper_text: 'Temporarily on hold.',
        valid_transitions: ['Scheduled', 'Canceled', 'Rescheduled', 'Updated Date and/or Time'],
      },
    ],
    loading: false,
    getValidTransitions: (s) => {
      const map = {
        Scheduled: [
          'Canceled',
          'Postponed',
          'Updated Date and/or Time',
          'Rescheduled',
          'Moved Online',
          'Unofficial Proposed Date',
        ],
        Canceled: ['Scheduled'],
        Postponed: ['Scheduled', 'Canceled', 'Rescheduled', 'Updated Date and/or Time'],
      };
      return map[s] || [];
    },
    getHelperText: (s) => {
      const map = {
        Scheduled: 'Confirmed and happening.',
        Canceled: 'Event has been permanently canceled.',
        Postponed: 'Temporarily on hold.',
      };
      return map[s] || '';
    },
  }),
}));

// ---------------------------------------------------------------------------
// TestWrapper — provides a real Mantine form with sensible initial values
// ---------------------------------------------------------------------------

function TestWrapper({ initialStatus = 'Scheduled', ...props }) {
  const form = useForm({
    initialValues: {
      event: {
        event_status: initialStatus,
        cancellation_paragraph: '',
        status_explanation: '',
        contact_organizer_toggle: false,
        new_event_link: '',
        rescheduled_from_event_id: null,
      },
    },
  });

  return (
    <MantineProvider>
      <EventStatusSection form={form} {...props} />
    </MantineProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventStatusSection', () => {
  it('renders current status as a colored badge', () => {
    render(<TestWrapper initialStatus="Scheduled" />);
    // The Badge renders the status name as its text content
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('shows 6 valid transition action buttons for "Scheduled" status', () => {
    render(<TestWrapper initialStatus="Scheduled" />);

    // Six transitions: Cancel, Postpone, Update Date/Time, Reschedule, Move Online, Unofficial Date
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /postpone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update date/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reschedule/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /move online/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unofficial/i })).toBeInTheDocument();
  });

  it('shows only a "Return to Scheduled" button for "Canceled" status', () => {
    render(<TestWrapper initialStatus="Canceled" />);

    expect(
      screen.getByRole('button', { name: /return to scheduled/i }),
    ).toBeInTheDocument();

    // None of the Scheduled-state action buttons should be present
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^postpone$/i })).not.toBeInTheDocument();
  });

  it('clicking "Cancel" action reveals cancellation_paragraph textarea and contact organizer toggle', async () => {
    render(<TestWrapper initialStatus="Scheduled" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    });

    // After clicking Cancel, the status changes to "Canceled" and the
    // cancellation_paragraph field and contact organizer toggle should appear.
    expect(
      screen.getByText(/cancellation|postponement/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contact organizer/i),
    ).toBeInTheDocument();
  });

  it('clicking "Postpone" shows status_explanation field and contact organizer toggle', async () => {
    render(<TestWrapper initialStatus="Scheduled" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /postpone/i }));
    });

    // status_explanation textarea should appear
    expect(screen.getByText(/status explanation/i)).toBeInTheDocument();
    // contact organizer toggle should appear
    expect(screen.getByText(/contact organizer/i)).toBeInTheDocument();
  });

  it('displays helper text for the current status', () => {
    render(<TestWrapper initialStatus="Scheduled" />);
    expect(screen.getByText('Confirmed and happening.')).toBeInTheDocument();
  });

  it('displays helper text for Canceled status', () => {
    render(<TestWrapper initialStatus="Canceled" />);
    expect(screen.getByText('Event has been permanently canceled.')).toBeInTheDocument();
  });

  it('clicking "Reschedule" opens the RescheduleModal', async () => {
    render(<TestWrapper initialStatus="Scheduled" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reschedule/i }));
    });

    // Mantine v8 Modal uses a portal + CSS transition; waitFor polls until
    // the modal content appears in the DOM.
    await waitFor(
      () => {
        expect(screen.getByText('New Start Date & Time')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('clicking "Move Online" shows status_explanation and online event URL field', async () => {
    render(<TestWrapper initialStatus="Scheduled" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /move online/i }));
    });

    expect(screen.getByText(/status explanation/i)).toBeInTheDocument();
    expect(screen.getByText(/online event url/i)).toBeInTheDocument();
  });
});
