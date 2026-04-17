// Centralized HTML sanitization for any content that flows into
// `dangerouslySetInnerHTML`. The backend's html_sanitizer is the primary
// defense, but defense-in-depth on the frontend stops a regression there
// (or any future endpoint that bypasses it) from becoming a stored XSS.
//
// Usage:
//   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(poi.description_long) }} />
//
// For embedding user-controlled values inside a JSON-LD <script> block, use
// `escapeForJsonLd(JSON.stringify(obj))` — DOMPurify cannot help there
// because the payload isn't HTML.

import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'a', 'b', 'strong', 'i', 'em', 'u', 's', 'br', 'p', 'div', 'span',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'hr',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'img', 'figure', 'figcaption',
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel',
    'src', 'alt', 'width', 'height',
    'class', 'style',
  ],
  // Block javascript:, data:, vbscript: URLs. Only http(s), mailto, tel, anchors, relative paths.
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|#|\/|\.\.?\/)/i,
  // No SVG/MathML containers — they're a foothold for mXSS.
  USE_PROFILES: { html: true },
  // Strip event handlers and any DOM clobbering attempts.
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
};

export function sanitizeHtml(html) {
  if (typeof html !== 'string' || html.length === 0) return '';
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

// JSON-LD lives inside a <script> tag, so any user value containing the
// literal `</script` would let an attacker break out and execute code.
// Escaping `<` to its unicode form keeps the JSON valid AND closes the
// breakout vector.
export function escapeForJsonLd(jsonString) {
  if (typeof jsonString !== 'string') return '';
  return jsonString
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
