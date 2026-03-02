"""Recurring event date expansion utility.

Expands a repeat_pattern JSONB into concrete datetime instances within a given range,
respecting excluded_dates, manual_dates, and recurrence_end_date.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU
from dateutil.parser import isoparse

_FREQ_MAP = {
    "daily": DAILY,
    "weekly": WEEKLY,
    "monthly": MONTHLY,
    "yearly": YEARLY,
}

_DAY_MAP = {
    "MO": MO, "TU": TU, "WE": WE, "TH": TH, "FR": FR, "SA": SA, "SU": SU,
}

# Maximum expansion horizon: 60 months from start
_MAX_MONTHS = 60


def expand_recurring_dates(
    start_datetime: datetime,
    repeat_pattern: Optional[dict],
    date_from: datetime,
    date_to: datetime,
    excluded_dates: Optional[List[str]] = None,
    manual_dates: Optional[List[str]] = None,
    recurrence_end_date: Optional[datetime] = None,
) -> List[datetime]:
    """Expand a repeating event into concrete datetimes within [date_from, date_to].

    Args:
        start_datetime: The first occurrence of the event.
        repeat_pattern: JSONB dict with keys: frequency, interval, days (optional).
        date_from: Start of the query window (inclusive).
        date_to: End of the query window (inclusive).
        excluded_dates: List of ISO date strings to skip (e.g. ["2026-07-04"]).
        manual_dates: List of ISO datetime strings to force-include.
        recurrence_end_date: Hard stop for recurrence (no occurrences after this).

    Returns:
        Sorted list of datetimes within the requested range.
    """
    if not repeat_pattern or not repeat_pattern.get("frequency"):
        # Non-repeating: just return start_datetime if it's in range
        if date_from <= start_datetime <= date_to:
            return [start_datetime]
        return []

    freq_str = repeat_pattern["frequency"].lower()
    freq = _FREQ_MAP.get(freq_str)
    if freq is None:
        return [start_datetime] if date_from <= start_datetime <= date_to else []

    interval = repeat_pattern.get("interval", 1)

    # Compute effective end: min of date_to, recurrence_end_date, and 60-month cap
    max_end = start_datetime + timedelta(days=_MAX_MONTHS * 30)
    effective_end = date_to
    if recurrence_end_date and recurrence_end_date < effective_end:
        effective_end = recurrence_end_date
    if max_end < effective_end:
        effective_end = max_end

    # Build rrule kwargs
    kwargs = {
        "freq": freq,
        "dtstart": start_datetime,
        "interval": interval,
        "until": effective_end,
    }

    # Weekly with specific days
    days = repeat_pattern.get("days")
    if days and freq == WEEKLY:
        byweekday = [_DAY_MAP[d] for d in days if d in _DAY_MAP]
        if byweekday:
            kwargs["byweekday"] = byweekday

    # Generate occurrences
    rule = rrule(**kwargs)
    occurrences = set()
    for dt in rule:
        if dt > effective_end:
            break
        if date_from <= dt <= date_to:
            occurrences.add(dt)

    # Remove excluded dates
    if excluded_dates:
        excluded_set = set()
        for d_str in excluded_dates:
            try:
                excluded_set.add(datetime.strptime(d_str, "%Y-%m-%d").date())
            except ValueError:
                pass
        occurrences = {dt for dt in occurrences if dt.date() not in excluded_set}

    # Add manual dates
    if manual_dates:
        for m_str in manual_dates:
            try:
                manual_dt = isoparse(m_str)
                if manual_dt.tzinfo is None:
                    manual_dt = manual_dt.replace(tzinfo=timezone.utc)
                if date_from <= manual_dt <= date_to:
                    occurrences.add(manual_dt)
            except (ValueError, TypeError):
                pass

    return sorted(occurrences)
