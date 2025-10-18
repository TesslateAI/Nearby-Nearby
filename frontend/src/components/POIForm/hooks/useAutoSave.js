import { useState, useEffect, useRef, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import api from '../../../utils/api';
import { preparePOIPayload } from '../utils/formCleanup';

export const useAutoSave = (form, poiId, isEditing, onSaveSuccess) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimeoutRef = useRef(null);
  const lastFormValuesRef = useRef(null);
  const saveInProgressRef = useRef(false);

  // Auto-save interval in milliseconds (10 seconds)
  const AUTO_SAVE_INTERVAL = 10000;

  // Check if form values have changed using a more efficient shallow comparison
  const hasFormChanged = useCallback(() => {
    if (!lastFormValuesRef.current) return true;

    const currentValues = form.values;
    const lastValues = lastFormValuesRef.current;

    // Quick shallow comparison for top-level fields
    const currentKeys = Object.keys(currentValues);
    const lastKeys = Object.keys(lastValues);

    if (currentKeys.length !== lastKeys.length) return true;

    // Compare all top-level fields (except internal React fields)
    const fieldsToCompare = currentKeys.filter(key =>
      !key.startsWith('_') && key !== 'id' && key !== 'created_at' && key !== 'updated_at'
    );

    for (const key of fieldsToCompare) {
      if (currentValues[key] !== lastValues[key]) {
        // For objects/arrays, do a deeper check
        if (typeof currentValues[key] === 'object' && currentValues[key] !== null) {
          if (JSON.stringify(currentValues[key]) !== JSON.stringify(lastValues[key])) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    return false;
  }, [form.values]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    // Only auto-save when editing an existing POI
    if (!isEditing || !poiId || saveInProgressRef.current) return;

    // Don't save if form hasn't changed
    if (!hasFormChanged()) return;

    // NO VALIDATION - Save everything as-is
    saveInProgressRef.current = true;
    setIsSaving(true);

    try {
      // Prepare payload using shared utility
      const payload = preparePOIPayload(form.values);
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
  }, [form.values, isEditing, poiId, hasFormChanged, onSaveSuccess]);

  // Set up auto-save timer - only trigger on actual changes
  useEffect(() => {
    if (!isEditing || !poiId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout - hasFormChanged will be checked when timeout fires
    saveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_INTERVAL);

    // Cleanup on unmount or dependency change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values, isEditing, poiId]);

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