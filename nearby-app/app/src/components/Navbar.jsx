import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleDisasterClick = () => {
    alert('Disaster feature is being implemented soon! Stay tuned.');
    closeMobileMenu();
  };

  return (
    <div className="nn-navbar">
      <div className="nn-navbar__inner">
        <div className="nn-navbar__brand">
          <Link to="/" aria-label="Nearby Nearby home" onClick={closeMobileMenu}>
            <img src="/Logo.png" alt="Nearby Nearby logo" />
          </Link>

          {/* Feedback button - always visible */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSetfynNv-Tai0oWF-RgthkwiBcenZkSK1xiZRiqWvB9VBaKRg/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            className="nn-navbar__feedback"
          >
            Feedback
          </a>
        </div>

        {/* Hamburger menu button for mobile */}
        <button
          className={`nn-navbar__hamburger ${mobileMenuOpen ? 'open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nn-navbar__center ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Primary">
          <ul>
            <li>
              <Link
                className={location.pathname === '/' ? 'active' : ''}
                to="/"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                className={location.pathname === '/explore' || location.pathname.startsWith('/explore?') ? 'active' : ''}
                to="/explore"
                onClick={closeMobileMenu}
              >
                Explore
              </Link>
            </li>
            <li>
              <span className="nn-navbar__coming-soon" onClick={handleDisasterClick} style={{ cursor: 'pointer' }}>Disaster</span>
            </li>
          </ul>
        </nav>
        {/* <div className="nn-navbar__right">
          <button className="nn-navbar__user" aria-label="User account">
            <User size={18} />
            <span>Username</span>
          </button>
        </div> */}
      </div>
    </div>
  );
}

export default Navbar;
