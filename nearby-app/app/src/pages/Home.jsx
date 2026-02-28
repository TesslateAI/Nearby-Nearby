import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import { Store, Trees, Mountain, Calendar, MapPin, Compass } from 'lucide-react';
import './Home.css';

const CATEGORIES = [
  { name: 'Businesses', icon: Store, path: '/explore?type=BUSINESS', color: 'var(--nn-purple1)' },
  { name: 'Parks', icon: Trees, path: '/explore?type=PARK', color: 'var(--nn-green)' },
  { name: 'Trails', icon: Mountain, path: '/explore?type=TRAIL', color: 'var(--nn-teal1)' },
  { name: 'Events', icon: Calendar, path: '/explore?type=EVENT', color: 'var(--nn-blue)' },
  { name: 'Places', icon: MapPin, path: '/explore', color: 'var(--nn-purple2)' },
  { name: 'Explore All', icon: Compass, path: '/explore', color: 'var(--nn-gold)' },
];

function Home() {
  return (
    <>
      <Hero />

      {/* Categories Intro */}
      <header id="home_layer_cats_intro">
        <div className="wrapper_default text_align_center">
          <h2>Not Sure Where to Go?</h2>
          <p className="page_excerpt">Explore by categories or interest.</p>
        </div>
      </header>

      {/* Category Cards */}
      <div id="home_layer_cats_parent">
        <div className="wrapper_default cats_group_3wide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <Link key={cat.name} to={cat.path} className="cat_single_highlight_box box_style_1">
                <div className="cat_single_intro_box">
                  <Icon className="cat_single_intro_icon" size={48} style={{ color: cat.color }} />
                  <span className="cat_single_intro_title">{cat.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

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
    </>
  );
}

export default Home;
