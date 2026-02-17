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

function App() {
  const navOverlay = useOverlay('nav_overlay', { skipDesktop: true });
  const searchOverlay = useOverlay('search_overlay', { focusTargetId: 'one_search' });

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
          <Route path="/suggest-place" element={<Navigate to="/claim-business" replace />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;
