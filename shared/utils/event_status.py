"""Event status transition validation.

Defines valid status transitions and provides validation utility.
"Scheduled" is always a valid target from any status (return to normal).
"""

from typing import Tuple

# Valid transitions: current_status -> [allowed next statuses]
# "Scheduled" is implicitly allowed from ALL statuses (added in validate function)
EVENT_STATUS_TRANSITIONS = {
    "Scheduled": [
        "Canceled", "Postponed", "Updated Date and/or Time",
        "Rescheduled", "Moved Online", "Unofficial Proposed Date",
    ],
    "Canceled": [],  # Can only return to Scheduled
    "Postponed": [
        "Canceled", "Rescheduled", "Updated Date and/or Time",
    ],
    "Updated Date and/or Time": [
        "Canceled", "Postponed", "Rescheduled", "Moved Online",
    ],
    "Rescheduled": [],  # Can only return to Scheduled
    "Moved Online": [
        "Canceled", "Postponed", "Rescheduled",
    ],
    "Unofficial Proposed Date": [
        "Canceled", "Postponed",
    ],
}


def validate_status_transition(current: str, new: str) -> Tuple[bool, str]:
    """Check if a status transition is allowed.

    Args:
        current: Current event status.
        new: Proposed new status.

    Returns:
        (is_valid, error_message) tuple. error_message is empty if valid.
    """
    if current == new:
        return True, ""

    # "Return to Scheduled" is always allowed
    if new == "Scheduled":
        return True, ""

    allowed = EVENT_STATUS_TRANSITIONS.get(current, [])
    if new in allowed:
        return True, ""

    return False, f"Invalid status transition: '{current}' -> '{new}'. Allowed from '{current}': {['Scheduled'] + allowed}"
