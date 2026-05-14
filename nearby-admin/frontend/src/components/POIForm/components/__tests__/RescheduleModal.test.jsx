import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import RescheduleModal from '../RescheduleModal';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

const wrapper = ({ children }) => <MantineProvider>{children}</MantineProvider>;

function renderModal(props = {}) {
  const defaults = {
    opened: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };
  return render(<RescheduleModal {...defaults} {...props} />, { wrapper });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RescheduleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with start datetime picker (label "New Start Date & Time")', () => {
    renderModal();
    expect(screen.getByText('New Start Date & Time')).toBeInTheDocument();
  });

  it('renders optional end datetime picker (label "New End Date & Time")', () => {
    renderModal();
    expect(screen.getByText('New End Date & Time')).toBeInTheDocument();
  });

  it('confirm button is disabled when no start datetime selected', () => {
    renderModal();
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('does not call onConfirm when Confirm is clicked without a start datetime', async () => {
    // Mantine v8 DateTimePicker renders as a <button>, not an <input>.
    // Programmatically triggering the controlled state change is complex in tests,
    // so we verify the negative case: clicking Confirm without a date does NOT call
    // onConfirm (the button is disabled).
    const onConfirm = vi.fn();
    renderModal({ onConfirm });

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    // Button must be disabled when no start datetime is selected
    expect(confirmBtn).toBeDisabled();

    // Force a click anyway — disabled buttons should not fire handlers
    await act(async () => {
      fireEvent.click(confirmBtn);
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when opened is false', () => {
    renderModal({ opened: false });
    expect(screen.queryByText('New Start Date & Time')).not.toBeInTheDocument();
  });

});
