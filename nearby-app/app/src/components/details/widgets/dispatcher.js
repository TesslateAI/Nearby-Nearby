// Maps a registry entry's `type` to the auto-render widget that handles it.
//
// Only the "auto"-render value types are mapped. Bespoke-only structural types
// (image, geo) are intentionally NOT in this map — they are never produced by
// groupsFor() (render !== "auto") and must be rendered by dedicated components.

import {
  BooleanPill,
  ChipListWidget,
  EnumPill,
  TextRow,
  NumberRow,
  ProseBlock,
  LinkRow,
  EmailRow,
  PhoneRow,
  DateTimeRow,
  DictRows,
  ImageGrid,
  RelationLink,
} from './widgets.jsx';

/** registry entry.type -> widget component */
export const WIDGET_BY_TYPE = {
  boolean: BooleanPill,
  multi: ChipListWidget,
  enum: EnumPill,
  text: TextRow,
  number: NumberRow,
  richtext: ProseBlock,
  url: LinkRow,
  email: EmailRow,
  phone: PhoneRow,
  datetime: DateTimeRow,
  date: DateTimeRow,
  dict: DictRows,
  'image[]': ImageGrid,
  relation: RelationLink,
};

/** Returns the widget for a registry entry, or null if its type is unmapped. */
export function widgetFor(entry) {
  if (!entry || !entry.type) return null;
  return WIDGET_BY_TYPE[entry.type] || null;
}
