import { useNavigate } from 'react-router-dom';
import './TermsOfService.css';

function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="terms-of-service">
      <div className="terms-of-service__container">
        <button onClick={() => navigate('/')} className="terms-of-service__back-link">
          ← Back to Search
        </button>

        <div className="terms-of-service__content">
          <h1 className="terms-of-service__title">Terms of Service</h1>

          <p className="terms-of-service__intro">
            By accessing or using Nearby Nearby, you agree to follow these Terms of Service and Conditions.
          </p>

          <section className="terms-of-service__section">
            <h2>1. Purpose</h2>
            <p>
              Nearby Nearby is a platform designed to help people discover local businesses, parks, events, and services in rural communities. Our listings are for general information only and may change over time.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>2. Respect Our Work</h2>
            <p>
              All content, listings, maps, and data on Nearby Nearby are protected by copyright, trademark, and other applicable laws.
            </p>
            <ul>
              <li>
                You may not copy, scrape, download, display, sell, lease, modify, or distribute any part of this website or its data without written permission from Nearby Nearby.
              </li>
              <li>
                Automated data collection tools, bots, or crawlers are strictly prohibited.
              </li>
              <li>
                Any unauthorized use of our data or materials may result in suspension of access, removal of content, or legal action to protect our rights, including damages and injunctive relief.
              </li>
              <li>
                Nearby Nearby retains all ownership and intellectual property rights in the platform, its listings, design, and underlying data.
              </li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>3. Use Responsibly</h2>
            <p>
              You agree to use this website only for lawful purposes and in ways that do not harm, disable, or interfere with the platform or others using it.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>4. Accuracy</h2>
            <p>
              We work hard to keep our information accurate and up to date, but we cannot guarantee every detail. We're not responsible for errors, changes, or closures that occur after a listing is published.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>5. Changes</h2>
            <p>
              We may update these Terms of Service at any time. The most recent version will always be posted here.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>6. Contact</h2>
            <p>
              For questions about these Terms, please contact us at:{' '}
              <a href="mailto:legal@nearbynearby.com" className="terms-of-service__link">
                legal@nearbynearby.com
              </a>
            </p>
          </section>
        </div>

        <button onClick={() => navigate('/')} className="terms-of-service__back-btn">
          Back to Search
        </button>
      </div>
    </div>
  );
}

export default TermsOfService;
