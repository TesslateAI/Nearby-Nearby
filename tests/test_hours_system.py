"""
Tests for Tasks 173-176: Hours system backend completion.

- Hours data round-trip (save via admin, read back)
- Python hours resolution engine (port of JS getEffectiveHoursForDate)
- Effective-hours API endpoint on nearby-app
"""
import pytest
from datetime import date
from conftest import create_business, orm_create_business, orm_publish_poi


# ---------------------------------------------------------------------------
# Sample hours data fixtures
# ---------------------------------------------------------------------------
REGULAR_HOURS = {
    "regular": {
        "monday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "09:00"}, "close": {"type": "fixed", "time": "17:00"}}]
        },
        "tuesday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "09:00"}, "close": {"type": "fixed", "time": "17:00"}}]
        },
        "wednesday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "09:00"}, "close": {"type": "fixed", "time": "17:00"}}]
        },
        "thursday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "09:00"}, "close": {"type": "fixed", "time": "17:00"}}]
        },
        "friday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "09:00"}, "close": {"type": "fixed", "time": "17:00"}}]
        },
        "saturday": {"status": "closed"},
        "sunday": {"status": "closed"},
    }
}

HOLIDAY_HOURS = {
    "christmas": {"status": "closed", "name": "Christmas Day"},
    "thanksgiving": {
        "status": "modified",
        "name": "Thanksgiving",
        "periods": [{"open": {"type": "fixed", "time": "10:00"}, "close": {"type": "fixed", "time": "14:00"}}]
    },
}

SEASONAL_HOURS = {
    "summer": {
        "useDateRange": True,
        "startDate": "06-01",
        "endDate": "08-31",
        "monday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "08:00"}, "close": {"type": "fixed", "time": "20:00"}}]
        },
        "tuesday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "08:00"}, "close": {"type": "fixed", "time": "20:00"}}]
        },
        "wednesday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "08:00"}, "close": {"type": "fixed", "time": "20:00"}}]
        },
        "thursday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "08:00"}, "close": {"type": "fixed", "time": "20:00"}}]
        },
        "friday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "08:00"}, "close": {"type": "fixed", "time": "20:00"}}]
        },
        "saturday": {
            "status": "open",
            "periods": [{"open": {"type": "fixed", "time": "10:00"}, "close": {"type": "fixed", "time": "18:00"}}]
        },
        "sunday": {"status": "closed"},
    }
}

EXCEPTION_HOURS = [
    {
        "type": "one-time",
        "date": "2026-07-04",
        "status": "closed",
        "reason": "Independence Day"
    },
    {
        "type": "one-time",
        "date": "2026-03-15",
        "status": "modified",
        "reason": "Staff training",
        "periods": [{"open": {"type": "fixed", "time": "12:00"}, "close": {"type": "fixed", "time": "16:00"}}]
    },
]

RECURRING_EXCEPTION = {
    "type": "recurring",
    "pattern": {
        "ordinal": "third",
        "dayOfWeek": "wednesday",
        "months": [],  # all months
    },
    "status": "modified",
    "reason": "Monthly team meeting",
    "periods": [{"open": {"type": "fixed", "time": "13:00"}, "close": {"type": "fixed", "time": "17:00"}}]
}

RECURRING_EXCEPTION_SPECIFIC_MONTHS = {
    "type": "recurring",
    "pattern": {
        "ordinal": "first",
        "dayOfWeek": "monday",
        "months": ["1", "2", "3"],  # Jan, Feb, Mar only
    },
    "status": "closed",
    "reason": "Quarterly planning",
}


