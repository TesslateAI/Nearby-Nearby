# SEO System

## Overview

The SEO System handles search engine optimization and social media sharing for the nearby-app. It includes dynamic meta tags, Open Graph data, Twitter Cards, and structured data (JSON-LD) for rich search results.

**Key Files:**
- `nearby-app/backend/app/main.py` - Server-side meta tag injection for social sharing crawlers
- `nearby-app/app/src/components/SEO.jsx` - Client-side SEO component (React 19 native metadata)
- `nearby-app/app/src/components/seo/LocalBusinessJsonLd.jsx` - Business JSON-LD schema
- `nearby-app/app/src/components/seo/EventJsonLd.jsx` - Event JSON-LD schema
- `nearby-app/backend/app/api/endpoints/sitemap.py` - Event sitemap endpoint
- `nearby-app/app/src/utils/slugify.js` - URL utilities

---

## URL Structure

SEO-friendly URLs use slugs instead of UUIDs:

| POI Type | URL Pattern | Example |
|----------|-------------|---------|
| Business | `/places/{slug}` | `/places/joes-coffee-pittsboro` |
| Park | `/parks/{slug}` | `/parks/jordan-lake-state-park` |
| Trail | `/trails/{slug}` | `/trails/lakeshore-loop` |
| Event | `/events/{slug}` | `/events/pittsboro-food-festival` |

### Slug Generation

```javascript
// nearby-app/app/src/utils/slugify.js

export function generateSlug(name, city) {
  const text = `${name} ${city}`;
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^\w\s-]/g, '')          // Remove special chars
    .replace(/\s+/g, '-')              // Replace spaces with -
    .replace(/-+/g, '-')               // Collapse multiple -
    .trim();
}

export function getPOIUrl(poi) {
  const prefix = getTypePrefix(poi.poi_type);
  return `/${prefix}/${poi.slug}`;
}

export function getTypePrefix(poiType) {
  const prefixes = {
    'BUSINESS': 'places',
    'PARK': 'parks',
    'TRAIL': 'trails',
    'EVENT': 'events',
    'SERVICES': 'places'
  };
  return prefixes[poiType] || 'places';
}
```

### UUID to Slug Redirect

```jsx
// nearby-app/app/src/pages/POIDetail.jsx

function POIDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // If URL uses UUID, redirect to slug URL
    if (isUUID(id)) {
      fetch(`/api/pois/${id}`)
        .then(res => res.json())
        .then(poi => {
          const url = getPOIUrl(poi);
          navigate(url, { replace: true });
        });
    }
  }, [id]);

  // ... render POI details
}
```

---

## Meta Tags

### Backend Meta Tag Injection (Server-Side)

The backend injects dynamic Open Graph and Twitter Card meta tags into the HTML response when serving POI detail pages. This ensures social media crawlers (Facebook, Twitter, etc.) see the correct metadata even though the app is a client-side SPA.

```python
# nearby-app/backend/app/main.py

def generate_og_meta_tags(poi, base_url: str) -> str:
    """Generate Open Graph meta tags for a POI."""
    title = f"{poi.name} | NearbyNearby"
    description = (
        poi.teaser_paragraph or
        poi.description_short or
        (poi.description_long[:150] + '...' if poi.description_long and len(poi.description_long) > 150 else poi.description_long) or
        f"Discover {poi.name} in {poi.address_city or 'your area'}."
    )
    # Strip HTML tags from description
    description = re.sub(r'<[^>]+>', '', description or '')

    # Determine URL based on slug or fallback to UUID
    if poi.slug:
        type_prefixes = {
            'BUSINESS': 'places', 'SERVICES': 'places',
            'PARK': 'parks', 'TRAIL': 'trails', 'EVENT': 'events',
        }
        prefix = type_prefixes.get(poi.poi_type.value if hasattr(poi.poi_type, 'value') else poi.poi_type, 'places')
        url = f"{base_url}/{prefix}/{poi.slug}"
    else:
        url = f"{base_url}/poi/{poi.id}"

    image_url = poi.featured_image if poi.featured_image else f"{base_url}/Logo.png"

    return f'''
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{url}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:image" content="{image_url}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="NearbyNearby" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="{url}" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
    <meta name="twitter:image" content="{image_url}" />
    <meta name="twitter:site" content="@itsnearbynearby" />
    <meta name="description" content="{description}" />
    <title>{title}</title>
    '''
```

