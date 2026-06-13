import { useState, useEffect, useRef, useCallback, Children, cloneElement } from 'react';
import './Accordion.css';

/**
 * React accordion — ported from nn-templates/inc/accordion.js
 *
 * Usage:
 *   <Accordion closeOther scrollOffset={120}>
 *     <AccordionSection title="Hours & Location" id="hours">
 *       {content}
 *     </AccordionSection>
 *   </Accordion>
 */

const SLIDE_SPEED = 200; // ms, matches Barry's default

function slideDown(el, duration) {
  return new Promise(resolve => {
    el.style.removeProperty('display');
    el.style.display = 'block';
    const height = el.scrollHeight;
    el.style.overflow = 'hidden';
    el.style.height = '0';
    el.style.paddingTop = '0';
    el.style.paddingBottom = '0';
    el.offsetHeight; // force repaint
    el.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
    el.style.height = height + 'px';
    el.style.removeProperty('padding-top');
    el.style.removeProperty('padding-bottom');
    setTimeout(() => {
      el.style.removeProperty('height');
      el.style.removeProperty('overflow');
      el.style.removeProperty('transition');
      resolve();
    }, duration);
  });
}

function slideUp(el, duration) {
  return new Promise(resolve => {
    el.style.height = el.scrollHeight + 'px';
    el.offsetHeight; // force repaint
    el.style.overflow = 'hidden';
    el.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
    requestAnimationFrame(() => {
      el.style.height = '0';
      el.style.paddingTop = '0';
      el.style.paddingBottom = '0';
    });
    setTimeout(() => {
      el.style.display = 'none';
      el.style.removeProperty('height');
      el.style.removeProperty('padding-top');
      el.style.removeProperty('padding-bottom');
      el.style.removeProperty('overflow');
      el.style.removeProperty('transition');
      resolve();
    }, duration);
  });
}

export function AccordionSection({ title, id, children, show = true }) {
  // Render placeholder — actual logic handled by parent Accordion
  if (!show) return null;
  return { title, id, children };
}

export default function Accordion({
  children,
  closeOther = true,
  closeAble = true,
  scrollOffset = 120,
  slideSpeed = SLIDE_SPEED,
  activeIndex = false, // false = all closed, 1 = first open, [1,2] = multiple
}) {
  const [openSections, setOpenSections] = useState(new Set());
  const contentRefs = useRef({});
  const sectionRefs = useRef({});
  const initialized = useRef(false);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  // Extract valid AccordionSection children
  const sections = [];
  Children.forEach(children, (child) => {
    if (child && child.type === AccordionSection && child.props.show !== false) {
      sections.push(child.props);
    }
  });

  // Initialize active index on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initial = new Set();
    if (Array.isArray(activeIndex)) {
      activeIndex.forEach(i => {
        if (sections[i - 1]) initial.add(sections[i - 1].id || sections[i - 1].title);
      });
    } else if (typeof activeIndex === 'number' && activeIndex >= 1) {
      const s = sections[activeIndex - 1];
      if (s) initial.add(s.id || s.title);
    }
    if (initial.size > 0) {
      setOpenSections(initial);
      // Show content immediately for initial sections (no animation)
      initial.forEach(key => {
        const el = contentRefs.current[key];
        if (el) el.style.display = 'block';
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hash-based deep linking
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.substring(1);
      if (!hash) return;
      const section = sections.find(s => s.id === hash);
      if (section) {
        const key = section.id || section.title;
        setOpenSections(prev => {
          const next = closeOther ? new Set([key]) : new Set(prev).add(key);
          return next;
        });
        // Scroll after brief delay
        setTimeout(() => {
          const el = sectionRefs.current[key];
          if (el) {
            const top = el.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: top - scrollOffset, behavior: 'smooth' });
          }
        }, slideSpeed + 50);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [sections.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSection = useCallback((key) => {
    const speed = reducedMotion.current ? 0 : slideSpeed;

    setOpenSections(prev => {
      const isOpen = prev.has(key);

      if (isOpen) {
        // Close this section
        if (!closeAble && prev.size === 1) return prev; // can't close last one
        const el = contentRefs.current[key];
        if (el) slideUp(el, speed);
        const next = new Set(prev);
        next.delete(key);
        return next;
      } else {
        // Close others if needed
        if (closeOther) {
          prev.forEach(openKey => {
            if (openKey !== key) {
              const el = contentRefs.current[openKey];
              if (el) slideUp(el, speed);
            }
          });
        }
        // Open this section
        const el = contentRefs.current[key];
        if (el) {
          slideDown(el, speed).then(() => {
            const sectionEl = sectionRefs.current[key];
            if (sectionEl) {
              const top = sectionEl.getBoundingClientRect().top + window.pageYOffset;
              window.scrollTo({ top: top - scrollOffset, behavior: 'smooth' });
            }
          });
        }
        return closeOther ? new Set([key]) : new Set(prev).add(key);
      }
    });
  }, [closeOther, closeAble, scrollOffset, slideSpeed]);

  return (
    <div className="accordionjs">
      {sections.map((section) => {
        const key = section.id || section.title;
        const isOpen = openSections.has(key);

        return (
          <div
            key={key}
            id={section.id}
            className={`acc_section${isOpen ? ' acc_active' : ''}`}
            ref={el => { sectionRefs.current[key] = el; }}
          >
            <button
              className="acc_head"
              type="button"
              aria-expanded={isOpen}
              aria-controls={`acc_panel_${key}`}
              onClick={() => toggleSection(key)}
            >
              <span className="acc_head_title">
                <h3 className="acc_title">{section.title}</h3>
              </span>
              <span className="acc_toggles">
                <svg className="acc_toggle_icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
            <div
              id={`acc_panel_${key}`}
              className="acc_content"
              role="region"
              aria-labelledby={`acc_panel_${key}_head`}
              ref={el => { contentRefs.current[key] = el; }}
              style={{ display: isOpen ? 'block' : 'none' }}
            >
              {section.children}
            </div>
          </div>
        );
      })}
    </div>
  );
}
