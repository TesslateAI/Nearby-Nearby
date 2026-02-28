# SEO System

## Overview

The SEO System handles search engine optimization and social media sharing for the nearby-app. It includes dynamic meta tags, Open Graph data, Twitter Cards, and structured data (JSON-LD) for rich search results.

**Key Files:**
- `nearby-app/backend/app/main.py` - Meta tag injection
- `nearby-app/app/src/components/seo/SEO.jsx` - React SEO component
- `nearby-app/app/src/components/seo/LocalBusinessJsonLd.jsx` - Business schema
- `nearby-app/app/src/components/seo/EventJsonLd.jsx` - Event schema
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

### Backend Meta Tag Injection

The backend injects dynamic meta tags for social sharing:

```python
# nearby-app/backend/app/main.py

from fastapi import Request
from fastapi.responses import HTMLResponse

def generate_og_meta_tags(poi) -> str:
    """Generate Open Graph meta tags for a POI."""
    title = poi.name
    description = truncate(poi.teaser_description or f"Discover {poi.name}", 155)
    image = poi.images[0].s3_url if poi.images else "/default-og-image.jpg"
    url = f"https://nearbynearby.com{getPOIUrl(poi)}"

    return f'''
    <meta property="og:title" content="{escape(title)}" />
    <meta property="og:description" content="{escape(description)}" />
    <meta property="og:image" content="{image}" />
    <meta property="og:url" content="{url}" />
    <meta property="og:type" content="place" />
    <meta property="og:site_name" content="Nearby Nearby" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{escape(title)}" />
    <meta name="twitter:description" content="{escape(description)}" />
    <meta name="twitter:image" content="{image}" />

    <meta name="description" content="{escape(description)}" />
    '''

@app.get("/{path:path}")
async def serve_spa(request: Request, path: str):
    """Serve SPA with dynamic meta tags for POI pages."""

    # Check if this is a POI route
    poi = None
    if path.startswith(('places/', 'parks/', 'trails/', 'events/')):
        slug = path.split('/')[-1]
        poi = get_poi_by_slug(db, slug)

    # Read base HTML
    with open("static/index.html") as f:
        html = f.read()

    # Inject meta tags if POI found
    if poi:
        meta_tags = generate_og_meta_tags(poi)
        html = html.replace('<head>', f'<head>{meta_tags}')

    return HTMLResponse(html)
```

### Frontend SEO Components

The app uses JSON-LD structured data components (`EventJsonLd`, `LocalBusinessJsonLd`) that render `<script type="application/ld+json">` tags using native React rendering (not react-helmet-async). Each type-specific detail page includes the appropriate JSON-LD component.

**Note:** There is no standalone `SEO.jsx` component. Meta tags are injected server-side by the backend (see above). Client-side structured data is handled by the JSON-LD components in `nearby-app/app/src/components/seo/`.

All 4 detail pages (BusinessDetail, EventDetail, ParkDetail, TrailDetail) render their respective JSON-LD components.

---

## Structured Data (JSON-LD)

### Local Business Schema

```jsx
// nearby-app/app/src/components/seo/LocalBusinessJsonLd.jsx

function LocalBusinessJsonLd({ poi }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": poi.name,
    "description": poi.teaser_description,
    "url": `https://nearbynearby.com${getPOIUrl(poi)}`,
    "telephone": poi.phone,
    "email": poi.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": poi.address_street,
      "addressLocality": poi.address_city,
      "addressRegion": poi.address_state,
      "postalCode": poi.address_zip
    },
    "geo": poi.location ? {
      "@type": "GeoCoordinates",
      "latitude": poi.location.coordinates[1],
      "longitude": poi.location.coordinates[0]
    } : undefined,
    "image": poi.images?.[0]?.s3_url,
    "priceRange": poi.business?.price_range,
    "openingHoursSpecification": formatOpeningHours(poi.hours)
  };

  // Remove undefined values
  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(cleanSchema)}
      </script>
    </Helmet>
  );
}

function formatOpeningHours(hours) {
  if (!hours) return undefined;

  const dayMap = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return Object.entries(hours)
    .filter(([_, value]) => value?.open && value?.close)
    .map(([day, value]) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": dayMap[day],
      "opens": value.open,
      "closes": value.close
    }));
}
```

### Event Schema

```jsx
// nearby-app/app/src/components/seo/EventJsonLd.jsx

function EventJsonLd({ poi }) {
  // Full schema.org/Event implementation with:
  // - eventStatus mapping from event_status field to schema.org URLs
  // - eventAttendanceMode (Offline/Online/Mixed)
  // - location with address and geo coordinates
  // - organizer with name, email, phone, website
  // - offers/pricing based on cost fields
  // - images, performers, door time, age range, accessibility

  // Renders using native React <script> tag, not react-helmet-async
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
    />
  );
}
```

**Event Status → schema.org Mapping:**

| `event_status` value | schema.org `eventStatus` |
|---------------------|--------------------------|
| Cancelled / Canceled | `EventCancelled` |
| Postponed | `EventPostponed` |
| Rescheduled | `EventRescheduled` |
| Moved Online / Virtual | `EventMovedOnline` |
| All others (Scheduled, Sold Out, On Sale, etc.) | `EventScheduled` |

### Usage Based on POI Type

Each type-specific detail component imports and renders its own JSON-LD component:

```jsx
// EventDetail.jsx
import { EventJsonLd } from '../seo/index';

function EventDetail({ poi }) {
  return (
    <div>
      <EventJsonLd poi={poi} />
      {/* ... event detail content ... */}
    </div>
  );
}

// BusinessDetail.jsx
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
