import { Children } from 'react';
import Accordion, { AccordionSection } from '../Accordion';

/**
 * SectionBlock — single-section accordion wrapper for POI detail pages.
 *
 * Wraps the existing Accordion primitive in template's .poi_info_block
 * container. Returns null if children is null/empty/all-null-array so
 * that sections with no data disappear entirely ("empty section → hide"
 * per plan business rules).
 *
 * Props:
 *   id          - hash-link id for the section
 *   title       - accordion head title
 *   defaultOpen - open on mount
 *   children    - section body (rendered only if non-empty)
 */
export default function SectionBlock({ id, title, defaultOpen = false, children }) {
  // Filter out null/false/empty-string children. If every child is empty,
  // bail out entirely so the accordion never renders.
  const childArray = Children.toArray(children).filter(
    (c) => c != null && c !== false && !(typeof c === 'string' && c.trim() === '')
  );
  if (childArray.length === 0) return null;

  return (
    <section className="poi_info_block">
      <Accordion activeIndex={defaultOpen ? 1 : false} closeOther={false}>
        <AccordionSection id={id} title={title}>
          {childArray}
        </AccordionSection>
      </Accordion>
    </section>
  );
}
