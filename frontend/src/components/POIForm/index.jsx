import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { Paper, Title, Text, Stepper, Group, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../../utils/api';

// Import constants and utilities
import { emptyInitialValues } from './constants';
import { validateForm, cleanFormValues, buildPayload, formatDateTimeForInput } from './utils';

// Import step components
import CoreInfoStep from './steps/CoreInfoStep';
import CategoriesStep from './steps/CategoriesStep';
import LocationStep from './steps/LocationStep';
import ContactStep from './steps/ContactStep';
import AttributesStep from './steps/AttributesStep';
import ComplianceStep from './steps/ComplianceStep';
import ReviewStep from './steps/ReviewStep';

function POIForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);

  const form = useForm({
    initialValues: emptyInitialValues,
    validate: (values) => validateForm(values, activeStep),
  });

  const nextStep = () => {
    if (!form.validate().hasErrors) {
      setCompletedSteps(activeStep);
      setActiveStep((current) => Math.min(6, current + 1));
    }
  };
  
  const prevStep = () => setActiveStep((current) => Math.max(0, current - 1));

  useEffect(() => {
    if (isEditing) {
      api.get(`/pois/${id}`)
        .then(async response => {
          const poi = await response.json();
          const initial = { ...emptyInitialValues };

          // Populate top-level fields
          Object.assign(initial, {
            name: poi.name,
            description_long: poi.description_long || null,
            description_short: poi.description_short || null,
            poi_type: poi.poi_type,
            status: poi.status,
            status_message: poi.status_message || null,
            is_verified: poi.is_verified,
            is_disaster_hub: poi.is_disaster_hub,
            address_full: poi.address_full || null,
            address_street: poi.address_street || null,
            address_city: poi.address_city || null,
            address_state: poi.address_state,
            address_zip: poi.address_zip || null,
            website_url: poi.website_url || null,
            phone_number: poi.phone_number || null,
            email: poi.email || null,
            photos: poi.photos || { featured: '', gallery: [] },
            hours: poi.hours || {},
            amenities: poi.amenities || {},
            contact_info: poi.contact_info || {},
            compliance: poi.compliance || {},
            custom_fields: poi.custom_fields || {},
            corporate_compliance: poi.corporate_compliance || {
              has_compliance_requirements: false,
              compliance_description: '',
              disable_comments: false,
              comments_restriction_reason: '',
              social_media_restrictions: [],
              other_social_media: '',
              pre_approval_required: false,
              approval_lead_time: '',
              approval_contact_name: '',
              approval_contact_email: '',
              approval_contact_phone: '',
              has_branding_requirements: false,
              branding_description: ''
            },
            main_emergency_contact: poi.main_emergency_contact || { name: '', email: '', phone: '' },
            public_toilets: poi.public_toilets || { available: false, types: [], locations: [], description: '' },
            category_ids: poi.categories?.map(c => c.id) || [],
          });

          // Populate location coordinates
          if (poi.location) {
            initial.longitude = poi.location.coordinates[0];
            initial.latitude = poi.location.coordinates[1];
          }

          // Populate subtype specific fields
          if (poi.poi_type === 'BUSINESS' && poi.business) {
            initial.business = {
              ...initial.business,
              ...poi.business,
              price_range: poi.business.price_range || null
            };
          } else if (poi.poi_type === 'PARK' && poi.park) {
            initial.park = {
              ...initial.park,
              ...poi.park,
              drone_usage_policy: poi.park.drone_usage_policy || null
            };
          } else if (poi.poi_type === 'TRAIL' && poi.trail) {
            initial.trail = {
              ...initial.trail,
              ...poi.trail,
              length_text: poi.trail.length_text || null,
              difficulty: poi.trail.difficulty || null,
              route_type: poi.trail.route_type || null
            };
          } else if (poi.poi_type === 'EVENT' && poi.event) {
            initial.event = {
              ...initial.event,
              ...poi.event,
              start_datetime: formatDateTimeForInput(poi.event.start_datetime),
              end_datetime: formatDateTimeForInput(poi.event.end_datetime),
              cost_text: poi.event.cost_text || null
            };
          }

          form.setValues(initial);
          form.setInitialValues(initial);
        })
        .catch(error => notifications.show({ title: 'Error', message: 'Failed to fetch POI data.', color: 'red' }));
    }
  }, [id, isEditing]);

  const handleSubmit = async (values) => {
    try {
      const cleanValues = cleanFormValues(values);
      const payload = buildPayload(cleanValues);
      const apiCall = isEditing ? api.put(`/pois/${id}`, payload) : api.post('/pois/', payload);

      const response = await apiCall;
      if (response.ok) {
        notifications.show({ 
          title: 'Success!', 
          message: `POI "${cleanValues.name}" was ${isEditing ? 'updated' : 'created'}!`, 
          color: 'green' 
        });
        navigate('/');
      } else {
        // Get error details from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Failed to ${isEditing ? 'update' : 'create'} POI`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Submission error:', error);
      notifications.show({ 
        title: 'Submission Error', 
        message: error.message || `Failed to ${isEditing ? 'update' : 'create'} POI.`, 
        color: 'red' 
      });
    }
  };

  return (
    <Paper maw={1200} mx="auto">
      <Title order={2} c="deep-purple.7" mb="xl">
        {isEditing ? `Editing: ${form.values.name}` : 'Create New Point of Interest'}
      </Title>
      <Text size="sm" c="dimmed" mb="md">Fields marked with * are required</Text>

      <Stepper
        active={activeStep}
        completed={completedSteps}
        onStepClick={setActiveStep}
        breakpoint="sm"
        allowNextStepsSelect={false}
        size="sm"
        styles={{
          root: { marginBottom: 'xl' },
          step: { flex: 1, minWidth: 0 },
          stepLabel: { fontSize: '0.875rem' },
          stepDescription: { fontSize: '0.75rem' },
          separator: {
            width: '30px',
            borderStyle: 'solid',
            borderWidth: '2px',
            borderColor: 'var(--mantine-color-gray-4)',
            backgroundColor: 'transparent'
          },
          separatorActive: {
            borderColor: 'var(--mantine-color-deep-purple-6)'
          },
          separatorCompleted: {
            borderColor: 'var(--mantine-color-deep-purple-6)'
          }
        }}
      >
        <Stepper.Step label="Core Info" description="Basic details">
          <CoreInfoStep form={form} />
        </Stepper.Step>

        <Stepper.Step label="Categories" description="Categories & type">
          <CategoriesStep form={form} />
        </Stepper.Step>

        <Stepper.Step label="Location" description="Address & map">
          <LocationStep form={form} />
        </Stepper.Step>

        <Stepper.Step label="Contact" description="Contact & hours">
          <ContactStep form={form} />
        </Stepper.Step>

        <Stepper.Step label="Attributes" description="Dynamic fields">
          <AttributesStep form={form} />
        </Stepper.Step>

        <Stepper.Step label="Compliance" description="Corporate & safety">
          <ComplianceStep form={form} />
        </Stepper.Step>

      </Stepper>

      {activeStep === 6 && <ReviewStep form={form} isEditing={isEditing} />}

      <Group justify="center" mt="xl">
        <Button variant="default" onClick={prevStep} disabled={activeStep === 0}>Back</Button>
        <Button onClick={nextStep} disabled={activeStep === 6}>Next</Button>
        {activeStep === 6 && (
          <Button 
            onClick={form.onSubmit(handleSubmit)} 
            disabled={Object.keys(form.errors).length > 0}
          >
            Submit
          </Button>
        )}
        {isEditing && (
          <Button 
            variant="outline" 
            color="red" 
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
        )}
      </Group>
    </Paper>
  );
}

export default POIForm;