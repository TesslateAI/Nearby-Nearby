export default function ContentGroup({ title, children, when = true }) {
  if (!when) return null;
  const arr = Array.isArray(children) ? children : [children];
  const anyTruthy = arr.some(
    (c) => c != null && c !== false && !(typeof c === 'string' && c.trim() === '')
  );
  if (!anyTruthy) return null;
  return (
    <div className="acc_content_group">
      {title && <div className="acc_content_title_style_1">{title}</div>}
      {children}
    </div>
  );
}