A separate `inject_meta_tags()` helper strips any existing OG/Twitter/description tags from the base HTML before injecting the new ones, preventing duplicates. The catch-all SPA route (`@app.get("/{full_path:path}")`) checks if the path matches a POI page pattern (`places/`, `parks/`, `trails/`, `events/`, `poi/`), looks up the POI by slug or UUID, and injects dynamic meta tags into `index.html` before returning the response.

### Frontend SEO Component (Client-Side)

The app includes a standalone `SEO.jsx` component at `nearby-app/app/src/components/SEO.jsx`. It uses **React 19's native document metadata support** (not react-helmet) to render `<title>`, `<meta>`, and `<link>` tags that React hoists into `<head>`:

```jsx
// nearby-app/app/src/components/SEO.jsx

function SEO({ title, description, image, url, type = 'website', siteName = 'NearbyNearby', twitterCard = 'summary_large_image' }) {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || 'Discover amazing places, events, trails, and businesses near you with NearbyNearby.';
  const metaImage = image || 'https://nearbynearby.com/Logo.png';
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // React 19 natively hoists these to <head>
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteName} />
      <meta name="twitter:card" content={twitterCard} />
      {/* ... additional twitter and robots tags */}
    </>
  );
}
```

This component is used by `GenericDetail.jsx` to provide client-side meta tags for POI detail pages. The server-side injection (above) and client-side component work together: server-side tags satisfy social media crawlers, while the client-side component updates the document head during SPA navigation.

### JSON-LD Structured Data Components

The app also uses JSON-LD structured data components (`EventJsonLd`, `LocalBusinessJsonLd`) that render `<script type="application/ld+json">` tags using native React `dangerouslySetInnerHTML` (not react-helmet). Each type-specific detail page includes the appropriate JSON-LD component.

- `BusinessDetail.jsx` renders `<LocalBusinessJsonLd />`
- `EventDetail.jsx` renders `<EventJsonLd />`

---

## Structured Data (JSON-LD)

### Local Business Schema

```jsx
// nearby-app/app/src/components/seo/LocalBusinessJsonLd.jsx

function LocalBusinessJsonLd({ poi }) {
  if (!poi) return null;

  const baseUrl = window.location.origin;
  const businessUrl = `${baseUrl}/business/${poi.id}`;

  // Dynamically determines schema.org @type based on main_category
  // e.g., Restaurant, CafeOrCoffeeShop, Store, BarOrPub, etc.
  const getBusinessType = () => { /* ... category-based lookup ... */ };

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": getBusinessType(),  // More specific than just "LocalBusiness"
    "@id": businessUrl,
    name: poi.name,
    url: businessUrl
  };

  // Conditionally adds: address, geo, telephone, email, sameAs (social links),
  // openingHoursSpecification (from poi.hours.regular with periods),
  // priceRange (derived from poi.business.price_level),
  // image (main_image_url + gallery), paymentAccepted, accessibilityFeature,
  // amenityFeature, hasMenu (for restaurants), acceptsReservations

  // Uses native React script tag, NOT react-helmet
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema, null, 2) }}
    />
  );
}
```

**Key differences from a minimal implementation:**
- `@type` is dynamically determined from `main_category` (e.g., `Restaurant`, `Store`, `BarOrPub`)
- Opening hours use `poi.hours.regular` with a `periods` array (not a simple open/close)
- Price range is derived from `poi.business.price_level` (numeric or string)
- Social profiles are aggregated into a `sameAs` array (website, Facebook, Instagram, Twitter)
- Payment methods are mapped to human-readable strings
- Amenities are rendered as `LocationFeatureSpecification` entries

### Event Schema

```jsx
// nearby-app/app/src/components/seo/EventJsonLd.jsx

function EventJsonLd({ poi }) {
  if (!poi || !poi.event) return null;

  // Full schema.org/Event implementation
  // Builds eventSchema with: name, url, eventStatus, eventAttendanceMode,
  // location, startDate, endDate, description, organizer, offers,
  // performer, image, doorTime, typicalAgeRange, accessibilityFeature,
  // maximumAttendeeCapacity

  // Uses native React script tag, NOT react-helmet
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema, null, 2) }}
    />
  );
}
```

