// Shared helpers for the registry-driven auto-render widgets.

/** Humanize a raw token / snake_case key into a display label. */
export function humanize(token) {
  if (token == null) return '';
  const s = String(token);
  if (s === '') return '';
  // Already display-ready (has a space or uppercase) — leave as-is.
  if (/[A-Z]/.test(s) || s.includes(' ')) return s;
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Ensure a URL has a scheme so anchors resolve to absolute targets. */
export function withScheme(url) {
  if (typeof url !== 'string' || url === '') return null;
  if (/^(https?:)?\/\//i.test(url) || /^[a-z]+:/i.test(url)) return url;
  return `https://${url}`;
}

/**
 * The render_rule "is this value empty?" check shared by AttributeSections and
 * every widget. Mirrors `hasVal` semantics but centralized for the registry
 * render layer:
 *   - null / undefined / "" / false  -> empty
 *   - []  (after dropping null/"") -> empty
 *   - {}  (no own keys) -> empty
 */
export function isEmptyValue(v) {
  if (v == null || v === '' || v === false) return true;
  if (Array.isArray(v)) {
    return v.filter((x) => x != null && x !== '').length === 0;
  }
  if (typeof v === 'object') {
    return Object.keys(v).length === 0;
  }
  return false;
}

/** Format an ISO datetime/date string for display. */
export function formatDateTime(iso) {
  if (typeof iso !== 'string' || iso === '') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hasTime = /T\d{2}:\d{2}/.test(iso) && !/T00:00:00($|\.|Z|[+-])/.test(iso);
  const opts = hasTime
    ? { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { month: 'long', day: 'numeric', year: 'numeric' };
  try {
    return d.toLocaleString('en-US', opts);
  } catch {
    return iso;
  }
}
