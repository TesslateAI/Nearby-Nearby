import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { Store, Trees, Mountain, Calendar, PawPrint, Accessibility, ArrowRight } from 'lucide-react';
import './Home.css';

const CATEGORIES = [
  { name: 'Businesses', icon: Store, path: '/explore?type=BUSINESS', color: 'var(--nn-purple1)' },
  { name: 'Parks', icon: Trees, path: '/explore?type=PARK', color: 'var(--nn-green)' },
  { name: 'Trails', icon: Mountain, path: '/explore?type=TRAIL', color: 'var(--nn-teal1)' },
  { name: 'Events', icon: Calendar, path: '/explore?type=EVENT', color: 'var(--nn-blue)' },
  { name: 'Pet Friendly', icon: PawPrint, path: '/explore?amenity=pet-friendly', color: 'var(--nn-purple2)' },
  { name: 'Wheelchair', icon: Accessibility, path: '/explore?amenity=wheelchair-accessible', color: 'var(--nn-gold)' },
];

const BLOG_POSTS = [
  {
    title: "Rural America Was Never Broken\u2014It's Just Been Overlooked",
    url: 'https://blog.nearbynearby.com/rural-america-was-never-broken-its-just-been-overlooked/',
    image: 'https://blog.nearbynearby.com/wp-content/uploads/The-VIsability-of-Rural-America-600x339.jpg',
    excerpt: "Rural America isn't struggling because it's incapable\u2014it's struggling because it's been made invisible. The businesses, services, and events that fuel small towns aren't failing due to a lack of quality or effort; they're facing an uphill battle because the systems in place weren't designed for them.",
  },
  {
    title: 'Looking Ahead through 2025: Strengthening Rural Connections and Opportunities',
    url: 'https://blog.nearbynearby.com/looking-ahead-through-2025-strengthening-rural-connections-and-opportunities/',
    image: 'https://blog.nearbynearby.com/wp-content/uploads/2025-For-Nearby-Nearby-600x339.jpg',
    excerpt: 'In 2025, Nearby Nearby is set to amplify its impact and capabilities, focusing on how we can better serve rural communities\u2014not just as a local discovery platform connecting residents, visitors, and businesses through our patent-pending One Search feature, but as the first platform purpose-built for rural America.',
  },
  {
    title: 'A Day of Service: Chatham County Volunteer Fair',
    url: 'https://blog.nearbynearby.com/a-day-of-service-chatham-county-volunteer-fair/',
    image: 'https://blog.nearbynearby.com/wp-content/uploads/IMG-1862-600x339.jpg',
    excerpt: 'On September 11th, the Chatham County Community Engagement Task Force hosted a Day of Service, connecting 22 local organizations with over 60 attendees eager to volunteer. The event showcased various ways to serve the community.',
  },
  {
    title: 'Nearby Nearby Joins the CED GRO Accelerator: Driving Innovation in Tech',
    url: 'https://blog.nearbynearby.com/nearby-nearby-joins-the-ced-gro-accelerator-driving-innovation-in-tech/',
    image: 'https://blog.nearbynearby.com/wp-content/uploads/nearby-nearby-featured-image-for-Sharing-the-Vision-of-Nearby-Nearby-1-600x338.webp',
    excerpt: 'We are thrilled to announce that Nearby Nearby has been selected as one of the eight high-potential startups in the Council for Entrepreneurial Development GRO Accelerator program, an exciting opportunity to drive innovation and accelerate our growth.',
  },
];

function Home() {
  return (
    <>
      <Hero>
        {/* Categories Intro — inside gradient */}
        <header id="home_layer_cats_intro">
          <div className="wrapper_default text_align_center">
            <h2 className="text_color_white">Not Sure Where to Go?</h2>
            <p className="page_excerpt text_color_white">Explore by categories or interest.</p>
          </div>
        </header>

        {/* Category Cards — inside gradient */}
        <div id="home_layer_cats_parent">
          <div className="wrapper_default cats_group_3wide">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Link key={cat.name} to={cat.path} className="cat_single_highlight_box box_style_1">
                  <div className="cat_single_intro_box">
                    <Icon className="cat_single_intro_icon" size={48} style={{ color: cat.color }} />
                    <h3 className="cat_single_title">{cat.name}</h3>
                  </div>
                  <div className="cat_single_listing_total_box">
                    <span className="cat_single_listing_text">Listings</span>
                    <ArrowRight className="cat_single_listing_icon" size={22} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Hero>

      {/* Highlight / Feature Preview */}
      <div id="highlight_layer_1">
        <div className="wrapper_default">
          <div className="preview_box_1">
            <div className="preview_text_box">
              <h2 className="preview_title">One Search. Everything Nearby.</h2>
              <p className="preview_desc">
                Nearby Nearby is the world's first local discovery platform, built for rural America.
                Find local businesses, parks, trails, and events in areas underserved by traditional
                discovery platforms.
              </p>
              <Link to="/explore" className="button btn_preview">Start Exploring</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Blog / Updates */}
      <div id="blog_layer_1">
        <div className="wrapper_default blog_intro_text">
          <h2>Updates</h2>
          <p>Nearby Nearby Announcements, Press Releases, Updates, and Guides &ndash; stay informed!</p>
        </div>
        <div className="wrapper_wide blog_feed_3wide">
          {BLOG_POSTS.map(post => (
            <div key={post.url} className="query_single_item_style3">
              <div className="query_image_style3">
                <a className="query_img_link_style3" href={post.url} target="_blank" rel="noopener noreferrer">
                  <img src={post.image} alt={post.title} loading="lazy" />
                </a>
              </div>
              <div className="query_content_style3">
                <h3 className="query_content_title_style3">
                  <a href={post.url} target="_blank" rel="noopener noreferrer">{post.title}</a>
                </h3>
                <p className="query_excerpt_text_style3">{post.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsors */}
      <div id="sponsor_layer_1">
        <div className="wrapper_default sponsor_layer_intro_text">
          <h2>Sponsors</h2>
          <p>Helping keeping the costs low for you.</p>
        </div>
        <div className="wrapper_default sponsor_grid_6wide">
          {Array.from({ length: 24 }, (_, i) => (
            <a key={i} href="#" className="sponsor_logo_link">
              <div className="sponsor_logo_placeholder">Sponsor</div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;
