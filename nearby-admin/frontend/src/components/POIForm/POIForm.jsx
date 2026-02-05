import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Stack, Box, Title, Text, Accordion, Group, Badge,
  Alert, Button, Affix, Transition, rem, Loader
} from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { IconChevronUp } from '@tabler/icons-react';
import { modals } from '@mantine/modals';

// Hooks
import { usePOIForm } from './hooks/usePOIForm';
import { usePOIHandlers } from './hooks/usePOIHandlers.jsx';
import { useAutoSave } from './hooks/useAutoSave';

// Components
import { FormActions } from './components/FormActions';
import { CoreInformationSection } from './sections/CoreInformationSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { ContactSection } from './sections/ContactSection';

// Additional sections
import HoursSelector from '../HoursSelector';
import DynamicAttributeForm from '../DynamicAttributeForm';

// Import all section components
import { LocationSection } from './sections/LocationSection';
import {
  BusinessDetailsSection,
  MenuBookingSection,
  BusinessGallerySection,
  BusinessEntrySection
} from './sections/BusinessDetailsSection';
import {
  FacilitiesSection,
  PublicAmenitiesSection,
  RentalsSection
} from './sections/FacilitiesSection';
import {
  EventVendorsSection,
  EventAmenitiesSection,
  EventMapsSection,
  EventVenueSection
} from './sections/EventSpecificSections';
import { TrailDetailsSection } from './sections/TrailSpecificSections';
import {
  OutdoorFeaturesSection,
  HuntingFishingSection,
  PetPolicySection,
  PlaygroundSection
} from './sections/OutdoorFeaturesSection';
import { ParkCategoriesSection } from './sections/ParkCategoriesSection';
import { TrailCategoriesSection } from './sections/TrailCategoriesSection';
import {
  InternalContactSection,
  PricingMembershipsSection,
  ConnectionsSection,
  CommunityConnectionsSection,
  CorporateComplianceSection
} from './sections/MiscellaneousSections';

// Lazy load the map component to improve performance
const LocationMap = lazy(() => import('../LocationMap'));
import { LocationMapSkeleton } from '../LocationMap';

