import { useNavigate } from 'react-router-dom';
import InstallButton from '../components/InstallButton';
import './Services.css';

function Services() {
  const navigate = useNavigate();

  return (
    <div className="services-page">
      <div className="services-page__container">
        <button onClick={() => navigate('/')} className="services-page__back-link">
          ← Back to Search
        </button>

        <div className="services-page__content">
          <h1 className="services-page__title">Nearby Nearby Services</h1>

          <section className="services-page__section">
            <h2>Local Discovery and Travel Information Tools</h2>
            <p>
              Nearby Nearby helps people discover what's close by and how to get there. Our platform brings together local businesses, events, parks, trails, and community spaces in one place so users can plan their visits and navigate rural communities more easily.
            </p>
            <p>We currently provide:</p>
            <ul>
              <li>Local discovery information for trips, day visits, and weekend plans</li>
              <li>Travel guidance about what is nearby, including parks, trails, businesses, and events</li>
              <li>Route-based, location-based and proximity-based suggestions to help people decide where to go next</li>
              <li>Map-based browsing to explore towns and rural areas</li>
              <li>Distance and travel route information to support trip planning and stop-by-stop exploration</li>
              <li>Contextual guidance around each place, including nearby attractions, community landmarks, and points of interest</li>
              <li>Direct links to reservation, booking, or scheduling pages provided by local businesses, organizations, or venues</li>
              <li>Travel arrangement and transportation reservation services; providing information about travel routes, transportation options, and travel transportation logistics; travel guide services focused on enhancing local discovery experiences in the fields of travel and tourism</li>
            </ul>
            <p>
              These tools serve as a form of digital travel guidance for rural communities, helping residents and visitors navigate what's open, accessible, and worth visiting.
            </p>
          </section>

          <section className="services-page__section">
            <h2>Business Visibility and Marketplace Services</h2>
            <p>
              Nearby Nearby provides advertising and promotional services for local businesses, organizations, and event hosts, helping them be seen by the people who live in and visit their communities.
            </p>
            <p>We currently offer:</p>
            <ul>
              <li>Free and paid listings for local businesses, events, and community organizations</li>
              <li>Advertising and promotion of the goods and services of others through our website and interactive map</li>
              <li>An online marketplace featuring the goods and services of others, enabling users to discover, access, and connect with local businesses, organizations, and event providers</li>
              <li>A location-based marketplace-style experience that helps users explore what's nearby through verified, community-driven listings</li>
              <li>Tools that help businesses reach residents, tourists, and visitors who want to support their local economy</li>
            </ul>
            <p className="services-page__note">
              All transactions take place directly between the consumer and the business. Nearby Nearby does not process payments or handle fulfillment. Our platform is focused on visibility, discovery, advertising, and connection.
            </p>
          </section>

          <section className="services-page__section">
            <h2>Cultural and Educational Content</h2>
            <p>
              Nearby Nearby provides educational and cultural content that helps people learn about rural communities, their history, businesses, and places to explore.
            </p>
            <p>We currently offer:</p>
            <ul>
              <li>Community spotlights and storytelling features that highlight rural businesses, farms, parks, makers, and events</li>
              <li>Rural tourism content that educates users about local history, culture, and travel opportunities</li>
              <li>Informational articles and social media posts that help residents and visitors understand the identity of each town</li>
              <li>Listings and features for cultural events, festivals, and local markets</li>
              <li>Participation in educational partnerships and rural entrepreneurship programs through pitch events, panels, and nonprofit collaborations</li>
              <li>Public-facing outreach and content that promotes rural communities and educates the public on their value and challenges</li>
            </ul>
            <p>
              These services are provided through our website, digital channels, and community partnerships. In addition to the content published on our platform, Nearby Nearby also supports and promotes educational efforts through partnerships with rural organizations, small businesses, and tourism leaders. Nearby Nearby advances local knowledge, community visibility, and visitor readiness through accessible content and shared learning across rural communities.
            </p>
          </section>

          <section className="services-page__section">
            <h2>Technology and Data Services for Community, Tourism, and Resilience Support</h2>
            <p>
              Nearby Nearby provides technology solutions and hosted services that help rural communities, local governments, and tourism groups better showcase, connect, and support their local assets.
            </p>
            <p>We currently offer:</p>
            <ul>
              <li>Hosted visibility tools for small businesses, events, parks, and services, including listings and location data maintained through our platform</li>
              <li>Community-facing discovery features powered by our patent-pending One Search mapping technology</li>
              <li>Aggregated and anonymized data insights to support planning, tourism, and rural economic development</li>
              <li>Location-based technology that supports disaster preparedness and post-disaster access to services</li>
              <li>Opportunities for white-label implementations, custom deployments, and software consulting</li>
              <li>API access and data-sharing partnerships for qualifying local and regional organizations</li>
              <li>AI-powered trip planning tools, including itinerary suggestions based on interest, location, pet-friendliness, family readiness, seasonal themes, and more</li>
            </ul>
            <p className="services-page__note">
              To inquire about partnership, licensing, or access to our API and technology services, contact connect@nearbynearby.com.
            </p>
          </section>

          <section className="services-page__section">
            <h2>Data Services and Local Insights</h2>
            <p>
              As part of our technology and data offering, Nearby Nearby provides rural communities, local governments, and tourism boards with anonymized, aggregated insights to support economic development, tourism planning, and community decision-making.
            </p>
            <p>Depending on location and participation, we can provide:</p>
            <ul>
              <li>Real-time search interest data by geography (what people are looking for, when, and where)</li>
              <li>Verified business counts by category and location (e.g. how many restaurants, mechanics, or wellness services are active in a given area)</li>
              <li>Year-over-year business trends (businesses gained, businesses lost, what categories are growing or shrinking)</li>
              <li>Most-viewed listings and search heatmaps (businesses, parks, trails, events)</li>
              <li>Visitor interest patterns (where people are coming from, what drew them in)</li>
              <li>Custom location reports for towns, counties, or regions</li>
            </ul>
            <p>In addition to aggregated insights, Nearby Nearby can also support:</p>
            <ul>
              <li>Verified inventory of local assets for economic development teams and grant writers</li>
              <li>AI-powered trip planning tools, including itinerary suggestions based on interest, location, pet-friendliness, family readiness, seasonal themes, and more</li>
            </ul>
            <p>
              These data services are available through custom reports, dashboards, or partner API integrations and are designed to support stronger rural economies, targeted tourism growth, and informed community investment.
            </p>
            <p className="services-page__note">
              All insights will be anonymized and focused on supporting stronger rural economies and better decision making.
            </p>
          </section>

          <section className="services-page__section">
            <h2>Downloadable Mobile Access</h2>
            <p>
              Nearby Nearby is available as a downloadable experience on supported devices.
            </p>
            <p>We provide:</p>
            <ul>
              <li>An installable mobile experience that can be added to a home screen</li>
              <li>Local caching for faster access</li>
              <li>An app style way to open Nearby Nearby directly without going through a browser each time</li>
            </ul>
            <p>
              This keeps Nearby Nearby close at hand whenever people are out in their community.
            </p>
            <div className="services-page__download">
              <InstallButton />
            </div>
          </section>
        </div>

        <button onClick={() => navigate('/')} className="services-page__back-btn">
          Back to Search
        </button>
      </div>
    </div>
  );
}

export default Services;
