import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';
import './Hero.css';

function Hero() {

  return (
    <header className="nn-hero">
      {/* Announcement bar sits under the navbar */}
      <div className="nn-announce">
        <span className="nn-announce-icon" aria-hidden>⚠️</span>
        <span>
          Testing in Progress: Currently, Nearby Nearby is available only in select areas of Pittsboro, NC. We are starting small to ensure we get it right.
        </span>
      </div>

      {/* Content */}
      <div className="nn-hero__inner">
        <h1 className="nn-title">Nearby Nearby</h1>
        <p className="nn-subtitle">Whats Actually Nearby</p>

        <p className="nn-lede">
          No Ads. No Clutter.
          <br />
          A true picture of your community, right at your fingertips.
        </p>
        {/* Search card */}
        <div className="nn-search-card">
          <p className="nn-support">
            One Search shows local businesses, events, parks, trails and more. All verified and based on what's actually nearby.
          </p>
          {/* Search panel */}
          <form className="nn-search" onSubmit={(e) => e.preventDefault()} role="search" aria-label="Nearby search">
            <SearchBar placeholder="What's nearby? Search for locations or interests..." />
            <button className="nn-button" type="submit">Search</button>
          </form>
          {/* Terms */}
          <p className="nn-terms">By clicking Search, you agree to our <Link to="/terms-of-service" className="nn-terms__link">Terms of Service</Link>.</p>
        </div>

        {/* Decorative background image */}
        <div className="nn-doodle" aria-hidden />
      </div>
    </header>
  );
}

export default Hero;
