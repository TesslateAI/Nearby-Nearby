import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../utils/api';
import { preparePOIPayload } from '../utils/formCleanup';

// Flatten nested subtype objects into top-level keys for the autosave endpoint,
// which expects flat field names (e.g. `length_text`, not `trail.length_text`).
// Also strip fields that the autosave whitelist denies (e.g. `location`).
const DENIED = new Set(['id', 'created_at', 'last_updated', 'updated_at', 'location', 'poi_type', 'has_been_published']);
function buildAutosavePayload(formValues) {
  const full = preparePOIPayload(formValues);
  const out = {};
  for (const [k, v] of Object.entries(full)) {
    if (DENIED.has(k)) continue;
    if (['business', 'park', 'trail', 'event'].includes(k) && v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [sk, sv] of Object.entries(v)) {
        if (DENIED.has(sk)) continue;
        out[sk] = sv;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Google Docs-style autosave: ~800ms debounce after last keystroke,
// PATCH /pois/{id}/autosave (whitelist-filtered, no full-validation).
const DEBOUNCE_MS = 800;

// Status: 'idle' | 'saving' | 'saved' | 'error' | 'offline'
export const useAutoSave = (form, poiId, isEditing) => {
  const [status, setStatus] = useState('idle');
  const [lastSaved, setLastSaved] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const debounceRef = useRef(null);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const lastSerializedRef = useRef(null);
  const isOnlineRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // ---- network online/offline ---------------------------------------------
  useEffect(() => {
    const onOnline = () => {
      isOnlineRef.current = true;
      if (status === 'offline') setStatus('idle');
      // flush any pending change
      if (pendingRef.current) scheduleSave(0);
    };
    const onOffline = () => {
      isOnlineRef.current = false;
      setStatus('offline');
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ---- core save ----------------------------------------------------------
  const performSave = useCallback(async () => {
    if (!isEditing || !poiId) return;
    if (!isOnlineRef.current) { setStatus('offline'); return; }
    if (inFlightRef.current) { pendingRef.current = true; return; }

    const payload = buildAutosavePayload(form.values);
    const serialized = JSON.stringify(payload);
    if (serialized === lastSerializedRef.current) return; // no change

    inFlightRef.current = true;
    setStatus('saving');
    setErrorMsg(null);

    try {
      const resp = await api.request(`/pois/${poiId}/autosave`, {
        method: 'PATCH',
        body: serialized,
      });
      if (!resp || !resp.ok) {
        const text = await (resp ? resp.text() : Promise.resolve(''));
        throw new Error(`HTTP ${resp?.status || '??'}: ${text || resp?.statusText || ''}`);
      }
      lastSerializedRef.current = serialized;
      setLastSaved(new Date());
      setStatus('saved');
    } catch (err) {
      console.error('Autosave failed:', err);
      setErrorMsg(String(err?.message || err));
      setStatus('error');
    } finally {
      inFlightRef.current = false;
      // if more edits arrived during the request, save again
      if (pendingRef.current) {
        pendingRef.current = false;
        scheduleSave(DEBOUNCE_MS);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values, isEditing, poiId]);

  // ---- debouncer ----------------------------------------------------------
  const scheduleSave = useCallback((delay = DEBOUNCE_MS) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { performSave(); }, delay);
  }, [performSave]);

  // ---- watch form.values --------------------------------------------------
  useEffect(() => {
    if (!isEditing || !poiId) return;
    // Initialize baseline so first render isn't treated as a change
    if (lastSerializedRef.current === null) {
      lastSerializedRef.current = JSON.stringify(buildAutosavePayload(form.values));
      return;
    }
    scheduleSave(DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values, isEditing, poiId]);

  // ---- beforeunload guard -------------------------------------------------
  useEffect(() => {
    const handler = (e) => {
      if (inFlightRef.current || status === 'saving' || debounceRef.current) {
        e.preventDefault();
        e.returnValue = ''; // browser shows "Leave site?" prompt
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  // ---- manual flush -------------------------------------------------------
  const triggerAutoSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSave();
  }, [performSave]);

  return {
    status,            // 'idle' | 'saving' | 'saved' | 'error' | 'offline'
    lastSaved,         // Date | null
    errorMsg,          // string | null
    isSaving: status === 'saving',
    triggerAutoSave,
  };
};
