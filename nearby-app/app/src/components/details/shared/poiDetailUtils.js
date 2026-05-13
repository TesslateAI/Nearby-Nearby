export const hasVal = (v) => {
  if (v == null || v === false || v === '') return false;
  if (Array.isArray(v)) return v.filter((x) => x != null && x !== '').length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return true;
};

export const asArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => x != null && x !== '');
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

export const formatDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return null; }
};

export const isYes = (v) => {
  if (v === true) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === 'allowed';
  }
  return false;
};

export const fallbackCopy = (text) => {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); return true; }
  catch { return false; }
  finally { document.body.removeChild(ta); }
};

export const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return fallbackCopy(text); }
  }
  return fallbackCopy(text);
};

export const getCoordinates = (poi, hideExact = false) => {
  if (hideExact) return null;
  const lat = poi?.front_door_latitude ?? poi?.latitude ?? poi?.location?.coordinates?.[1] ?? poi?.location?.y;
  const lng = poi?.front_door_longitude ?? poi?.longitude ?? poi?.location?.coordinates?.[0] ?? poi?.location?.x;
  if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
  return null;
};

export const openDirections = (poi, coords) => {
  if (coords) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`, '_blank');
  } else if (poi?.address_street) {
    const a = encodeURIComponent(
      [poi.address_street, poi.address_city, poi.address_state, poi.address_zip]
        .filter(Boolean).join(', ')
    );
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${a}`, '_blank');
  }
};

export const getImages = (poi) => {
  if (!Array.isArray(poi?.images)) return [];
  return poi.images
    .filter((img) => !img.parent_image_id)
    .filter((img) => !img.image_size_variant || img.image_size_variant === 'original')
    .map((img) => {
      const mainUrl = img.storage_url || img.url || img.image_url;
      const thumb =
        img.size_variants?.find?.((v) => v.image_size_variant === 'thumbnail')?.storage_url ||
        img.size_variants?.find?.((v) => v.image_size_variant === 'medium')?.storage_url ||
        img.thumbnail_url ||
        mainUrl;
      return {
        id: img.id,
        url: mainUrl,
        thumbnail_url: thumb,
        alt_text: img.alt_text || `${poi.name} photo`,
        caption: img.caption,
      };
    })
    .filter((i) => i.url);
};

export const getLocationLine = (poi) =>
  [
    poi?.address_city,
    poi?.address_county ? `${String(poi.address_county).replace(/\s+County$/i, '')} County` : null,
    poi?.address_state,
  ].filter(Boolean).join(', ');

export const getAddressLine = (poi) => {
  if (!hasVal(poi?.address_street)) return null;
  return [poi.address_street, poi.address_city, poi.address_state, poi.address_zip]
    .filter(Boolean).join(', ');
};
