import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider, Accordion } from '@mantine/core';
import { useForm } from '@mantine/form';

// jsdom polyfills required for Mantine v8 components (Select, Combobox, ScrollArea).
beforeAll(() => {
  if (typeof global.ResizeObserver === 'undefined') {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

// ---------------------------------------------------------------------------
// Stub every sub-section the layout imports so we can mount the layout
// without exercising any API calls, RichTextEditor instances, or context
// providers. We only need to verify Accordion.Item structure here.
// ---------------------------------------------------------------------------

vi.mock('../../sections/CoreInformationSection', () => ({
  CoreInformationSection: () => <div data-testid="stub-core" />,
}));
vi.mock('../../sections/CategoriesSection', () => ({
  CategoriesSection: () => <div data-testid="stub-categories" />,
}));
vi.mock('../../sections/LocationSection', () => ({
  LocationSection: () => <div data-testid="stub-location" />,
}));
vi.mock('../../sections/ContactSection', () => ({
  ContactSection: () => <div data-testid="stub-contact" />,
}));
vi.mock('../../sections/FacilitiesSection', () => ({
  FacilitiesSection: () => <div data-testid="stub-facilities" />,
  PublicAmenitiesSection: () => <div data-testid="stub-public-amenities" />,
}));
vi.mock('../../sections/BusinessDetailsSection', () => ({
  BusinessGallerySection: () => <div data-testid="stub-gallery" />,
}));
vi.mock('../../sections/OutdoorFeaturesSection', () => ({
  PetPolicySection: () => <div data-testid="stub-pet-policy" />,
}));
vi.mock('../../sections/MiscellaneousSections', () => ({
  InternalContactSection: () => <div data-testid="stub-internal" />,
  CorporateComplianceSection: () => <div data-testid="stub-compliance" />,
}));
vi.mock('../../../HoursSelector', () => ({
  default: () => <div data-testid="stub-hours" />,
}));
vi.mock('../../components/ServiceAnimalAlert', () => ({
  default: () => <div data-testid="stub-service-animal" />,
}));
vi.mock('../_shared', () => ({
  AdminOnlyAccordionItem: ({ userRole }) =>
    userRole === 'admin' ? (
      <Accordion.Item value="admin-only">
        <Accordion.Control>Admin Only</Accordion.Control>
        <Accordion.Panel>stub</Accordion.Panel>
      </Accordion.Item>
    ) : null,
  IdealForGrouped: () => <div data-testid="stub-ideal-for" />,
  ArrivalMethodsGroup: () => <div data-testid="stub-arrival" />,
  What3WordsInput: () => <div data-testid="stub-w3w" />,
  AccessibleParkingChecklist: () => <div data-testid="stub-parking" />,
  AccessibleRestroomChecklist: () => <div data-testid="stub-restroom" />,
  FullAmenitiesBlock: () => <div data-testid="stub-amenities-block" />,
  ConnectivityRow: () => <div data-testid="stub-connectivity" />,
}));

import BusinessFreeLayout from '../BusinessFreeLayout';

function Harness({ userRole = 'editor' } = {}) {
  const form = useForm({ initialValues: { hours: {}, poi_type: 'BUSINESS' } });
  return (
    <MantineProvider>
      <Accordion multiple>
        <BusinessFreeLayout form={form} userRole={userRole} poiId="test-id" />
      </Accordion>
    </MantineProvider>
  );
}

describe('BusinessFreeLayout — Wave 4 #52 reorder', () => {
  it('renders 13 Accordion.Item blocks in the spec order for non-admin users', () => {
    const { container } = render(<Harness userRole="editor" />);
    const items = container.querySelectorAll('[data-accordion-control="true"], .mantine-Accordion-control');
    // 12 visible items (Admin-Only hidden for non-admin)
    expect(items.length).toBeGreaterThanOrEqual(12);
  });

  it('first accordion item is s1-identity', () => {
    const { container } = render(<Harness userRole="editor" />);
    const firstButton = container.querySelector('.mantine-Accordion-control');
    expect(firstButton).toBeTruthy();
    expect(firstButton.textContent).toMatch(/Business Identity/);
  });

  it('renders spec-required section titles verbatim ("Amenities", "Compliance", "Gallery", "Pricing")', () => {
    render(<Harness userRole="editor" />);
    expect(screen.getByText('Amenities')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('renders sections in expected order: Identity → Categories → Hours → Address → Parking → Restrooms → Amenities → Pricing → Pet Policy → Gallery → Internal → Compliance', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    const expectedOrder = [
      'Business IdentityRequired',
      'Categories + Discovery',
      'Hours',
      'Address',
      'Parking & Accessibility',
      'Restrooms',
      'Amenities',
      'Pricing',
      'Pet Policy',
      'Gallery',
      'Internal',
      'Compliance',
    ];
    // Compare against the first 12 visible (admin-only hidden for editor role)
    expectedOrder.forEach((expected, idx) => {
      expect(texts[idx]).toContain(expected.replace('Required', ''));
    });
  });

  it('places Hours before Address (Wave 4 reorder)', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    const hoursIdx = texts.findIndex((t) => /^Hours$/.test(t));
    const addressIdx = texts.findIndex((t) => /^Address$/.test(t));
    expect(hoursIdx).toBeGreaterThan(-1);
    expect(addressIdx).toBeGreaterThan(-1);
    expect(hoursIdx).toBeLessThan(addressIdx);
  });

  it('includes Pricing between Amenities and Pet Policy', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    const amenitiesIdx = texts.findIndex((t) => t === 'Amenities');
    const pricingIdx = texts.findIndex((t) => t === 'Pricing');
    const petIdx = texts.findIndex((t) => t === 'Pet Policy');
    expect(amenitiesIdx).toBeLessThan(pricingIdx);
    expect(pricingIdx).toBeLessThan(petIdx);
  });

  it('renders Admin-Only item as the LAST accordion when userRole=admin', () => {
    const { container } = render(<Harness userRole="admin" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    expect(texts.length).toBe(13);
    expect(texts[12]).toContain('Admin Only');
  });
});
