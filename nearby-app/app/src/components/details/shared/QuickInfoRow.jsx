import { hasVal } from './poiDetailUtils';

export default function QuickInfoRow({ title, value }) {
  if (!hasVal(value)) return null;
  return (
    <div className="poi_quick_info_single">
      <span className="poi_quick_info_single_title">{title}</span>
      <span className="poi_quick_info_single_info">
        {typeof value === 'object' && !Array.isArray(value) ? JSON.stringify(value) : value}
      </span>
    </div>
  );
}
