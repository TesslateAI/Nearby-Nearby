import { useState, useEffect, useRef, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import api from '../../../utils/api';

export const useAutoSave = (form, poiId, isEditing, onSaveSuccess) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const lastFormValuesRef = useRef(null);
  const saveInProgressRef = useRef(false);

  // Auto-save interval in milliseconds (10 seconds)
  const AUTO_SAVE_INTERVAL = 10000;

  // Check if form values have changed (excluding map-related internal state)
  const hasFormChanged = useCallback(() => {
    if (!lastFormValuesRef.current) return true;

    // Create copies without map internal state that changes on zoom
    const currentValues = { ...form.values };
    const lastValues = { ...lastFormValuesRef.current };

    // Compare as JSON strings
    const currentJson = JSON.stringify(currentValues);
    const lastJson = JSON.stringify(lastValues);

    return currentJson !== lastJson;
  }, [form.values]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    // Only auto-save when editing an existing POI
    if (!isEditing || !poiId || saveInProgressRef.current) return;

    // Don't save if form hasn't changed
    if (!hasFormChanged()) return;

    // Don't save if form has validation errors for required fields
    const errors = form.validate();
    const hasRequiredErrors = errors.hasErrors && Object.keys(errors.errors).some(field => {
      // Only block auto-save for critical required fields
      const criticalFields = ['name', 'poi_type', 'latitude', 'longitude'];
      return criticalFields.includes(field);
    });

    if (hasRequiredErrors) {
      console.log('Auto-save skipped: form has critical validation errors');
      return;
    }

    saveInProgressRef.current = true;
    setIsSaving(true);

    try {
      // Prepare payload similar to handleSubmit but for draft saving
      const cleanValues = { ...form.values };

      // Clean business fields
      if (cleanValues.business && cleanValues.business.price_range === '') {
        cleanValues.business.price_range = null;
      }

      // Clean optional string fields
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
        publication_status: cleanValues.publication_status || 'draft',
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

      const response = await api.put(`/pois/${poiId}`, payload);

      if (response.ok) {
        // Update last saved values
        lastFormValuesRef.current = { ...form.values };
        setLastSaved(new Date());

        if (onSaveSuccess) {
          onSaveSuccess();
        }

        console.log('Auto-save successful');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);

      // Only show error notification for network/server errors, not validation errors
      if (error.message && !error.message.includes('validation')) {
        notifications.show({
          title: 'Auto-save failed',
          message: 'Changes will be saved when you manually save the form.',
          color: 'yellow',
          autoClose: 3000
        });
      }
    } finally {
      setIsSaving(false);
      saveInProgressRef.current = false;
    }
  }, [form.values, form.validate, isEditing, poiId, hasFormChanged, onSaveSuccess]);

  // Set up auto-save timer - only trigger on actual changes
  useEffect(() => {
    if (!isEditing || !poiId) return;

    // Don't trigger auto-save if values haven't actually changed
    if (!hasFormChanged()) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_INTERVAL);

    // Cleanup on unmount or dependency change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form.values, isEditing, poiId, performAutoSave, hasFormChanged]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Initialize last form values when form is loaded
  useEffect(() => {
    if (isEditing && poiId && form.values && !lastFormValuesRef.current) {
      lastFormValuesRef.current = { ...form.values };
    }
  }, [isEditing, poiId, form.values]);

  // Manual trigger for immediate save
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    performAutoSave();
  }, [performAutoSave]);

  return {
    isSaving,
    lastSaved,
    triggerAutoSave
  };
};