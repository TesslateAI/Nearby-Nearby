"""
Python port of nearby-app/app/src/utils/hoursUtils.js
Hours resolution engine with override precedence:
  1. Exception hours  (highest priority) — one-time or recurring
  2. Holiday hours    — named US holidays, computed by formula
  3. Seasonal hours   — spring/summer/fall/winter with optional custom date ranges
  4. Regular hours    — fallback (Mon–Sun per-day schedule)
"""
from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple


# ── Day helpers ──────────────────────────────────────────────────────────────

DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

DAY_NAME_TO_NUM = {
    "sunday": 0, "monday": 1, "tuesday": 2, "wednesday": 3,
    "thursday": 4, "friday": 5, "saturday": 6,
}

ORDINAL_MAP = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "last": "last",
}


# ── Holiday calculators ─────────────────────────────────────────────────────

def _nth_weekday_of_month(year: int, month: int, weekday: int, n: int) -> date:
    """Get the nth occurrence of a weekday (0=Sun..6=Sat) in month (1-12)."""
    # First day of month
    first = date(year, month, 1)
    first_wd = first.isoweekday() % 7  # convert to 0=Sun
    offset = (weekday - first_wd) % 7
    day = 1 + offset + (n - 1) * 7
    return date(year, month, day)


def _last_weekday_of_month(year: int, month: int, weekday: int) -> date:
    """Get the last occurrence of a weekday in month."""
    if month == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)
    last_wd = last_day.isoweekday() % 7
    offset = (last_wd - weekday) % 7
    return last_day - timedelta(days=offset)


def _calculate_easter(year: int) -> date:
    """Anonymous Gregorian algorithm for Easter Sunday."""
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return date(year, month, day)


# JS months are 0-indexed; Python months are 1-indexed.
HOLIDAY_CALCULATORS = {
    "new_year":         lambda y: date(y, 1, 1),
    "mlk_day":          lambda y: _nth_weekday_of_month(y, 1, 1, 3),   # 3rd Mon Jan
    "presidents_day":   lambda y: _nth_weekday_of_month(y, 2, 1, 3),   # 3rd Mon Feb
    "memorial_day":     lambda y: _last_weekday_of_month(y, 5, 1),     # last Mon May
    "juneteenth":       lambda y: date(y, 6, 19),
    "independence_day": lambda y: date(y, 7, 4),
    "labor_day":        lambda y: _nth_weekday_of_month(y, 9, 1, 1),   # 1st Mon Sep
    "columbus_day":     lambda y: _nth_weekday_of_month(y, 10, 1, 2),  # 2nd Mon Oct
    "veterans_day":     lambda y: date(y, 11, 11),
    "thanksgiving":     lambda y: _nth_weekday_of_month(y, 11, 4, 4),  # 4th Thu Nov
    "black_friday":     lambda y: _nth_weekday_of_month(y, 11, 4, 4) + timedelta(days=1),
    "christmas_eve":    lambda y: date(y, 12, 24),
    "christmas":        lambda y: date(y, 12, 25),
    "new_year_eve":     lambda y: date(y, 12, 31),
    "easter":           _calculate_easter,
    "good_friday":      lambda y: _calculate_easter(y) - timedelta(days=2),
    "mothers_day":      lambda y: _nth_weekday_of_month(y, 5, 0, 2),   # 2nd Sun May
    "fathers_day":      lambda y: _nth_weekday_of_month(y, 6, 0, 3),   # 3rd Sun Jun
    "halloween":        lambda y: date(y, 10, 31),
    "valentines_day":   lambda y: date(y, 2, 14),
}


# ── Internal resolution helpers ─────────────────────────────────────────────

def _matches_recurring_exception(d: date, exception: dict) -> bool:
    """Check if *d* matches a recurring monthly exception pattern."""
    if not exception or exception.get("type") != "recurring":
        return False
    pattern = exception.get("pattern")
    if not pattern:
        return False

    day_of_week = d.isoweekday() % 7  # 0=Sun
    month = d.month  # 1-12

    # Check month filter
    months = pattern.get("months", [])
    if months:
        if str(month) not in months:
            return False

    # Check day of week
    target_day_name = pattern.get("dayOfWeek", "")
    target_day = DAY_NAME_TO_NUM.get(target_day_name.lower())
    if target_day is None or day_of_week != target_day:
        return False

    ordinal_str = pattern.get("ordinal", "")
    ordinal_val = ORDINAL_MAP.get(ordinal_str)
    if ordinal_val is None:
        return False

    if ordinal_val == "last":
        next_week = d + timedelta(days=7)
        return next_week.month != d.month

    week_of_month = math.ceil(d.day / 7)
    return week_of_month == ordinal_val


def _get_exception_for_date(d: date, exceptions: Optional[list]) -> Optional[dict]:
    """Return the first matching exception for *d*, or None."""
    if not exceptions:
        return None

    date_str = d.isoformat()

    for exc in exceptions:
        exc_type = exc.get("type", "one-time")
        if exc_type == "one-time" or not exc_type:
            if exc.get("date") == date_str:
                return {**exc, "type": "one-time"}
        elif exc_type == "recurring":
            if _matches_recurring_exception(d, exc):
                return exc

    return None


