// Registry-driven auto-render widgets.
//
// Each widget receives { entry, value, poi } and renders a labelled block in
// the existing detail styling (ContentGroup + acc_content_* / acc_list_group_1
// conventions). Widgets assume the value is NON-empty — AttributeSections (and
// the dispatcher) already skip empty values per the render_rule. Booleans are
// the exception: BooleanPill only renders a positive pill, and only when true.

import ContentGroup from '../shared/ContentGroup';
import { sanitizeHtml } from '../../../utils/sanitize';
import { humanize, withScheme, formatDateTime } from './widgetUtils';

const fieldLabel = (entry) => entry?.label || humanize(entry?.key);

// ── BooleanPill ───────────────────────────────────────────────────────────
// Positive-only amenity badge. Renders ONLY when value === true.
export function BooleanPill({ entry, value }) {
  if (value !== true) return null;
  return (
    <ContentGroup title={null}>
      <div className="acc_list_group_1">
        <span className="acc_pill_true">{fieldLabel(entry)}</span>
      </div>
    </ContentGroup>
  );
}

// ── ChipList ──────────────────────────────────────────────────────────────
// Array of (display-ready) strings -> one chip per element.
export function ChipListWidget({ entry, value }) {
  const items = (Array.isArray(value) ? value : [value])
    .filter((x) => x != null && x !== '')
    .map((x) => (typeof x === 'object' ? (x.name || x.label || x.title || '') : String(x)))
    .filter(Boolean);
  const seen = new Set();
  const deduped = items.filter((x) => (seen.has(x) ? false : (seen.add(x), true)));
  if (deduped.length === 0) return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_list_group_1">
        {deduped.map((item, i) => (
          <span key={`${item}-${i}`}>{item}</span>
        ))}
      </div>
    </ContentGroup>
  );
}

// ── EnumPill ──────────────────────────────────────────────────────────────
// Single token -> single mapped label.
export function EnumPill({ entry, value }) {
  if (value == null || value === '') return null;
  const label = humanize(value);
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_content_text">{label}</div>
    </ContentGroup>
  );
}

// ── TextRow ───────────────────────────────────────────────────────────────
export function TextRow({ entry, value }) {
  if (value == null || value === '') return null;
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_content_text">{text}</div>
    </ContentGroup>
  );
}

// ── NumberRow ─────────────────────────────────────────────────────────────
export function NumberRow({ entry, value }) {
  if (value == null || value === '') return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_content_text">{String(value)}</div>
    </ContentGroup>
  );
}

// ── ProseBlock ────────────────────────────────────────────────────────────
// Rich text -> sanitized HTML block.
export function ProseBlock({ entry, value }) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const html = sanitizeHtml(value);
  if (!html) return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_content_text" dangerouslySetInnerHTML={{ __html: html }} />
    </ContentGroup>
  );
}

// ── LinkRow ───────────────────────────────────────────────────────────────
export function LinkRow({ entry, value }) {
  const href = withScheme(value);
  if (!href) return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_list_group_1">
        <a href={href} target="_blank" rel="noopener noreferrer">{String(value)}</a>
      </div>
    </ContentGroup>
  );
}

// ── EmailRow ──────────────────────────────────────────────────────────────
export function EmailRow({ entry, value }) {
  if (typeof value !== 'string' || value === '') return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_list_group_1">
        <a href={`mailto:${value}`}>{value}</a>
      </div>
    </ContentGroup>
  );
}

// ── PhoneRow ──────────────────────────────────────────────────────────────
export function PhoneRow({ entry, value }) {
  if (typeof value !== 'string' || value === '') return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_list_group_1">
        <a href={`tel:${value}`}>{value}</a>
      </div>
    </ContentGroup>
  );
}

// ── DateTimeRow ───────────────────────────────────────────────────────────
export function DateTimeRow({ entry, value }) {
  const formatted = formatDateTime(value);
  if (!formatted) return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_content_text">{formatted}</div>
    </ContentGroup>
  );
}

