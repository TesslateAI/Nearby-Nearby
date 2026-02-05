import './SimpleSection.css';

function SimpleSection() {
  return (
    <section className="nn-simple" aria-labelledby="nn-simple-title">
      <div className="nn-simple__inner">
        <h2 id="nn-simple-title" className="nn-simple__title">It’s This Simple</h2>
        {/* Step 1 */}
        <div className="nn-simple__block">
          <p className="nn-simple__step">
            <strong>Step 1: One Search</strong>
            <span className="nn-simple__dash"> – </span>
            Type a location, event, or interest to start your search.
          </p>
          <div className="nn-simple__imageWrap">
            <img
              src="/White Box Search.png"
              alt="Search box and nearby suggestions UI"
              className="nn-simple__image"
              loading="lazy"
            />
          </div>
        </div>

        {/* Step 2 */}
        <div className="nn-simple__block">
          <p className="nn-simple__step">
            <strong>Step 2: See the Listing</strong>
            <span className="nn-simple__dash"> – </span>
            You land on the details page for what you searched for.
          </p>
          <div className="nn-simple__imageWrap">
            <img
              src="/step2.png"
              alt="Listing details page example"
              className="nn-simple__image"
              loading="lazy"
            />
          </div>
        </div>

        {/* Step 3 */}
        <div className="nn-simple__block">
          <p className="nn-simple__step">
            <strong>Step 3: Explore What’s Nearby</strong>
            <span className="nn-simple__dash"> – </span>
            Right below the details, Nearby Nearby automatically shows other places and experiences close by.
          </p>
          <div className="nn-simple__imageWrap">
            <img
              src="/feature.png"
              alt="Explore nearby results example"
              className="nn-simple__image"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SimpleSection;
