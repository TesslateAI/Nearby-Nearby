import './InfoRow.css';

/**
 * InfoRow — thin presentational wrapper for template's .poi_info_row
 * label/value two-column layout.
 *
 * Returns null when children is falsy or empty, enforcing the
 * "empty field → omit" business rule from the plan.
 */
export default function InfoRow({ label, children }) {
  const isEmpty =
    children == null ||
    children === false ||
    (typeof children === 'string' && children.trim() === '') ||
    (Array.isArray(children) && children.filter((c) => c != null && c !== false && c !== '').length === 0);

  if (isEmpty) return null;

  return (
    <div className="poi_info_row">
      {label ? <div className="poi_info_row_label">{label}</div> : null}
      <div className="poi_info_row_value">{children}</div>
    </div>
  );
}