def _get_holiday_for_date(d: date, holidays: Optional[dict]) -> Optional[dict]:
    """Return the matching holiday entry for *d*, or None."""
    if not holidays:
        return None

    year = d.year

    for holiday_id, holiday_data in holidays.items():
        normalized = holiday_id.lower().replace(" ", "_")
        calc = HOLIDAY_CALCULATORS.get(normalized) or HOLIDAY_CALCULATORS.get(holiday_id)

        if calc:
            holiday_date = calc(year)
            if holiday_date == d:
                return {"id": holiday_id, **(holiday_data if isinstance(holiday_data, dict) else {})}

        # Check fixed date format (MM-DD)
        if isinstance(holiday_data, dict):
            fixed_date = holiday_data.get("date", "")
            if fixed_date and len(fixed_date) == 5 and fixed_date[2] == "-":
                try:
                    m, dy = fixed_date.split("-")
                    hd = date(year, int(m), int(dy))
                    if hd == d:
                        return {"id": holiday_id, **holiday_data}
                except (ValueError, IndexError):
                    pass

    return None


def _get_active_season(d: date, seasonal: Optional[dict]) -> Optional[str]:
    """Return the name of the active season, or None."""
    if not seasonal:
        return None

    month = d.month
    day_of_month = d.day

    # First pass: custom date ranges (useDateRange flag)
    for season_name, season_data in seasonal.items():
        if not isinstance(season_data, dict):
            continue
        if season_data.get("useDateRange") and season_data.get("startDate") and season_data.get("endDate"):
            parts_start = season_data["startDate"].split("-")
            parts_end = season_data["endDate"].split("-")
            if len(parts_start) != 2 or len(parts_end) != 2:
                continue
            try:
                start_month, start_day = int(parts_start[0]), int(parts_start[1])
                end_month, end_day = int(parts_end[0]), int(parts_end[1])
            except ValueError:
                continue

            # Compare as (month, day) tuples
            current = (month, day_of_month)
            start = (start_month, start_day)
            end = (end_month, end_day)

            if end < start:
                # Range wraps around year boundary (e.g. Nov-Feb)
                if current >= start or current <= end:
                    return season_name
            else:
                if start <= current <= end:
                    return season_name

    # Second pass: month-based fallback
    SEASON_MONTHS = {
        "spring": [3, 4, 5],
        "summer": [6, 7, 8],
        "fall": [9, 10, 11],
        "winter": [12, 1, 2],
    }
    for season_name, months in SEASON_MONTHS.items():
        sd = seasonal.get(season_name)
        if sd and isinstance(sd, dict) and not sd.get("useDateRange") and month in months:
            return season_name

    return None


# ── Public API ───────────────────────────────────────────────────────────────

def get_effective_hours_for_date(
    hours_data: Optional[dict],
    d: date,
) -> Dict[str, Any]:
    """
    Resolve the effective hours for a specific date.

    Returns ``{"hours": ..., "source": "exception"|"holiday"|"seasonal"|"regular"|"none", "label": ...}``.
    """
    if not hours_data:
        return {"hours": None, "source": "none", "label": None}

    day_name = DAY_NAMES[d.isoweekday() % 7]

    # 1. Exceptions (highest priority)
    exception = _get_exception_for_date(d, hours_data.get("exceptions"))
    if exception:
        label = exception.get("reason") or (
            "Modified Schedule" if exception.get("type") == "recurring" else "Special Hours"
        )
        status = exception.get("status")
        if status == "closed":
            return {"hours": {"status": "closed"}, "source": "exception", "label": label}
        if status == "modified" and exception.get("periods"):
            return {
                "hours": {"status": "open", "periods": exception["periods"]},
                "source": "exception",
                "label": label,
            }
        if status == "open":
            regular_hours = (hours_data.get("regular") or {}).get(day_name)
            return {"hours": regular_hours, "source": "exception", "label": label}

    # 2. Holiday hours
    holiday = _get_holiday_for_date(d, hours_data.get("holidays"))
    if holiday:
        h_status = holiday.get("status")
        if h_status == "closed":
            return {"hours": {"status": "closed"}, "source": "holiday", "label": holiday.get("name")}
        if h_status == "modified" and holiday.get("periods"):
            return {
                "hours": {"status": "open", "periods": holiday["periods"]},
                "source": "holiday",
                "label": holiday.get("name"),
            }
        # status == "open" falls through to regular

    # 3. Seasonal hours
    active_season = _get_active_season(d, hours_data.get("seasonal"))
    if active_season and hours_data.get("seasonal", {}).get(active_season):
        season_day_hours = hours_data["seasonal"][active_season].get(day_name)
        if season_day_hours:
            season_labels = {
                "spring": "Spring Hours",
                "summer": "Summer Hours",
                "fall": "Fall Hours",
                "winter": "Winter Hours",
            }
            return {
                "hours": season_day_hours,
                "source": "seasonal",
                "label": season_labels.get(active_season, f"{active_season.title()} Hours"),
            }

    # 4. Regular hours (fallback)
    regular_hours = (hours_data.get("regular") or {}).get(day_name)
    return {"hours": regular_hours, "source": "regular", "label": None}