**Event Status --> schema.org Mapping:**

| `event_status` value | schema.org `eventStatus` |
|---------------------|--------------------------|
| `Canceled` | `https://schema.org/EventCancelled` |
| `Postponed` | `https://schema.org/EventPostponed` |
| `Rescheduled` | `https://schema.org/EventRescheduled` |
| `Moved Online` | `https://schema.org/EventMovedOnline` |
| `Scheduled` | `https://schema.org/EventScheduled` |
| `Updated Date and/or Time` | `https://schema.org/EventScheduled` |
| `Unofficial Proposed Date` | `https://schema.org/EventScheduled` |

**Event Attendance Mode:**

| Condition | schema.org `eventAttendanceMode` |
|-----------|----------------------------------|
| `is_virtual` and `is_in_person` both true | `MixedEventAttendanceMode` |
| `is_virtual` only | `OnlineEventAttendanceMode` |
| Default (in-person) | `OfflineEventAttendanceMode` |
| Status is `Moved Online` with `online_event_url` | Overridden to `OnlineEventAttendanceMode` |

**VirtualLocation:**

When `event_status === 'Moved Online'` and `online_event_url` is present, the `location` field becomes an array containing both the physical `Place` and a `VirtualLocation`:

```json
{
  "location": [
    { "@type": "Place", "name": "...", "address": {...}, "geo": {...} },
    { "@type": "VirtualLocation", "url": "https://zoom.us/j/..." }
  ]
}
```

**Organizer:**

Built as a `schema.org/Organization` when `organizer_name` is present:

```json
{
  "organizer": {
    "@type": "Organization",
    "name": "Event Organizer Name",
    "url": "https://organizer-website.com",
    "email": "contact@organizer.com",
    "telephone": "555-0100"
  }
}
```

The `url`, `email`, and `telephone` fields are sourced from `organizer_website`, `organizer_email`, and `organizer_phone` respectively. URLs without a protocol are automatically prefixed with `https://`.

**Offers (Pricing):**

Structured from `cost_type` and `cost` fields:

| `cost_type` | Offers Output |
|-------------|---------------|
| `free` | `[{"@type": "Offer", "price": 0, "priceCurrency": "USD", "availability": "InStock"}]` |
| `single_price` or `range` | `[{"@type": "Offer", "price": <cost>, "priceCurrency": "USD", "availability": "InStock"}]` |
| Not set | `offers` field omitted |

**Additional Schema Fields:**

| Schema Field | Source | Description |
|-------------|--------|-------------|
| `startDate` | `event.start_datetime` | ISO 8601 datetime |
| `endDate` | `event.end_datetime` | ISO 8601 datetime |
| `description` | `description_short` or stripped `description_long` | Max 500 chars |
| `performer` | `event.performers` | Array of `PerformingGroup` objects |
| `image` | `main_image_url` + `images[]` | Array of image URLs |
| `doorTime` | `event.doors_open` | When doors open |
| `typicalAgeRange` | Derived from `ideal_for` | Age-related groups joined |
| `accessibilityFeature` | `wheelchair_accessible` | Accessibility features array |
| `maximumAttendeeCapacity` | `event.max_capacity` | Max attendees |

### Usage Based on POI Type

Each type-specific detail component imports and renders its own JSON-LD component. Additionally, `GenericDetail.jsx` (the wrapper for all detail pages) renders the `SEO` component for client-side meta tags:

```jsx
// GenericDetail.jsx - wraps all detail pages
import SEO from '../SEO';

function GenericDetail({ poi }) {
  return (
    <div>
      <SEO title={poi.name} description={seoDescription} image={seoImage} url={seoUrl} />
      {/* Renders type-specific detail component (BusinessDetail, EventDetail, etc.) */}
    </div>
  );
}

// EventDetail.jsx - adds Event JSON-LD
import { EventJsonLd } from '../seo/index';

function EventDetail({ poi }) {
  return (
    <div>
      <EventJsonLd poi={poi} />
      {/* ... event detail content ... */}
    </div>
  );
}

// BusinessDetail.jsx - adds LocalBusiness JSON-LD
import { LocalBusinessJsonLd } from '../seo/index';

function BusinessDetail({ poi }) {
  return (
    <div>
      <LocalBusinessJsonLd poi={poi} />
      {/* ... business detail content ... */}
    </div>
  );
}
```

