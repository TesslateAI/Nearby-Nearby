"""Canonical enum definitions shared between nearby-admin and nearby-app.

Both backends must use these enums to stay in sync with the database.
"""

import enum


class POIType(enum.Enum):
    BUSINESS = "BUSINESS"
    SERVICES = "SERVICES"
    PARK = "PARK"
    TRAIL = "TRAIL"
    EVENT = "EVENT"
    YOUTH_ACTIVITIES = "YOUTH_ACTIVITIES"
    JOBS = "JOBS"
    VOLUNTEER_OPPORTUNITIES = "VOLUNTEER_OPPORTUNITIES"
    DISASTER_HUBS = "DISASTER_HUBS"


class ImageType(enum.Enum):
    main = "main"
    gallery = "gallery"
    entry = "entry"
    parking = "parking"
    restroom = "restroom"
    rental = "rental"
    playground = "playground"
    menu = "menu"
    trail_head = "trail_head"
    trail_exit = "trail_exit"
    map = "map"
    downloadable_map = "downloadable_map"
