"""Wave 3 #47 — strict ALL-THREE rule for compute_accessible_restroom.

The new accessible_restroom boolean is computed by
`nearby-admin/backend/app/crud/crud_poi.py::compute_accessible_restroom`. It
must be TRUE only when the admin has checked all three of:

  1. "Wide door — minimum 32 inches clear width"
  2. "Side grab bar installed" OR "Rear grab bar installed"
  3. "Level entry — no lip or step"

The label strings live in `shared/constants/field_options.RESTROOM_ADA_CHECKLIST`
and the backend does case-insensitive substring matching.

These tests are pure-Python unit tests on the computed-field helper — they do
not require the database fixtures. (Pytest collection on this branch can fail
at setup with a pre-existing bcrypt-72-byte issue in conftest; that's not a
regression introduced here.)
"""
from app.crud.crud_poi import compute_accessible_restroom

WIDE_DOOR = "Wide door — minimum 32 inches clear width"
SIDE_GRAB = "Side grab bar installed"
REAR_GRAB = "Rear grab bar installed"
LEVEL_ENTRY = "Level entry — no lip or step"


def test_empty_checklist_is_false():
    assert compute_accessible_restroom({"accessible_restroom_details": []})[
        "accessible_restroom"
    ] is False


def test_missing_field_is_false():
    assert compute_accessible_restroom({})["accessible_restroom"] is False


def test_none_field_is_false():
    assert compute_accessible_restroom({"accessible_restroom_details": None})[
        "accessible_restroom"
    ] is False


def test_single_checkbox_only_is_false():
    # One of three ingredients is never enough.
    for item in [WIDE_DOOR, SIDE_GRAB, REAR_GRAB, LEVEL_ENTRY]:
        result = compute_accessible_restroom({"accessible_restroom_details": [item]})
        assert result["accessible_restroom"] is False, f"{item!r} alone should be False"


def test_wide_door_plus_side_grab_plus_level_entry_is_true():
    result = compute_accessible_restroom(
        {"accessible_restroom_details": [WIDE_DOOR, SIDE_GRAB, LEVEL_ENTRY]}
    )
    assert result["accessible_restroom"] is True


def test_wide_door_plus_rear_grab_plus_level_entry_is_true():
    result = compute_accessible_restroom(
        {"accessible_restroom_details": [WIDE_DOOR, REAR_GRAB, LEVEL_ENTRY]}
    )
    assert result["accessible_restroom"] is True


def test_wide_door_plus_side_grab_no_level_entry_is_false():
    result = compute_accessible_restroom(
        {"accessible_restroom_details": [WIDE_DOOR, SIDE_GRAB]}
    )
    assert result["accessible_restroom"] is False


def test_all_checkboxes_except_level_entry_is_false():
    # Every label from the new 15-item grouped checklist EXCEPT "Level entry".
    everything_minus_level = [
        'Accessible stall size — minimum 60" x 56" (wall-mounted toilet) or 60" x 59" (floor-mounted)',
        "60 inch turning radius clear floor space",
        SIDE_GRAB,
        REAR_GRAB,
        "Grab bars mounted 33-36 inches from floor",
        WIDE_DOOR,
        "Outward swinging or sliding door",
        "Lever or loop door handle",
        "Accessible toilet height — 17-19 inches from floor",
        "Sink height 34 inches or lower",
        "Clear knee space under sink",
        "Lever or sensor faucet",
        "No exposed hot water or drain pipes under sink",
        "Accessible route to restroom",
    ]
    result = compute_accessible_restroom(
        {"accessible_restroom_details": everything_minus_level}
    )
    assert result["accessible_restroom"] is False


def test_legacy_dict_of_bools_shape_supported():
    # Legacy rows may store {label: bool}. The new logic must still parse them.
    result = compute_accessible_restroom(
        {
            "accessible_restroom_details": {
                WIDE_DOOR: True,
                REAR_GRAB: True,
                LEVEL_ENTRY: True,
                "Sink height 34 inches or lower": False,
            }
        }
    )
    assert result["accessible_restroom"] is True


def test_legacy_dict_missing_level_entry_is_false():
    result = compute_accessible_restroom(
        {
            "accessible_restroom_details": {
                WIDE_DOOR: True,
                SIDE_GRAB: True,
            }
        }
    )
    assert result["accessible_restroom"] is False