export default function POIForm() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [poiId, setPoiId] = useState(paramId);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const autoCreateInitiated = useRef(false);
  const isEditing = Boolean(poiId);
  const [scroll, scrollTo] = useWindowScroll();
  const [renderError, setRenderError] = useState(null);
  const [navigationBlocked, setNavigationBlocked] = useState(false);

  // Custom hooks for form management
  const { form, isBusiness, isPark, isTrail, isEvent, isPaidListing, isFreeListing } = usePOIForm();
  const { loading, handleSubmit, handleDelete, handleSilentDelete, handleAutoCreate } = usePOIHandlers(poiId, isEditing, form, setPoiId);

  // Auto-save hook (only when editing existing POI)
  const { isSaving, lastSaved, triggerAutoSave } = useAutoSave(form, poiId, isEditing);

  // Simple navigation - no complex draft checks
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Auto-create draft POI when user selects a POI type for new POI
  useEffect(() => {
    if (!paramId && !poiId && !autoCreateInitiated.current && form.values.poi_type && form.values.poi_type !== '') {
      autoCreateInitiated.current = true;
      setIsAutoCreating(true);

      // Immediately call handleAutoCreate instead of using setTimeout to avoid race conditions
      const performAutoCreate = async () => {
        try {
          const draftId = await handleAutoCreate();
          if (draftId) {
            setPoiId(draftId);
            // Update URL to reflect the new POI ID without triggering a full reload
            window.history.replaceState({}, '', `/poi/${draftId}/edit`);
          }
        } catch (error) {
          console.error('Failed to auto-create draft POI:', error);
        } finally {
          setIsAutoCreating(false);
        }
      };

      performAutoCreate();
    }
    // If we have a poiId or paramId, make sure auto-creating is false
    else if ((paramId || poiId) && isAutoCreating) {
      setIsAutoCreating(false);
    }
  }, [paramId, poiId, form.values.poi_type, handleAutoCreate, isAutoCreating]);

  // Early return for render errors
  if (renderError) {
    return (
      <Container size="xl" px={{ base: 'xs', sm: 'md', lg: 'xl' }}>
        <Stack spacing="xl" pb={100}>
          <Alert color="red" title="Render Error">
            <Text>An error occurred while rendering the form: {renderError.message}</Text>
            <Button onClick={() => setRenderError(null)} mt="md">Try Again</Button>
          </Alert>
        </Stack>
      </Container>
    );
  }

  try {
    return (
      <Container size="xl" px={{ base: 'xs', sm: 'md', lg: 'xl' }}>
        <Stack spacing="xl" pb={100}>
          <Box>
            <Group align="center" mb="md">
              <Title order={2} c="deep-purple.7">
                {isEditing ? `Editing: ${form.values.name || 'New POI'}` : 'Create New Point of Interest'}
              </Title>
              {isSaving && (
                <Group gap="xs">
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed">Saving...</Text>
                </Group>
              )}
              {!isSaving && lastSaved && isEditing && (
                <Text size="sm" c="dimmed">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </Text>
              )}
            </Group>
            <Text size="sm" c="dimmed">Fields marked with * are required</Text>
            {isAutoCreating && (
              <Alert color="blue" mt="sm">
                <Text size="sm">Initializing form with image upload capabilities...</Text>
              </Alert>
            )}
          </Box>

          <form onSubmit={(e) => {
            // Prevent form submission from map interactions
            const clickedElement = e.nativeEvent.submitter;
            if (clickedElement && clickedElement.closest('.leaflet-control-zoom')) {
              e.preventDefault();
              return false;
            }
            form.onSubmit(handleSubmit)(e);
          }}>
            <Accordion
              defaultValue={['core', 'categories', 'location', 'hours']}
              multiple
              variant="separated"
            >
              {/* Core Information Section */}
              <Accordion.Item value="core">
                <Accordion.Control>
                  <Group>
                    <Text fw={600}>Core Information</Text>
                    <Badge size="sm" variant="light">Required</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <CoreInformationSection
                    form={form}
                    isBusiness={isBusiness}
                    isPark={isPark}
                    isTrail={isTrail}
                    isEvent={isEvent}
                    isPaidListing={isPaidListing}
                    isFreeListing={isFreeListing}
                    id={poiId}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              {/* Categories & Ideal For Section - NOT for Parks or Trails (they have their own sections) */}
              {!isPark && !isTrail && (
                <Accordion.Item value="categories">
                  <Accordion.Control>
                    <Group>
                      <Text fw={600}>Categories & Target Audience</Text>
                      <Badge size="sm" variant="light">Required</Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <CategoriesSection
                      form={form}
                      isPaidListing={isPaidListing}
                      isFreeListing={isFreeListing}
                    />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Park Categories Section - Things to Do (Parks use this instead of standard categories) */}
              {isPark && (
                <Accordion.Item value="park-categories">
                  <Accordion.Control>
                    <Group>
                      <Text fw={600}>Park Categories & Target Audience</Text>
                      <Badge size="sm" variant="light">Required</Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <ParkCategoriesSection form={form} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Trail Categories Section - Ideal For (Trails use this instead of standard categories) */}
              {isTrail && (
                <Accordion.Item value="trail-categories">
                  <Accordion.Control>
                    <Group>
                      <Text fw={600}>Trail Categories & Target Audience</Text>
                      <Badge size="sm" variant="light">Required</Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <TrailCategoriesSection form={form} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Event Venue Section - Link to a venue and copy data */}
              {isEvent && (
                <Accordion.Item value="venue">
                  <Accordion.Control>
                    <Group>
                      <Text fw={600}>Event Venue</Text>
                      <Badge size="sm" variant="light" color="blue">Optional</Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <EventVenueSection form={form} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Location & Parking Section */}
              <Accordion.Item value="location">
                <Accordion.Control>
                  <Group>
                    <Text fw={600}>Location & Parking</Text>
                    <Badge size="sm" variant="light">Required</Badge>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <LocationSection
                    form={form}
                    isBusiness={isBusiness}
                    isPark={isPark}
                    isTrail={isTrail}
                    isEvent={isEvent}
                    isFreeListing={isFreeListing}
                    id={poiId}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              {/* Hours of Operation Section - Not for Events */}
              {!isEvent && (
                <Accordion.Item value="hours">
                  <Accordion.Control>
                    <Text fw={600}>Hours of Operation</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack>
                      <HoursSelector
                        value={form.values.hours}
                        onChange={(value) => form.setFieldValue('hours', value)}
                        poiType={form.values.poi_type}
                      />
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Contact & Social Media Section */}
              <Accordion.Item value="contact">
                <Accordion.Control>
                  <Text fw={600}>Contact & Social Media</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <ContactSection
                    form={form}
                    isEvent={isEvent}
                    isFreeListing={isFreeListing}
                  />
                </Accordion.Panel>
              </Accordion.Item>

              {/* Pricing & Memberships Section - for Parks and Trails */}
              {(isPark || isTrail) && (
                <Accordion.Item value="pricing">
                  <Accordion.Control>
                    <Group>
                      <Text fw={600}>Pricing & Memberships</Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <PricingMembershipsSection form={form} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Internal Contacts Section */}
              <Accordion.Item value="internal">
                <Accordion.Control>
                  <Text fw={600}>Internal Contact Information</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <InternalContactSection form={form} />
                </Accordion.Panel>
              </Accordion.Item>

              {/* Business Details Section */}
              {isBusiness && (
                <Accordion.Item value="business">
                  <Accordion.Control>
                    <Text fw={600}>Business Details</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <BusinessDetailsSection
                      form={form}
                      isFreeListing={isFreeListing}
                      id={poiId}
                    />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Menu & Online Booking Section */}
              {isBusiness && !isFreeListing && (
                <Accordion.Item value="menu">
                  <Accordion.Control>
                    <Text fw={600}>Menu & Online Booking</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <MenuBookingSection form={form} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Gallery Section - PAID Business, Parks, and Trails */}
              {((isBusiness && !isFreeListing) || isPark || isTrail) && (
                <Accordion.Item value="gallery">
                  <Accordion.Control>
                    <Text fw={600}>Gallery</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <BusinessGallerySection form={form} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Facilities & Accessibility Section */}
              {(!isBusiness || !isFreeListing) && (
                <Accordion.Item value="facilities">
                  <Accordion.Control>
                    <Text fw={600}>Facilities & Accessibility</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <FacilitiesSection
                      form={form}
                      isBusiness={isBusiness}
                      isPark={isPark}
                      isTrail={isTrail}
                      isEvent={isEvent}
                      isFreeListing={isFreeListing}
                      id={poiId}
                    />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Public Amenities Section */}
              {(!isBusiness || !isFreeListing) && (
                <Accordion.Item value="amenities">
                  <Accordion.Control>
                    <Text fw={600}>{(isPark || isTrail) ? 'Public Restrooms' : 'Public Amenities'}</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <PublicAmenitiesSection form={form} isPark={isPark} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Rentals Section - for Parks and Trails */}
              {(isPark || isTrail) && (
                <Accordion.Item value="rentals">
                  <Accordion.Control>
                    <Text fw={600}>Rentals</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <RentalsSection form={form} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Event Vendors Section */}
              {isEvent && (
                <Accordion.Item value="vendors">
                  <Accordion.Control>
                    <Text fw={600}>Event Vendors</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <EventVendorsSection form={form} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Pet Policy Section */}
              <Accordion.Item value="pets">
                <Accordion.Control>
                  <Text fw={600}>Pet Policy</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <PetPolicySection form={form} />
                </Accordion.Panel>
              </Accordion.Item>

              {/* Playground Section */}
              {(!isBusiness || !isFreeListing) && (
                <Accordion.Item value="playground">
                  <Accordion.Control>
                    <Text fw={600}>Playground Information</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <PlaygroundSection form={form} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Outdoor Features Section */}
              {(isPark || isTrail) && (
                <Accordion.Item value="outdoor">
                  <Accordion.Control>
                    <Text fw={600}>Outdoor Features</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <OutdoorFeaturesSection form={form} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Hunting & Fishing Section */}
              {(isPark || isTrail) && (
                <Accordion.Item value="hunting">
                  <Accordion.Control>
                    <Text fw={600}>Hunting & Fishing</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <HuntingFishingSection form={form} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Trail Details Section */}
              {isTrail && (
                <Accordion.Item value="trail">
                  <Accordion.Control>
                    <Text fw={600}>Trail Details</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <TrailDetailsSection form={form} id={poiId} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Connections Section */}
              {(isPark || isTrail) && (
                <Accordion.Item value="memberships">
                  <Accordion.Control>
                    <Text fw={600}>Connections</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <ConnectionsSection form={form} isBusiness={isBusiness} isPark={isPark} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Community Connections Section */}
              {(isBusiness || isPark || isTrail) && (
                <Accordion.Item value="community">
                  <Accordion.Control>
                    <Text fw={600}>Community Connections</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <CommunityConnectionsSection form={form} />
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {/* Corporate Compliance Section */}
              <Accordion.Item value="compliance">
                <Accordion.Control>
                  <Text fw={600}>Corporate Compliance</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <CorporateComplianceSection form={form} />
                </Accordion.Panel>
              </Accordion.Item>

              {/* Dynamic Attributes Section */}
              <Accordion.Item value="attributes">
                <Accordion.Control>
                  <Text fw={600}>Dynamic Attributes</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <DynamicAttributeForm
                    poiType={form.values.poi_type}
                    value={form.values.dynamic_attributes || {}}
                    onChange={(value) => form.setFieldValue('dynamic_attributes', value)}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            {/* Form Actions */}
            <FormActions
              form={form}
              loading={loading}
              isEditing={isEditing}
              handleSubmit={handleSubmit}
              handleDelete={handleDelete}
              handleNavigation={handleNavigation}
            />
          </form>
        </Stack>

        {/* Scroll to top button */}
        <Affix position={{ bottom: 20, right: 20 }}>
          <Transition transition="slide-up" mounted={scroll.y > 0}>
            {(transitionStyles) => (
              <Button
                leftSection={<IconChevronUp size={16} />}
                style={transitionStyles}
                onClick={() => scrollTo({ y: 0 })}
              >
                Scroll to top
              </Button>
            )}
          </Transition>
        </Affix>
      </Container>
    );
  } catch (error) {
    console.error('Render error in POIForm:', error);

    // Set the error in state to trigger the error UI
    if (!renderError) {
      setRenderError(error);
    }

    // Fallback render
    return (
      <Container size="xl" px={{ base: 'xs', sm: 'md', lg: 'xl' }}>
        <Stack spacing="xl" pb={100}>
          <Alert color="red" title="Component Error">
            <Text>The form crashed while rendering. Please check the console for details.</Text>
          </Alert>
        </Stack>
      </Container>
    );
  }
}