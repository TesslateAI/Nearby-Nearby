import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useOverlay from './hooks/useOverlay';
import MobileNavBar from './components/MobileNavBar';
import AnnouncementBanner from './components/AnnouncementBanner';
import Navbar from './components/Navbar';
import SearchOverlay from './components/SearchOverlay';
import Footer from './components/Footer';
import Home from './pages/Home';
import POIDetail from './pages/POIDetail';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Services from './pages/Services';
import Explore from './pages/Explore';
import CommunityInterest from './pages/CommunityInterest';
import Contact from './pages/Contact';
import Feedback from './pages/Feedback';
import ClaimBusiness from './pages/ClaimBusiness';
import SuggestEvent from './pages/SuggestEvent';
import EventsCalendar from './pages/EventsCalendar';

function App() {
  const navOverlay = useOverlay('nav_overlay', { skipDesktop: true });
  const searchOverlay = useOverlay('search_overlay', { focusTargetId: 'one_search' });

  useEffect(() => {
    const root = document.documentElement;
    const keyboardKeys = new Set([
      'Tab',
      'Enter',
      ' ',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ]);

    const enableKeyboardFocus = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!keyboardKeys.has(event.key)) return;
      root.classList.add('using-keyboard');
    };

    const disableKeyboardFocus = () => {
      root.classList.remove('using-keyboard');
    };

    window.addEventListener('keydown', enableKeyboardFocus, true);
    window.addEventListener('pointerdown', disableKeyboardFocus, true);
    window.addEventListener('mousedown', disableKeyboardFocus, true);
    window.addEventListener('touchstart', disableKeyboardFocus, true);

    return () => {
      window.removeEventListener('keydown', enableKeyboardFocus, true);
      window.removeEventListener('pointerdown', disableKeyboardFocus, true);
      window.removeEventListener('mousedown', disableKeyboardFocus, true);
      window.removeEventListener('touchstart', disableKeyboardFocus, true);
      root.classList.remove('using-keyboard');
    };
  }, []);

  return (
    <>
      <a className="skip-main" href="#main_content">Skip to main content</a>

      <MobileNavBar searchOverlay={searchOverlay} navOverlay={navOverlay} />
      <AnnouncementBanner />
      <Navbar navOverlay={navOverlay} searchOverlay={searchOverlay} />
      <SearchOverlay
        isOpen={searchOverlay.isOpen}
        onClose={searchOverlay.close}
        panelRef={searchOverlay.panelRef}
      />

      <main id="main_content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          {/* Support both UUID and slug-based URLs */}
          <Route path="/poi/:id" element={<POIDetail />} />
          <Route path="/places/:slug" element={<POIDetail />} />
          <Route path="/events/:slug" element={<POIDetail />} />
          <Route path="/parks/:slug" element={<POIDetail />} />
          <Route path="/trails/:slug" element={<POIDetail />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/services" element={<Services />} />
          <Route path="/community-interest" element={<CommunityInterest />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/claim-business" element={<ClaimBusiness />} />
          <Route path="/suggest-event" element={<SuggestEvent />} />
          <Route path="/suggest-place" element={<Navigate to="/claim-business" replace />} />
          <Route path="/events-calendar" element={<EventsCalendar />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;
