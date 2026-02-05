"""
HTML sanitization utility for server-side cleaning of rich text content.
This provides a second layer of protection after client-side sanitization.
"""

import bleach
from typing import Optional

# Allowed HTML tags for rich text content
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
]

# Allowed attributes for tags
ALLOWED_ATTRIBUTES = {
    'a': ['href', 'target', 'rel'],
    '*': ['class']  # Allow class for styling
}

def sanitize_html(html_content: Optional[str]) -> Optional[str]:
    """
    Sanitize HTML content to prevent XSS attacks and ensure only
    allowed tags and attributes are included.

    Args:
        html_content: Raw HTML string to sanitize

    Returns:
        Sanitized HTML string or None if input was None/empty
    """
    if not html_content or html_content.strip() == '':
        return None

    # Remove any HTML that contains only whitespace/empty paragraphs
    if html_content.strip() in ['<p></p>', '<p><br></p>', '<br>', '<p> </p>']:
        return None

    # Clean the HTML
    cleaned = bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,  # Remove disallowed tags completely
        strip_comments=True  # Remove HTML comments
    )

    # Ensure links open in new tab and have security attributes
    cleaned = cleaned.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ')

    return cleaned if cleaned.strip() else None

def sanitize_poi_fields(data: dict) -> dict:
    """
    Sanitize all rich text fields in a POI data dictionary.

    Args:
        data: Dictionary containing POI field data

    Returns:
        Dictionary with sanitized HTML fields
    """
    # List of fields that may contain HTML content
    html_fields = [
        'teaser_paragraph', 'description_long', 'description_short',
        'history_paragraph', 'parking_notes', 'offsite_emergency_contact',
        'emergency_protocols', 'wheelchair_details', 'smoking_details',
        'drone_policy', 'pet_policy', 'toilet_description', 'rental_info',
        'rental_pricing', 'playground_notes', 'night_sky_viewing',
        'birding_wildlife', 'hunting_fishing_info', 'membership_details',
        'camping_lodging', 'community_impact', 'pricing_details'
    ]

    # Sanitize main POI fields
    for field in html_fields:
        if field in data and data[field] is not None:
            data[field] = sanitize_html(data[field])

    # Sanitize nested event fields
    if 'event' in data and data['event']:
        event_html_fields = ['food_and_drink_info', 'vendor_application_info', 'vendor_requirements']
        for field in event_html_fields:
            if field in data['event'] and data['event'][field] is not None:
                data['event'][field] = sanitize_html(data['event'][field])

    # Sanitize nested trail fields
    if 'trail' in data and data['trail']:
        trail_html_fields = ['trail_markings', 'trailhead_access_details']
        for field in trail_html_fields:
            if field in data['trail'] and data['trail'][field] is not None:
                data['trail'][field] = sanitize_html(data['trail'][field])

    return data