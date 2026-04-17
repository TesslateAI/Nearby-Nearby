import { Car, TreePine, Droplet, Dog, Bike, Trees } from 'lucide-react';
import {
  RestroomIcon,
  WheelchairIcon,
  WifiIcon,
  PetIcon,
} from '../nearby-feature/NearbyCard';
import './AmenityPillStrip.css';

/**
 * AmenityPillStrip — horizontal pill row shown in Park/Trail/Event/
 * Business-PAID Figma detail headers ("Public Restroom", "Wi-Fi Access",
 * "Parking Facilities", "Playgrounds", etc.).
 *
 * Derivation is READ-ONLY: we never recompute server-computed icon
 * booleans. If all pills resolve false we return null so the section
 * disappears entirely.
 */
export default function AmenityPillStrip({ poi }) {
  if (!poi) return null;

  const amenities = poi.amenities && typeof poi.amenities === 'object' ? poi.amenities : null;
  const general = Array.isArray(amenities?.general) ? amenities.general : [];
  const familyYouth = Array.isArray(amenities?.family_youth) ? amenities.family_youth : [];
  const recreation = Array.isArray(amenities?.recreation) ? amenities.recreation : [];
  const amenitiesNonEmpty =
    amenities && Object.keys(amenities).length > 0 &&
    Object.values(amenities).some((v) => (Array.isArray(v) ? v.length > 0 : !!v));

  const inAmenityGroups = (needle) =>
    general.includes(needle) || familyYouth.includes(needle) || recreation.includes(needle);

  const pills = [
    {
      key: 'restroom',
      label: 'Public Restroom',
      icon: <RestroomIcon />,
      show: !!poi.icon_public_restroom,
    },
    {
      key: 'amenities',
      label: 'Amenities',
      icon: <TreePine size={18} strokeWidth={2} />,
      show: amenitiesNonEmpty,
    },
    {
      key: 'parking',
      label: 'Parking Facilities',
      icon: <Car size={18} strokeWidth={2} />,
      show: Array.isArray(poi.parking_types) && poi.parking_types.length > 0,
    },
    {
      key: 'wifi',
      label: 'Wi-Fi Access',
      icon: <WifiIcon />,
      show: !!poi.icon_free_wifi,
    },
    {
      key: 'wheelchair',
      label: 'Wheelchair Accessible',
      icon: <WheelchairIcon />,
      show: !!poi.icon_wheelchair_accessible,
    },
    {
      key: 'pet',
      label: 'Pet Friendly',
      icon: <PetIcon />,
      show: !!poi.icon_pet_friendly,
    },
    {
      key: 'playgrounds',
      label: 'Playgrounds',
      icon: <Trees size={18} strokeWidth={2} />,
      show:
        !!poi.playground_available ||
        (Array.isArray(poi.playground_types) && poi.playground_types.length > 0),
    },
    {
      key: 'bicycle_rentals',
      label: 'Bicycle Rentals',
      icon: <Bike size={18} strokeWidth={2} />,
      show: inAmenityGroups('Bicycle Rentals'),
    },
    {
      key: 'water_fountains',
      label: 'Water Fountains',
      icon: <Droplet size={18} strokeWidth={2} />,
      show: inAmenityGroups('Water Fountains'),
    },
    {
      key: 'dog_parks',
      label: 'Dog Parks',
      icon: <Dog size={18} strokeWidth={2} />,
      show: inAmenityGroups('Dog Parks'),
    },
    {
      key: 'picnic_areas',
      label: 'Picnic Areas',
      icon: <TreePine size={18} strokeWidth={2} />,
      show: inAmenityGroups('Picnic Areas'),
    },
  ].filter((p) => p.show);

  if (pills.length === 0) return null;

  return (
    <ul className="poi_amenity_pill_strip" role="list">
      {pills.map((p) => (
        <li className="poi_amenity_pill" key={p.key}>
          <span className="poi_amenity_pill_icon" aria-hidden="true">{p.icon}</span>
          <span className="poi_amenity_pill_label">{p.label}</span>
        </li>
      ))}
    </ul>
  );
}
