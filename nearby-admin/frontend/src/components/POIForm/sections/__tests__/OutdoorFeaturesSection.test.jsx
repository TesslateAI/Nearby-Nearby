/**
 * Tests for OutdoorFeaturesSection — specifically the fishing_types reveal
 * condition fixed in issue #61.
 *
 * The fix changes the gate from `fishing_allowed !== 'no'` (which incorrectly
 * showed the checkboxes for 'other') to an explicit allowlist:
 * `['catch_release', 'catch_keep'].includes(fishing_allowed)`
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
// The fishing_types reveal lives in HuntingFishingSection, which was split out
// of OutdoorFeaturesSection during the POI-form section reorg.
import { HuntingFishingSection } from '../OutdoorFeaturesSection';

// RichTextEditor uses a TipTap editor that does not initialise cleanly in
// jsdom — stub it out so component tests can focus on conditional rendering.
vi.mock('../../RichTextEditor', () => ({
  default: ({ label }) => <div data-testid={`rte-${label}`} />,
}));

// ImageIntegration imports file-upload components; stub them.
vi.mock('../../ImageIntegration', () => ({
  PlaygroundPhotosUpload: () => null,
  shouldUseImageUpload: () => false,
}));

function Wrapper({ fishingAllowed = 'no' }) {
  const form = useForm({
    initialValues: {
      natural_features: [],
      outdoor_types: [],
      hunting_fishing_allowed: 'no',
      hunting_types: [],
      fishing_allowed: fishingAllowed,
      fishing_types: [],
      licenses_required: [],
      license_permit_details: '',
      playground_types: [],
      playground_surfaces: [],
      pets_allowed: 'no',
      pet_options: [],
      pet_policy: '',
      playground_photos: [],
    },
  });
  return (
    <MantineProvider>
      <HuntingFishingSection form={form} />
    </MantineProvider>
  );
}

describe('OutdoorFeaturesSection — fishing_types reveal (#61)', () => {
  it('hides Fishing Types section when fishing_allowed is "no"', () => {
    render(<Wrapper fishingAllowed="no" />);
    expect(screen.queryByText('Fishing Types')).toBeNull();
  });

  it('hides Fishing Types section when fishing_allowed is "other"', () => {
    render(<Wrapper fishingAllowed="other" />);
    expect(screen.queryByText('Fishing Types')).toBeNull();
  });

  it('shows Fishing Types section when fishing_allowed is "catch_release"', () => {
    render(<Wrapper fishingAllowed="catch_release" />);
    expect(screen.getByText('Fishing Types')).toBeTruthy();
  });

  it('shows Fishing Types section when fishing_allowed is "catch_keep"', () => {
    render(<Wrapper fishingAllowed="catch_keep" />);
    expect(screen.getByText('Fishing Types')).toBeTruthy();
  });
});