---

## Social Sharing

### Share Button Component

```jsx
function ShareButton({ poi }) {
  const url = `https://nearbynearby.com${getPOIUrl(poi)}`;
  const title = poi.name;
  const text = poi.teaser_description;

  const handleShare = async () => {
    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      showNotification('Link copied to clipboard!');
    }
  };

  return (
    <button onClick={handleShare}>
      <IconShare /> Share
    </button>
  );
}
```

### Platform-Specific Share Links

```jsx
function ShareLinks({ poi }) {
  const url = encodeURIComponent(`https://nearbynearby.com${getPOIUrl(poi)}`);
  const title = encodeURIComponent(poi.name);
  const text = encodeURIComponent(poi.teaser_description || '');

  return (
    <div className="share-links">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on Facebook
      </a>

      <a
        href={`https://twitter.com/intent/tweet?url=${url}&text=${title}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on Twitter
      </a>

      <a
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Share on LinkedIn
      </a>

      <a
        href={`mailto:?subject=${title}&body=${text}%0A%0A${url}`}
      >
        Share via Email
      </a>
    </div>
  );
}
```

---

## Sitemap Generation

### Main Sitemap

```python
# Script to generate sitemap.xml

from datetime import datetime

def generate_sitemap(db: Session) -> str:
    """Generate XML sitemap for all published POIs."""

    pois = db.query(PointOfInterest).filter(
        PointOfInterest.publication_status == "published"
    ).all()

    urls = []

    # Static pages
    static_pages = ['/', '/explore', '/terms-of-service', '/privacy-policy']
    for page in static_pages:
        urls.append({
            'loc': f'https://nearbynearby.com{page}',
            'changefreq': 'weekly',
            'priority': '0.8'
        })

    # POI pages
    for poi in pois:
        url = getPOIUrl(poi)
        urls.append({
            'loc': f'https://nearbynearby.com{url}',
            'lastmod': poi.updated_at.strftime('%Y-%m-%d') if poi.updated_at else None,
            'changefreq': 'weekly',
            'priority': '0.6'
        })

    # Build XML
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    for url in urls:
        xml += '  <url>\n'
        xml += f'    <loc>{url["loc"]}</loc>\n'
        if url.get('lastmod'):
            xml += f'    <lastmod>{url["lastmod"]}</lastmod>\n'
        xml += f'    <changefreq>{url["changefreq"]}</changefreq>\n'
        xml += f'    <priority>{url["priority"]}</priority>\n'
        xml += '  </url>\n'

    xml += '</urlset>'

    return xml
```

### Event Sitemap

A dedicated event sitemap endpoint filters events by status and adjusts priority based on whether the event is upcoming or past:

```
GET /api/sitemap-events.xml
```

**Key file**: `nearby-app/backend/app/api/endpoints/sitemap.py`

**Behavior:**
- Only includes published EVENT POIs
- **Excludes** events with status `Canceled` or `Rescheduled` (they should not be indexed)
- Upcoming events (end date in the future) get **priority 0.8** and **daily** change frequency
- Past events get **priority 0.4** and **monthly** change frequency
- URLs follow the pattern `https://nearbynearby.com/events/{slug}`

---

## Robots.txt

```
# nearby-app/backend/static/robots.txt

User-agent: *
Allow: /

Sitemap: https://nearbynearby.com/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
```

---

## Best Practices

1. **Use canonical URLs** - Prevent duplicate content issues
2. **Generate slugs consistently** - Same name/city = same slug
3. **Truncate descriptions** - Keep meta descriptions under 155 chars
4. **Include images** - Social shares look better with images
5. **Update structured data** - Keep schema.org data current
6. **Test with validators** - Use Facebook Debugger, Twitter Card Validator
7. **Server-side rendering** - Inject meta tags on server for crawlers
