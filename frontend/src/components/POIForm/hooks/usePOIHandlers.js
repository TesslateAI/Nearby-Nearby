import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../../../utils/api';
import { emptyInitialValues } from '../constants/initialValues';

export const usePOIHandlers = (id, isEditing, form) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Load POI data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchPOI = async () => {
        try {
          const response = await api.get(`/pois/${id}`);

          // Check if response is ok
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const poi = await response.json();
          console.log('Fetched POI data:', poi);

          // Transform the data to match form structure
          const formData = {
            ...emptyInitialValues,
            ...poi,
            longitude: poi.location?.coordinates?.[0] || emptyInitialValues.longitude,
            latitude: poi.location?.coordinates?.[1] || emptyInitialValues.latitude,
            category_ids: poi.categories ? poi.categories.map(c => c.id) : [],
            business: poi.business || emptyInitialValues.business,
            park: poi.park || emptyInitialValues.park,
            trail: poi.trail || emptyInitialValues.trail,
            event: poi.event || emptyInitialValues.event
          };

          // Ensure all array fields are arrays, not null
          const arrayFields = [
            'ideal_for', 'ideal_for_key', 'parking_types', 'payment_methods', 'key_facilities',
            'alcohol_options', 'wheelchair_accessible', 'smoking_options', 'wifi_options',
            'pet_options', 'public_toilets', 'youth_amenities', 'business_amenities',
            'entertainment_options', 'natural_features', 'outdoor_types', 'things_to_do',
            'hunting_types', 'fishing_types', 'licenses_required', 'playground_types',
            'playground_surface_types', 'downloadable_maps', 'parking_locations',
            'toilet_locations', 'rental_photos', 'menu_photos', 'delivery_links',
            'reservation_links', 'appointment_links', 'online_ordering_links',
            'service_locations', 'locally_found_at', 'article_links',
            'organization_memberships', 'parking_photos', 'payphone_locations',
            'facilities_options'
          ];

          arrayFields.forEach(field => {
            if (formData[field] === null || formData[field] === undefined || !Array.isArray(formData[field])) {
              formData[field] = emptyInitialValues[field] || [];
            }
          });

          // Ensure all subtype objects exist with proper initialization
          if (!formData.business && formData.poi_type === 'BUSINESS') {
            formData.business = { ...emptyInitialValues.business };
          }
          if (!formData.park && formData.poi_type === 'PARK') {
            formData.park = { ...emptyInitialValues.park };
          }
          if (!formData.trail && formData.poi_type === 'TRAIL') {
            formData.trail = { ...emptyInitialValues.trail };
          }
          if (!formData.event && formData.poi_type === 'EVENT') {
            formData.event = { ...emptyInitialValues.event };
          }

          // Handle hours field specially
          if (!formData.hours || formData.hours === null) {
            formData.hours = emptyInitialValues.hours || {};
          }

          // Handle all string/text fields - convert null to empty string
          const stringFields = [
            'name', 'teaser_paragraph', 'description_long', 'description_short', 'status_message',
            'address_full', 'address_street', 'address_city', 'address_zip', 'website_url',
            'phone_number', 'email', 'instagram_username', 'facebook_username', 'x_username',
            'tiktok_username', 'linkedin_username', 'main_contact_name', 'main_contact_email',
            'main_contact_phone', 'offsite_emergency_contact', 'emergency_protocols',
            'cost', 'pricing_details', 'ticket_link', 'history_paragraph', 'featured_image',
            'parking_notes', 'public_transit_info', 'wheelchair_details', 'smoking_details',
            'drone_usage', 'drone_policy', 'pet_policy', 'toilet_description', 'rental_info',
            'rental_pricing', 'rental_link', 'price_range_per_person', 'pricing', 'gift_cards',
            'menu_link', 'community_impact', 'night_sky_viewing', 'birding_wildlife',
            'hunting_fishing_info', 'membership_details', 'camping_lodging', 'playground_notes',
            'pets_allowed', 'alcohol_available', 'public_toilets_available', 'toilet_photos',
            'park_entry_notes', 'park_entry_photo', 'parking_lot_photo', 'business_entry_notes',
            'business_entry_photo', 'appointment_booking_url', 'shopping_center', 'park_system',
            'park_manager'
          ];

          stringFields.forEach(field => {
            if (formData[field] === null || formData[field] === undefined) {
              formData[field] = '';
            }
          });

          // Handle numeric fields that should be null or numbers
          const numericFields = ['front_door_latitude', 'front_door_longitude'];
          numericFields.forEach(field => {
            if (formData[field] === '' || formData[field] === 'null') {
              formData[field] = null;
            }
          });

          // Handle nested string fields
          if (formData.trail) {
            const trailStringFields = [
              'length_text', 'difficulty', 'difficulty_description', 'route_type',
              'trail_markings', 'trailhead_access_details', 'downloadable_trail_map',
              'trailhead_entrance_photo', 'trailhead_photo', 'trailhead_exit_photo', 'trail_exit_photo'
            ];
            trailStringFields.forEach(field => {
              if (formData.trail[field] === null || formData.trail[field] === undefined) {
                formData.trail[field] = '';
              }
            });

            // Handle trail numeric fields
            const trailNumericFields = [
              'trailhead_latitude', 'trailhead_longitude', 'trail_exit_latitude', 'trail_exit_longitude'
            ];
            trailNumericFields.forEach(field => {
              if (formData.trail[field] === '' || formData.trail[field] === 'null') {
                formData.trail[field] = null;
              }
            });
          }

          if (formData.event) {
            const eventStringFields = [
              'organizer_name', 'food_and_drink_info', 'vendor_fee',
              'vendor_application_info', 'vendor_requirements',
              'event_entry_notes', 'event_entry_photo'
            ];
            eventStringFields.forEach(field => {
              if (formData.event[field] === null || formData.event[field] === undefined) {
                formData.event[field] = '';
              }
            });
          }

          // Final validation: ensure no undefined values
          const ensureNoUndefined = (obj, path = '') => {
            Object.keys(obj).forEach(key => {
              const currentPath = path ? `${path}.${key}` : key;
              if (obj[key] === undefined) {
                console.warn(`⚠️ Found undefined value at ${currentPath}, setting to appropriate default`);
                if (emptyInitialValues[key] !== undefined) {
                  obj[key] = emptyInitialValues[key];
                } else if (Array.isArray(emptyInitialValues[key])) {
                  obj[key] = [];
                } else if (typeof emptyInitialValues[key] === 'object' && emptyInitialValues[key] !== null) {
                  obj[key] = {};
                } else if (typeof emptyInitialValues[key] === 'string') {
                  obj[key] = '';
                } else if (typeof emptyInitialValues[key] === 'number') {
                  obj[key] = null;
                } else if (typeof emptyInitialValues[key] === 'boolean') {
                  obj[key] = false;
                } else {
                  obj[key] = '';
                }
              } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                ensureNoUndefined(obj[key], currentPath);
              }
            });
          };

          ensureNoUndefined(formData);
          console.log('Form data after transformation:', formData);

          // Set form values with error handling
          try {
            form.setValues(formData);
            console.log('Form values set successfully');
          } catch (formError) {
            console.error('Error setting form values:', formError);
            throw new Error(`Form validation error: ${formError.message}`);
          }
        } catch (error) {
          console.error('Error loading POI:', error);
          notifications.show({
            title: 'Error',
            message: `Failed to load POI data: ${error.message}`,
            color: 'red'
          });
        }
      };
      fetchPOI();
    }
  }, [id, isEditing]);

  const handleSubmit = async (values, publicationStatus = 'published') => {
    setLoading(true);

    console.log('📝 Form submission started:', { isEditing, publicationStatus, id });
    console.log('📋 Form values:', values);
    console.log('🔍 Form errors:', form.errors);

    // Show loading notification
    const actionText = publicationStatus === 'draft' ?
      (isEditing && form.values.publication_status === 'published' ? 'unpublishing' : 'saving draft') :
      (isEditing ? 'updating' : 'publishing');

    const loadingNotification = notifications.show({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}...`,
      message: `Please wait while we ${actionText} your POI`,
      loading: true,
      autoClose: false,
    });

    // Clean up empty string values and convert them to null for optional fields
    const cleanValues = { ...values };

    // Clean business fields
    if (cleanValues.business) {
      if (cleanValues.business.price_range === '') {
        cleanValues.business.price_range = null;
      }
    }

    // Clean other optional string fields
    const optionalStringFields = [
      'description_long', 'description_short', 'status_message',
      'address_full', 'address_street', 'address_city', 'address_zip',
      'website_url', 'phone_number', 'email'
    ];

    optionalStringFields.forEach(field => {
      if (cleanValues[field] === '') {
        cleanValues[field] = null;
      }
    });

    // Prepare the payload
    const payload = {
      ...cleanValues,
      publication_status: publicationStatus,
      location: {
        type: 'Point',
        coordinates: [cleanValues.longitude, cleanValues.latitude]
      }
    };

    // Remove fields not needed in payload
    delete payload.longitude;
    delete payload.latitude;

    // Only include the subtype data relevant to the POI type
    if (payload.poi_type !== 'BUSINESS') delete payload.business;
    if (payload.poi_type !== 'PARK') delete payload.park;
    if (payload.poi_type !== 'TRAIL') delete payload.trail;
    if (payload.poi_type !== 'EVENT') delete payload.event;

    console.log('📦 Final payload:', payload);

    try {
      let response;
      if (isEditing) {
        console.log(`🔄 Updating POI ${id}...`);
        response = await api.put(`/pois/${id}`, payload);
        console.log('✅ Update response:', response);

        notifications.update({
          id: loadingNotification,
          title: 'Success!',
          message: publicationStatus === 'draft' && form.values.publication_status === 'published' ?
            'POI unpublished successfully!' :
            `POI ${publicationStatus === 'draft' ? 'saved as draft' : 'updated'} successfully!`,
          color: 'green',
          loading: false,
          autoClose: 3000
        });

        // Navigate to POI list
        navigate('/');
      } else {
        console.log('➕ Creating new POI...');
        response = await api.post('/pois/', payload);
        console.log('✅ Create response:', response);

        notifications.update({
          id: loadingNotification,
          title: 'Success!',
          message: `POI ${publicationStatus === 'draft' ? 'saved as draft' : 'published'} successfully!`,
          color: 'green',
          loading: false,
          autoClose: 3000
        });

        // For new POIs, navigate to the edit page so user can continue editing
        const newPoiId = response.id;
        if (newPoiId) {
          navigate(`/poi/${newPoiId}/edit`);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('❌ API Error:', error);
      console.error('❌ Error details:', error.response || error.message);

      let errorMessage = 'An unknown error occurred';
      if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.data?.detail || error.response.statusText}`;
        console.error('❌ Response data:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }

      notifications.update({
        id: loadingNotification,
        title: 'Error',
        message: errorMessage,
        color: 'red',
        loading: false,
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this POI? This action cannot be undone.')) return;

    setLoading(true);
    const loadingNotification = notifications.show({
      title: 'Deleting...',
      message: 'Please wait while we delete your POI',
      loading: true,
      autoClose: false,
    });

    try {
      await api.delete(`/pois/${id}`);
      notifications.update({
        id: loadingNotification,
        title: 'Success!',
        message: 'POI deleted successfully!',
        color: 'green',
        loading: false,
        autoClose: 3000
      });
      navigate('/');
    } catch (error) {
      notifications.update({
        id: loadingNotification,
        title: 'Error',
        message: 'Failed to delete POI. Please try again.',
        color: 'red',
        loading: false,
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmit,
    handleDelete
  };
};