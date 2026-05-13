export function getDisplayableLocation(poi) {
  const hideExact = Boolean(poi?.dont_display_location);
  const city = poi?.address_city || '';
  const region = poi?.address_state || '';
  return {
    hideExact,
    city,
    region,
    lat:    hideExact ? null : poi?.front_door_latitude ?? poi?.latitude ?? null,
    lng:    hideExact ? null : poi?.front_door_longitude ?? poi?.longitude ?? null,
    street: hideExact ? null : (poi?.address_street || poi?.street_address || null),
    full:   hideExact
              ? [city, region].filter(Boolean).join(', ')
              : (poi?.address_full || [poi?.address_street, city, region].filter(Boolean).join(', ')),
  };
}
