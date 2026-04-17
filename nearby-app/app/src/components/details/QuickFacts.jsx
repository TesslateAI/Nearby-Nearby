import './QuickFacts.css';

/**
 * QuickFacts — yellow-outlined box that sits in every Figma detail header.
 *
 * Props:
 *   facts — Array<{ label: string, value: any }>
 *
 * Pairs with a falsy/empty value are filtered out. If no pairs remain,
 * the component returns null (empty section → hide).
 */
export default function QuickFacts({ facts }) {
  if (!Array.isArray(facts)) return null;

  const visible = facts.filter(({ value }) => {
    if (value == null || value === false) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="poi_quick_facts" role="list">
      {visible.map(({ label, value }, idx) => (
        <div className="poi_quick_facts_row" role="listitem" key={`${label}-${idx}`}>
          <div className="poi_quick_facts_label">{label}</div>
          <div className="poi_quick_facts_divider" aria-hidden="true" />
          <div className="poi_quick_facts_value">{value}</div>
        </div>
      ))}
    </div>
  );
}