// ── DictRows ──────────────────────────────────────────────────────────────
// Field-specific JSON objects. We handle the known generic shapes:
//   - other_socials: { handle: value }  -> social links
//   - mobility_access: { flag: bool }   -> positive pills for true flags
//   - otherwise: render each scalar / array sub-value as a labelled row, and
//     skip nested objects we don't understand.
export function DictRows({ entry, value }) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  if (keys.length === 0) return null;

  // other_socials: map handle -> link.
  if (entry.key === 'other_socials') {
    const links = keys
      .map((k) => {
        const v = value[k];
        const url = typeof v === 'string' ? v : (v && (v.url || v.link));
        return url ? { label: humanize(k), url: withScheme(url) } : null;
      })
      .filter((x) => x && x.url);
    if (links.length === 0) return null;
    return (
      <ContentGroup title={fieldLabel(entry)}>
        <div className="acc_list_group_1">
          {links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
          ))}
        </div>
      </ContentGroup>
    );
  }

  // mobility_access (and similar boolean-map dicts): positive pills only.
  const allBooleanish = keys.every((k) => typeof value[k] === 'boolean');
  if (allBooleanish) {
    const trueFlags = keys.filter((k) => value[k] === true).map((k) => humanize(k));
    if (trueFlags.length === 0) return null;
    return (
      <ContentGroup title={fieldLabel(entry)}>
        <div className="acc_list_group_1">
          {trueFlags.map((f, i) => (
            <span key={`${f}-${i}`} className="acc_pill_true">{f}</span>
          ))}
        </div>
      </ContentGroup>
    );
  }

  // Generic fallback: labelled rows for scalar/array sub-values.
  const rows = keys
    .map((k) => {
      const v = value[k];
      if (v == null || v === '' || v === false) return null;
      if (Array.isArray(v)) {
        const list = v.filter((x) => x != null && x !== '');
        if (list.length === 0) return null;
        return { label: humanize(k), text: list.map((x) => (typeof x === 'object' ? (x.name || x.label || '') : String(x))).filter(Boolean).join(', ') };
      }
      if (typeof v === 'object') return null; // skip unknown nested objects
      return { label: humanize(k), text: String(v) };
    })
    .filter(Boolean);
  if (rows.length === 0) return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_content_text">
        {rows.map((r, i) => (
          <p key={i}><strong>{r.label}:</strong> {r.text}</p>
        ))}
      </div>
    </ContentGroup>
  );
}

// ── ImageGrid ─────────────────────────────────────────────────────────────
// Array of POIImage objects.
export function ImageGrid({ entry, value }) {
  const list = (Array.isArray(value) ? value : []).filter((img) => img && (img.url || img.storage_url || img.image_url));
  if (list.length === 0) return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_image_grid">
        {list.map((img, i) => {
          const full = img.url || img.storage_url || img.image_url;
          const thumb = img.thumbnail_url || full;
          return (
            <a key={img.id || i} href={full} target="_blank" rel="noopener noreferrer">
              <img src={thumb} alt={img.alt_text || ''} loading="lazy" />
            </a>
          );
        })}
      </div>
    </ContentGroup>
  );
}

// ── RelationLink ──────────────────────────────────────────────────────────
// A single related POI id, or an array of link objects / ids.
export function RelationLink({ entry, value }) {
  const list = Array.isArray(value) ? value : (value ? [value] : []);
  const items = list
    .map((item) => {
      if (item == null || item === '') return null;
      if (typeof item === 'string') return { id: item, name: item };
      if (typeof item === 'object') {
        const id = item.id || item.poi_id || item.target_poi_id || item.related_poi_id;
        const name = item.name || item.title || item.label || (item.target_poi && item.target_poi.name);
        if (!id && !name) return null;
        return { id, name: name || id };
      }
      return null;
    })
    .filter(Boolean);
  if (items.length === 0) return null;
  return (
    <ContentGroup title={fieldLabel(entry)}>
      <div className="acc_list_group_1">
        {items.map((it, i) =>
          it.id ? (
            <a key={it.id || i} href={`/poi/${it.id}`}>{it.name}</a>
          ) : (
            <span key={i}>{it.name}</span>
          )
        )}
      </div>
    </ContentGroup>
  );
}