# ---------------------------------------------------------------------------
# Hours round-trip tests (admin API)
# ---------------------------------------------------------------------------
class TestHoursRoundTrip:
    def test_create_business_with_regular_hours(self, admin_client):
        """Create a business with regular hours; read back the same data."""
        biz = create_business(admin_client, name="Regular Hours Biz", hours=REGULAR_HOURS)
        poi_id = biz["id"]
        resp = admin_client.get(f"/api/pois/{poi_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["hours"]["regular"]["monday"]["status"] == "open"
        assert data["hours"]["regular"]["saturday"]["status"] == "closed"

    def test_create_with_holiday_hours(self, admin_client):
        """Create with holidays inside hours JSONB."""
        hours = {**REGULAR_HOURS, "holidays": HOLIDAY_HOURS}
        biz = create_business(admin_client, name="Holiday Biz", hours=hours)
        resp = admin_client.get(f"/api/pois/{biz['id']}")
        assert resp.status_code == 200
        assert resp.json()["hours"]["holidays"]["christmas"]["status"] == "closed"

    def test_create_with_seasonal_hours(self, admin_client):
        """Create with seasonal hours inside hours JSONB."""
        hours = {**REGULAR_HOURS, "seasonal": SEASONAL_HOURS}
        biz = create_business(admin_client, name="Seasonal Biz", hours=hours)
        resp = admin_client.get(f"/api/pois/{biz['id']}")
        assert resp.status_code == 200
        assert "summer" in resp.json()["hours"]["seasonal"]

    def test_create_with_exceptions(self, admin_client):
        """Create with exception hours."""
        hours = {**REGULAR_HOURS, "exceptions": EXCEPTION_HOURS}
        biz = create_business(admin_client, name="Exception Biz", hours=hours)
        resp = admin_client.get(f"/api/pois/{biz['id']}")
        assert resp.status_code == 200
        assert len(resp.json()["hours"]["exceptions"]) == 2

    def test_create_with_recurring_exceptions(self, admin_client):
        """Create with a recurring exception pattern."""
        hours = {**REGULAR_HOURS, "exceptions": [RECURRING_EXCEPTION]}
        biz = create_business(admin_client, name="Recurring Exc Biz", hours=hours)
        resp = admin_client.get(f"/api/pois/{biz['id']}")
        assert resp.status_code == 200
        exc = resp.json()["hours"]["exceptions"][0]
        assert exc["type"] == "recurring"
        assert exc["pattern"]["ordinal"] == "third"

    def test_update_hours(self, admin_client):
        """Update hours on an existing POI."""
        biz = create_business(admin_client, name="Update Hours Biz")
        resp = admin_client.put(f"/api/pois/{biz['id']}", json={"hours": REGULAR_HOURS})
        assert resp.status_code == 200
        assert resp.json()["hours"]["regular"]["monday"]["status"] == "open"

    def test_full_hours_structure(self, admin_client):
        """All sections populated: regular + holidays + seasonal + exceptions."""
        hours = {
            **REGULAR_HOURS,
            "holidays": HOLIDAY_HOURS,
            "seasonal": SEASONAL_HOURS,
            "exceptions": EXCEPTION_HOURS + [RECURRING_EXCEPTION],
        }
        biz = create_business(admin_client, name="Full Hours Biz", hours=hours)
        resp = admin_client.get(f"/api/pois/{biz['id']}")
        data = resp.json()["hours"]
        assert "regular" in data
        assert "holidays" in data
        assert "seasonal" in data
        assert len(data["exceptions"]) == 3


# ---------------------------------------------------------------------------
# Python hours resolution engine tests
# ---------------------------------------------------------------------------
class TestHoursResolution:
    def test_regular_hours_monday(self):
        """Regular Monday hours returned for a Monday date."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        # 2026-03-02 is a Monday
        result = get_effective_hours_for_date(REGULAR_HOURS, date(2026, 3, 2))
        assert result["source"] == "regular"
        assert result["hours"]["status"] == "open"
        assert result["hours"]["periods"][0]["open"]["time"] == "09:00"

    def test_exception_overrides_regular(self):
        """One-off exception for a date overrides regular hours."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        hours = {**REGULAR_HOURS, "exceptions": EXCEPTION_HOURS}
        # 2026-03-15 is a Sunday (but has exception)
        result = get_effective_hours_for_date(hours, date(2026, 3, 15))
        assert result["source"] == "exception"
        assert result["label"] == "Staff training"

    def test_holiday_overrides_regular(self):
        """Holiday hours for Christmas override regular."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        hours = {**REGULAR_HOURS, "holidays": HOLIDAY_HOURS}
        # 2026-12-25 is Christmas (Friday)
        result = get_effective_hours_for_date(hours, date(2026, 12, 25))
        assert result["source"] == "holiday"
        assert result["hours"]["status"] == "closed"

    def test_seasonal_overrides_regular(self):
        """Summer seasonal hours override regular on a summer date."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        hours = {**REGULAR_HOURS, "seasonal": SEASONAL_HOURS}
        # 2026-07-06 is a Monday in summer
        result = get_effective_hours_for_date(hours, date(2026, 7, 6))
        assert result["source"] == "seasonal"
        assert result["hours"]["periods"][0]["open"]["time"] == "08:00"

    def test_exception_overrides_holiday(self):
        """Exception on Christmas Day overrides holiday hours."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        xmas_exception = {
            "type": "one-time",
            "date": "2026-12-25",
            "status": "modified",
            "reason": "Special Christmas event",
            "periods": [{"open": {"type": "fixed", "time": "11:00"}, "close": {"type": "fixed", "time": "15:00"}}]
        }
        hours = {**REGULAR_HOURS, "holidays": HOLIDAY_HOURS, "exceptions": [xmas_exception]}
        result = get_effective_hours_for_date(hours, date(2026, 12, 25))
        assert result["source"] == "exception"
        assert result["label"] == "Special Christmas event"

    def test_exception_overrides_seasonal(self):
        """Exception overrides seasonal hours."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        hours = {**REGULAR_HOURS, "seasonal": SEASONAL_HOURS, "exceptions": EXCEPTION_HOURS}
        # 2026-07-04 is in summer AND has a closed exception
        result = get_effective_hours_for_date(hours, date(2026, 7, 4))
        assert result["source"] == "exception"
        assert result["hours"]["status"] == "closed"

    def test_recurring_exception(self):
        """3rd Wednesday pattern matches correctly."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        hours = {**REGULAR_HOURS, "exceptions": [RECURRING_EXCEPTION]}
        # 2026-03-18 is the 3rd Wednesday of March
        result = get_effective_hours_for_date(hours, date(2026, 3, 18))
        assert result["source"] == "exception"
        assert result["label"] == "Monthly team meeting"

    def test_recurring_exception_specific_months(self):
        """Recurring exception only in Jan/Feb/Mar."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        hours = {**REGULAR_HOURS, "exceptions": [RECURRING_EXCEPTION_SPECIFIC_MONTHS]}
        # 2026-02-02 is 1st Monday of February — should match
        result = get_effective_hours_for_date(hours, date(2026, 2, 2))
        assert result["source"] == "exception"
        assert result["hours"]["status"] == "closed"

        # 2026-04-06 is 1st Monday of April — should NOT match
        result2 = get_effective_hours_for_date(hours, date(2026, 4, 6))
        assert result2["source"] == "regular"

    def test_closed_exception(self):
        """Exception with status 'closed' returns closed."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        hours = {**REGULAR_HOURS, "exceptions": EXCEPTION_HOURS}
        # 2026-07-04 is the closed exception
        result = get_effective_hours_for_date(hours, date(2026, 7, 4))
        assert result["hours"]["status"] == "closed"
        assert result["label"] == "Independence Day"

    def test_no_hours_data(self):
        """None/empty hours returns None gracefully."""
        from shared.utils.hours_resolution import get_effective_hours_for_date
        result = get_effective_hours_for_date(None, date(2026, 3, 15))
        assert result["source"] == "none"
        assert result["hours"] is None


# ---------------------------------------------------------------------------
# Effective-hours endpoint tests (nearby-app API)
# ---------------------------------------------------------------------------
class TestEffectiveHoursEndpoint:
    def test_effective_hours_endpoint(self, db_session, app_client):
        """GET /api/pois/{id}/effective-hours?date=2026-03-02 returns 200."""
        hours = {**REGULAR_HOURS, "holidays": HOLIDAY_HOURS}
        poi = orm_create_business(db_session, name="Effective Hours Biz", published=True, hours=hours)
        db_session.commit()

        resp = app_client.get(f"/api/pois/{poi.id}/effective-hours?date=2026-03-02")
        assert resp.status_code == 200, f"Expected 200: {resp.text}"
        data = resp.json()
        assert data["source"] == "regular"
        assert data["hours"]["status"] == "open"

    def test_effective_hours_with_exception(self, db_session, app_client):
        """Returns exception hours for exception date."""
        hours = {**REGULAR_HOURS, "exceptions": EXCEPTION_HOURS}
        poi = orm_create_business(db_session, name="Exception Hours Biz", published=True, hours=hours)
        db_session.commit()

        resp = app_client.get(f"/api/pois/{poi.id}/effective-hours?date=2026-07-04")
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] == "exception"
        assert data["hours"]["status"] == "closed"

    def test_effective_hours_no_date_uses_today(self, db_session, app_client):
        """Omit date param — uses today."""
        poi = orm_create_business(db_session, name="Today Hours Biz", published=True, hours=REGULAR_HOURS)
        db_session.commit()

        resp = app_client.get(f"/api/pois/{poi.id}/effective-hours")
        assert resp.status_code == 200
        data = resp.json()
        assert data["source"] in ("regular", "none")
