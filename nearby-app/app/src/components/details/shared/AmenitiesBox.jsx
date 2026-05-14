import AmenityPillStrip from '../AmenityPillStrip';
import { asArray } from './poiDetailUtils';

export default function AmenitiesBox({ poi, title = 'Amenities + Facilities', amenitiesList }) {
  if (amenitiesList) {
    if (amenitiesList.length === 0) return null;
    return (
      <div id="poi_amenities_box" className="box_style_1">
        <div className="poi_quick_info_title">{title}</div>
        <div className="poi_amenities_list">
          {amenitiesList.map((a, i) => (
            <span className="aaa" key={i}>{a}</span>
          ))}
        </div>
      </div>
    );
  }

  const a = poi?.amenities && typeof poi.amenities === 'object' ? poi.amenities : null;
  const anyAmenityGroup = a && Object.values(a).some(
    (v) => Array.isArray(v) ? v.length > 0 : !!v
  );
  const hasPills =
    !!poi?.icon_public_restroom ||
    !!poi?.icon_free_wifi ||
    !!poi?.icon_wheelchair_accessible ||
    !!poi?.icon_pet_friendly ||
    anyAmenityGroup ||
    (Array.isArray(poi?.parking_types) && poi.parking_types.length > 0) ||
    !!poi?.playground_available ||
    (Array.isArray(poi?.playground_types) && poi.playground_types.length > 0);

  if (!hasPills) return null;

  return (
    <div id="poi_amenities_box" className="box_style_1">
      <div className="poi_quick_info_title">{title}</div>
      <AmenityPillStrip poi={poi} />
    </div>
  );
}
