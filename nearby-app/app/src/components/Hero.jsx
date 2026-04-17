import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import './Hero.css';

export default function Hero({ children }) {
  const searchBarRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (query) => {
    navigate(`/explore?q=${encodeURIComponent(query)}`);
  };

  const handleSearchButton = (e) => {
    e.preventDefault();
    const query = searchBarRef.current?.getQuery?.()?.trim();
    if (query) handleSearch(query);
  };

  return (
    <div className="page_wrapper_gradient_1">
      <header id="home_layer_search">
        <div className="wrapper_default text_align_center">
          <h1 className="page_title">What's Nearby</h1>
          <p className="page_excerpt pb40px">
            One Search shows local businesses, events, parks, trails and more. <span className="text_color_white">No Ads. No Clutter.</span>
          </p>
        </div>
      </header>

      <div className="search_box_page_container">
        <div id="search_box_page">
          <form id="search_form_page" role="search" aria-label="one search" onSubmit={handleSearchButton}>
            <div className="search_container">
              <div className="search_input_wrapper">
                <span className="search_icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
                    <g transform="matrix(0.0468773,0,0,0.0468773,0,0)">
                      <path d="M416,208C416,253.9 401.1,296.3 376,330.7L502.6,457.4C515.1,469.9 515.1,490.2 502.6,502.7C490.1,515.2 469.8,515.2 457.3,502.7L330.7,376C296.3,401.2 253.9,416 208,416C93.1,416 0,322.9 0,208C0,93.1 93.1,0 208,0C322.9,0 416,93.1 416,208ZM208,352C287.5,352 352,287.5 352,208C352,128.5 287.5,64 208,64C128.5,64 64,128.5 64,208C64,287.5 128.5,352 208,352Z" style={{fill:'rgb(86,37,86)',fillRule:'nonzero'}}/>
                    </g>
                  </svg>
                </span>
                <SearchBar
                  ref={searchBarRef}
                  placeholder="What's nearby? Search for locations or interests..."
                  onSearch={handleSearch}
                />
              </div>
              <button className="button btn_search btn_search_gold" type="submit">Search</button>
            </div>
          </form>
        </div>
        <p className="search_terms_text text_color_white">
          All verified and based on what's actually nearby. By clicking Search, you agree to our{' '}
          <Link to="/terms-of-service" className="text_color_white">Terms of Service</Link>.
        </p>
      </div>

      {children}
    </div>
  );
}
