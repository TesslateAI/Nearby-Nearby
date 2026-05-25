# Constants for POI system
#
# Issue #43: The legacy IDEAL_FOR_OPTIONS flat list was removed from this file.
# Ideal For data is now sourced from shared.constants.field_options (5 groups:
# Atmosphere, Age Group, Social Settings, Local + Special, Special Needs).

# Event Status Options
EVENT_STATUS_OPTIONS = [
    "Scheduled",
    "Canceled",
    "Postponed",
    "Updated Date and/or Time",
    "Rescheduled",
    "Moved Online",
    "Unofficial Proposed Date"
]

# Business/Park/Trail Status Options
GENERAL_STATUS_OPTIONS = [
    "Fully Open",
    "Partly Open",
    "Temporary Hour Changes",
    "Temporarily Closed",
    "Call Ahead",
    "Permanently Closed",
    "Warning",
    "Limited Capacity",
    "Coming Soon",
    "Under Development",
    "Alert"
]

# Listing Types
LISTING_TYPE_OPTIONS = [
    "free",
    "paid",
    "sponsor_platform",
    "sponsor_state",
    "sponsor_county",
    "sponsor_town",
    "community_comped"
]