import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import POIDetail from './pages/POIDetail';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Services from './pages/Services';
import Explore from './pages/Explore';

function App() {
  return (
    <>
      <Navbar />
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
      </Routes>
      <Footer />
    </>
  );
}

export default App;
