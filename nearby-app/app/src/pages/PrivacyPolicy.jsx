import { useNavigate } from 'react-router-dom';
import './TermsOfService.css';

function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="terms-of-service">
      <div className="terms-of-service__container">
        <button onClick={() => navigate('/')} className="terms-of-service__back-link">
          ← Back to Search
        </button>

        <div className="terms-of-service__content">
          <h1 className="terms-of-service__title">Privacy Policy</h1>

          <p className="terms-of-service__intro">
            By using Nearby Nearby, you agree to this Privacy Policy and understand how we collect and use information.
          </p>

          <section className="terms-of-service__section">
            <h2>Purpose</h2>
            <p>
              Nearby Nearby helps people discover local businesses, parks, events, and services in rural communities. We collect limited information to improve your experience and keep the platform running smoothly.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>Information We Collect</h2>
            <p>We may collect:</p>
            <ul>
              <li>
                Information you share directly with us, such as your name, email, phone number, or business details when filling out a form or subscribing to updates.
              </li>
              <li>
                Basic technical data, such as your browser type, device, and pages visited, to help us understand how the site is being used.
              </li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>How We Use Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Respond to messages or requests you send.</li>
              <li>Improve the accuracy and performance of the platform.</li>
              <li>Share updates about Nearby Nearby and our community.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>Protecting Your Information</h2>
            <p>
              We take reasonable steps to keep your data secure and limit access to authorized team members only. We do not sell your personal information.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>Sharing Information</h2>
            <p>
              We may share limited data with trusted service providers that help us operate the website, such as email or analytics tools. These providers must also protect your information and use it only for the purpose of supporting Nearby Nearby.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>Cookies and Analytics</h2>
            <p>
              Our website may use basic cookies or analytics tools to improve usability. You can adjust your browser settings to refuse cookies if you prefer.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>Your Choices</h2>
            <p>You can contact us anytime to:</p>
            <ul>
              <li>Ask what information we have about you.</li>
              <li>Request corrections or deletion of your data.</li>
              <li>Unsubscribe from emails or updates.</li>
            </ul>
          </section>

          <section className="terms-of-service__section">
            <h2>Updates</h2>
            <p>
              We may update this Privacy Policy as our platform grows. The most recent version will always be available on this page.
            </p>
          </section>

          <section className="terms-of-service__section">
            <h2>Contact</h2>
            <p>
              For questions about this Privacy Policy, please contact us at:{' '}
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

export default PrivacyPolicy;
