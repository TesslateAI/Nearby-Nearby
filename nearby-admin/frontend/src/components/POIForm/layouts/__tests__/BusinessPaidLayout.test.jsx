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
vi.mock('../../sections/BusinessDetailsSection', () => ({
  BusinessDetailsSection: () => <div data-testid="stub-business-details" />,
  MenuBookingSection: () => <div data-testid="stub-menu" />,
  BusinessGallerySection: () => <div data-testid="stub-gallery" />,
  BusinessEntrySection: () => <div data-testid="stub-entry" />,
}));
vi.mock('../../sections/FacilitiesSection', () => ({
  FacilitiesSection: () => <div data-testid="stub-facilities" />,
  PublicAmenitiesSection: () => <div data-testid="stub-public-amenities" />,
  RentalsSection: () => <div data-testid="stub-rentals" />,
}));
vi.mock('../../sections/OutdoorFeaturesSection', () => ({
  PetPolicySection: () => <div data-testid="stub-pet-policy" />,
  PlaygroundSection: () => <div data-testid="stub-playground" />,
}));
vi.mock('../../sections/MiscellaneousSections', () => ({
  InternalContactSection: () => <div data-testid="stub-internal" />,
  CommunityConnectionsSection: () => <div data-testid="stub-community" />,
  CorporateComplianceSection: () => <div data-testid="stub-compliance" />,
}));
vi.mock('../../../HoursSelector', () => ({
  default: () => <div data-testid="stub-hours" />,
}));
vi.mock('../../../DynamicAttributeForm', () => ({
  default: () => <div data-testid="stub-attrs" />,
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
  FullAmenitiesBlock: () => <div data-testid="stub-amenities-block" />,
  ConnectivityRow: () => <div data-testid="stub-connectivity" />,
  AlcoholAvailableSelect: () => <div data-testid="stub-alcohol" />,
  PAYMENT_METHODS: [],
  DISCOUNT_TYPES: [],
}));

import BusinessPaidLayout from '../BusinessPaidLayout';

function Harness({ userRole = 'editor' } = {}) {
  const form = useForm({
    initialValues: {
      hours: {},
      poi_type: 'BUSINESS',
      playground_available: false,
      smoking_allowed: false,
    },
  });
  return (
    <MantineProvider>
      <Accordion multiple>
        <BusinessPaidLayout form={form} userRole={userRole} poiId="test-id" />
      </Accordion>
    </MantineProvider>
  );
}

// Spec-verbatim expected order — 20 data sections + Admin-Only last.
const EXPECTED_ORDER = [
  'Business Identity',          // s1
  'Categories + Discovery',     // s2
  'Hours',                      // s3
  'Address',                    // s4
  'Parking & Accessibility',    // s5
  'Contact & Social Media',     // s6
  'Business Details',           // s7
  'Pricing',                    // s8
  'Menu & Booking',             // s9
  'Business Entry',             // s10
  'Gallery',                    // s11
  'Payments & Discounts',       // s12
  'Amenities & Facilities',     // s13
  'Restrooms',                  // s14
  'Alcohol + Smoking',          // s15
  'Pet Policy',                 // s16
  'Playground Information',     // s17
  'Rentals',                    // s18
  'Internal & Compliance',      // s19
  'Dynamic Attributes',         // s20
];

describe('BusinessPaidLayout — Wave 4 #53 18-section reorder', () => {
  it('renders all 20 data sections for non-admin users in spec order', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    expect(texts.length).toBe(20);
    EXPECTED_ORDER.forEach((expected, idx) => {
      expect(texts[idx]).toContain(expected);
    });
  });

  it('first item is s1-identity (Business Identity)', () => {
    const { container } = render(<Harness userRole="editor" />);
    const firstButton = container.querySelector('.mantine-Accordion-control');
    expect(firstButton).toBeTruthy();
    expect(firstButton.textContent).toMatch(/Business Identity/);
  });

  it('last data item is s20-attrs (Dynamic Attributes)', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const last = controls[controls.length - 1];
    expect(last.textContent.trim()).toBe('Dynamic Attributes');
  });

  it('Admin-Only is the LAST accordion when userRole=admin', () => {
    const { container } = render(<Harness userRole="admin" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    expect(texts.length).toBe(21);
    expect(texts[20]).toContain('Admin Only');
  });

  it('renders spec-verbatim section titles ("Amenities & Facilities", "Pricing", "Gallery", "Menu & Booking", "Restrooms")', () => {
    render(<Harness userRole="editor" />);
    expect(screen.getByText('Amenities & Facilities')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.getByText('Menu & Booking')).toBeInTheDocument();
    expect(screen.getByText('Restrooms')).toBeInTheDocument();
    expect(screen.getByText('Rentals')).toBeInTheDocument();
    expect(screen.getByText('Alcohol + Smoking')).toBeInTheDocument();
  });

  it('places Hours (s3) before Address (s4) per Wave 4 reorder', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    const hoursIdx = texts.findIndex((t) => /^Hours$/.test(t));
    const addressIdx = texts.findIndex((t) => /^Address$/.test(t));
    expect(hoursIdx).toBeGreaterThan(-1);
    expect(addressIdx).toBeGreaterThan(-1);
    expect(hoursIdx).toBeLessThan(addressIdx);
  });

  it('places Pricing (s8) between Business Details (s7) and Menu & Booking (s9)', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    const detailsIdx = texts.findIndex((t) => t === 'Business Details');
    const pricingIdx = texts.findIndex((t) => t === 'Pricing');
    const menuIdx = texts.findIndex((t) => t === 'Menu & Booking');
    expect(detailsIdx).toBeLessThan(pricingIdx);
    expect(pricingIdx).toBeLessThan(menuIdx);
  });

  it('places Rentals (s18) after Playground (s17) and before Internal & Compliance (s19)', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    const playgroundIdx = texts.findIndex((t) => t === 'Playground Information');
    const rentalsIdx = texts.findIndex((t) => t === 'Rentals');
    const internalIdx = texts.findIndex((t) => t === 'Internal & Compliance');
    expect(playgroundIdx).toBeLessThan(rentalsIdx);
    expect(rentalsIdx).toBeLessThan(internalIdx);
  });

  it('places Alcohol + Smoking (s15) between Restrooms (s14) and Pet Policy (s16)', () => {
    const { container } = render(<Harness userRole="editor" />);
    const controls = container.querySelectorAll('.mantine-Accordion-control');
    const texts = Array.from(controls).map((c) => c.textContent.trim());
    const restroomsIdx = texts.findIndex((t) => t === 'Restrooms');
    const alcoholIdx = texts.findIndex((t) => t === 'Alcohol + Smoking');
    const petsIdx = texts.findIndex((t) => t === 'Pet Policy');
    expect(restroomsIdx).toBeLessThan(alcoholIdx);
    expect(alcoholIdx).toBeLessThan(petsIdx);
  });
});
