import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FeaturedIdealForChips } from '../_shared';

// jsdom polyfill — Mantine v8 components touch ResizeObserver.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Harness wires a real @mantine/form so setFieldValue persists between clicks,
// and dumps ideal_for_key so assertions can read the stored value.
function Harness({ initialIdealFor = {}, initialKey = [] }) {
  const form = useForm({
    initialValues: {
      ideal_for: {
        atmosphere: [], age_group: [], social_settings: [],
        local_special: [], special_needs: [],
        ...initialIdealFor,
      },
      ideal_for_key: initialKey,
    },
  });
  return (
    <MantineProvider>
      <FeaturedIdealForChips form={form} />
      <div data-testid="key-dump">{JSON.stringify(form.values.ideal_for_key)}</div>
      <button
        data-testid="uncheck-A"
        onClick={() =>
          form.setFieldValue(
            'ideal_for.atmosphere',
            (form.values.ideal_for.atmosphere || []).filter((v) => v !== 'A'),
          )
        }
      >
        uncheck A
      </button>
    </MantineProvider>
  );
}

const dump = () => screen.getByTestId('key-dump').textContent;

describe('FeaturedIdealForChips (Featured / Key Ideal For top-3 picker)', () => {
  it('shows the placeholder when nothing is checked above', () => {
    render(<Harness />);
    expect(screen.getByTestId('featured-ideal-for-empty')).toHaveTextContent(
      /Select some Ideal For items above to populate this list\./,
    );
    expect(screen.queryByTestId('featured-ideal-for-counter')).not.toBeInTheDocument();
  });

  it('renders one chip per checked trait, unioned across groups', () => {
    render(
      <Harness initialIdealFor={{ atmosphere: ['A', 'B'], age_group: ['C'] }} />,
    );
    expect(screen.getByTestId('featured-chip-A')).toBeInTheDocument();
    expect(screen.getByTestId('featured-chip-B')).toBeInTheDocument();
    expect(screen.getByTestId('featured-chip-C')).toBeInTheDocument();
    expect(screen.getByTestId('featured-ideal-for-counter')).toHaveTextContent('0 / 3 featured');
  });

  it('features a trait into ideal_for_key on click', () => {
    render(<Harness initialIdealFor={{ atmosphere: ['A', 'B'] }} />);
    fireEvent.click(screen.getByTestId('featured-chip-A'));
    expect(dump()).toBe(JSON.stringify(['A']));
    expect(screen.getByTestId('featured-chip-A')).toHaveAttribute('data-selected', 'true');
    expect(screen.getByTestId('featured-ideal-for-counter')).toHaveTextContent('1 / 3 featured');
  });

  it('un-features on a second click', () => {
    render(<Harness initialIdealFor={{ atmosphere: ['A'] }} initialKey={['A']} />);
    expect(dump()).toBe(JSON.stringify(['A']));
    fireEvent.click(screen.getByTestId('featured-chip-A'));
    expect(dump()).toBe(JSON.stringify([]));
  });

  it('enforces the 3-item cap and locks remaining chips', () => {
    render(
      <Harness
        initialIdealFor={{ atmosphere: ['A', 'B', 'C', 'D'] }}
        initialKey={['A', 'B', 'C']}
      />,
    );
    expect(screen.getByTestId('featured-ideal-for-counter')).toHaveTextContent('3 / 3 featured');
    const fourth = screen.getByTestId('featured-chip-D');
    expect(fourth).toHaveAttribute('aria-disabled', 'true');
    // Clicking the locked 4th chip must NOT add it.
    fireEvent.click(fourth);
    expect(dump()).toBe(JSON.stringify(['A', 'B', 'C']));
  });

  it('prunes featured items that are no longer checked above (on mount)', () => {
    render(<Harness initialIdealFor={{ atmosphere: ['A'] }} initialKey={['A', 'Z']} />);
    // 'Z' was never a checked trait -> dropped from ideal_for_key.
    expect(dump()).toBe(JSON.stringify(['A']));
  });

  it('prunes a featured item when it is unchecked above (live)', () => {
    render(<Harness initialIdealFor={{ atmosphere: ['A', 'B'] }} initialKey={['A']} />);
    expect(dump()).toBe(JSON.stringify(['A']));
    fireEvent.click(screen.getByTestId('uncheck-A'));
    expect(dump()).toBe(JSON.stringify([]));
  });
});
