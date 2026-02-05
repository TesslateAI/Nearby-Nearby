import { Link } from 'react-router-dom';
import logoImage from '../assets/nn-logo-vertical-icon-words-high-res.png';
import InstallButton from './InstallButton';
import './Footer.css';

function Footer() {
  return (
    <footer className="nn-footer" role="contentinfo">
      <div className="nn-footer__inner">
        {/* Sponsors header and logo strip - HIDDEN */}
        {/* <section className="sponsors" aria-labelledby="sponsors-title">
          <h3 id="sponsors-title" className="sponsors__title">CHATHAM COUNTY SPONSORS</h3>
          <div className="sponsors__row">
            <img src="/sponsors.png" alt="UNC Health Chatham, Mountaire, New York Life, Strick's LP Gas, Siler Area Chamber of Commerce" />
          </div>
        </section> */}

        {/* Purple CTA banner */}
        <section className="cta" aria-label="Bring Nearby Nearby to your community">
          <div className="cta__card">
            <h3 className="cta__title">Want <strong>Nearby Nearby</strong> in <strong>Your</strong> Community</h3>
            <p className="cta__sub">We're just getting started! Tell us if you want us in your community. If you're outside North Carolina, don't worry, we're coming nationwide soon, including rural towns and urban communities!</p>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSf__DdBbfnnLFMckLi42sOibVZ_Wp1DL4U-8Uiek7NKiGjR3Q/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" className="cta__button">Let's Bring It Home</a>
          </div>
        </section>

        {/* Links grid */}
        <section className="footer-grid">
          <div className="grid__brand">
            <img className="brand__logo" src={logoImage} alt="Nearby Nearby" />
            <div className="brand__social">
              <span>Follow us</span>
              <a href="https://www.facebook.com/ItsNearbyNearby" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social__icon" title="Facebook">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M13 10h3l-1 4h-2v8h-4v-8H7v-4h2V8c0-2.2 1.3-4 4-4h3v4h-2c-.7 0-1 .3-1 1v1Z" fill="currentColor"/></svg>
              </a>
              <a href="https://www.instagram.com/itsnearbynearby" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social__icon" title="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/nearby-nearby/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="social__icon" title="LinkedIn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M6.5 8.5v12h-3v-12h3Zm.2-3.2c0 .9-.7 1.7-1.7 1.7-1 0-1.7-.8-1.7-1.7S4 3.5 5 3.5c1 0 1.7.8 1.7 1.8ZM20.5 20.5h-3v-6.5c0-1.3-.5-2.2-1.6-2.2-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8v6.7h-3s0-11 0-12h3v1.7c.4-.6 1.1-1.5 2.7-1.5 2 0 3.6 1.3 3.6 4.2v7.6Z" fill="currentColor"/></svg>
              </a>
            </div>
          </div>

          <nav className="grid__col">
            <span className="col__title">ABOUT</span>
            <p className="col__copy">From local businesses to parks and events, we're making it easier for rural communities to discover, support, and celebrate what makes their towns unique.</p>
            <div className="col__download">
              <InstallButton variant="footer" />
            </div>
          </nav>

          <nav className="grid__col">
            <span className="col__title">GET INVOLVED</span>
            <ul>
              <li><Link to="/services" onClick={() => window.scrollTo(0, 0)}>Services</Link></li>
              <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSetfynNv-Tai0oWF-RgthkwiBcenZkSK1xiZRiqWvB9VBaKRg/viewform?usp=preview" target="_blank" rel="noopener noreferrer">Share your feedback</a></li>
              <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSfJY8u9phKoKZe_xJINCPswlHwMOFylRf7E0URYupyFOKFmwQ/viewform?usp=dialog" target="_blank" rel="noopener noreferrer">Contact Us</a></li>
              <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSfqF-lLL1-V_6e-QUZd9VoIrywMu66rhGDn5tVrrOVNFCaN8Q/viewform" target="_blank" rel="noopener noreferrer">Register your Business</a></li>
              <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSf__DdBbfnnLFMckLi42sOibVZ_Wp1DL4U-8Uiek7NKiGjR3Q/viewform" target="_blank" rel="noopener noreferrer">Community Interest</a></li>
            </ul>
          </nav>

          <nav className="grid__col">
            <span className="col__title">LEGAL &amp; POLICIES</span>
            <ul>
              <li><Link to="/terms-of-service" onClick={() => window.scrollTo(0, 0)}>Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy-policy" onClick={() => window.scrollTo(0, 0)}>Privacy Policy</Link></li>
            </ul>
          </nav>
        </section>

        <div className="copyright">© Copyright 2025, All Rights Reserved by Nearby Nearby</div>
      </div>
    </footer>
  );
}

export default Footer;
