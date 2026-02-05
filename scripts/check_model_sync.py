#!/usr/bin/env python3
"""Drift detection script: compares SQLAlchemy model columns between nearby-admin and nearby-app.

Usage:
    python scripts/check_model_sync.py

Compares column names and types for shared tables and reports mismatches.
Exit code 0 = in sync, exit code 1 = drift detected.
"""

import importlib
import sys
import os

# ---------------------------------------------------------------------------
# Path setup — works when run from the monorepo root
# ---------------------------------------------------------------------------
MONOREPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ADMIN_BACKEND = os.path.join(MONOREPO_ROOT, "nearby-admin", "backend")
APP_BACKEND = os.path.join(MONOREPO_ROOT, "nearby-app", "backend")
SHARED_DIR = os.path.join(MONOREPO_ROOT)  # so `shared.models.enums` resolves


def _col_type_label(col):
    """Return a short human-readable type string for a SQLAlchemy column."""
    try:
        return str(col.type)
    except Exception:
        return repr(col.type)


def get_columns(model_cls):
    """Return {column_name: type_string} for every column on a model."""
    table = model_cls.__table__
    return {c.name: _col_type_label(c) for c in table.columns}


def compare_models(admin_model, app_model, table_name):
    """Compare two model classes and return a list of issue strings."""
    issues = []
    admin_cols = get_columns(admin_model)
    app_cols = get_columns(app_model)

    # Columns in admin but missing from app
    for col in sorted(admin_cols.keys() - app_cols.keys()):
        issues.append(f"  MISSING in app: {col} ({admin_cols[col]})")

    # Columns in app but missing from admin
    for col in sorted(app_cols.keys() - admin_cols.keys()):
        issues.append(f"  EXTRA in app:   {col} ({app_cols[col]})")

    # Type mismatches on shared columns
    for col in sorted(admin_cols.keys() & app_cols.keys()):
        admin_type = admin_cols[col].upper().replace(" ", "")
        app_type = app_cols[col].upper().replace(" ", "")
        if admin_type != app_type:
            issues.append(
                f"  TYPE MISMATCH:  {col}  admin={admin_cols[col]}  app={app_cols[col]}"
            )

    return issues


# ---------------------------------------------------------------------------
# Tables to compare — (admin_import_path, app_import_path, class_name)
# ---------------------------------------------------------------------------
COMPARE_TARGETS = [
    # (admin_module, app_module, class_name, table_label)
    ("app.models.poi", "app.models.poi", "PointOfInterest", "points_of_interest"),
    ("app.models.poi", "app.models.poi", "Business", "businesses"),
    ("app.models.poi", "app.models.poi", "Park", "parks"),
    ("app.models.poi", "app.models.poi", "Trail", "trails"),
    ("app.models.poi", "app.models.poi", "Event", "events"),
    ("app.models.category", "app.models.poi", "Category", "categories"),
    ("app.models.image", "app.models.image", "Image", "images"),
]

# Columns intentionally excluded from the app (admin-only concerns)
KNOWN_EXCLUSIONS = {
    "images": {"uploaded_by"},  # app has it but without FK
}


def main():
    # We need to import each backend's models in isolation.
    # Since both define `app.models.*`, we import them in separate scopes
    # using importlib with sys.path manipulation.

    total_issues = 0

    for admin_mod_path, app_mod_path, class_name, table_label in COMPARE_TARGETS:
        # ---- Load admin model ----
        saved_path = list(sys.path)
        saved_modules = {k: v for k, v in sys.modules.items()}
        try:
            # Clean app.* modules to avoid cross-contamination
            for key in list(sys.modules.keys()):
                if key.startswith("app.") or key == "app":
                    del sys.modules[key]

            sys.path.insert(0, ADMIN_BACKEND)
            sys.path.insert(0, SHARED_DIR)
            admin_mod = importlib.import_module(admin_mod_path)
            admin_cls = getattr(admin_mod, class_name)
            admin_cols = get_columns(admin_cls)
        except Exception as e:
            print(f"[{table_label}] ERROR loading admin model: {e}")
            total_issues += 1
            continue
        finally:
            # Restore
            sys.path = saved_path
            for key in list(sys.modules.keys()):
                if key.startswith("app.") or key == "app":
                    del sys.modules[key]
            sys.modules.update(saved_modules)

        # ---- Load app model ----
        saved_path2 = list(sys.path)
        saved_modules2 = {k: v for k, v in sys.modules.items()}
        try:
            for key in list(sys.modules.keys()):
                if key.startswith("app.") or key == "app":
                    del sys.modules[key]

            sys.path.insert(0, APP_BACKEND)
            sys.path.insert(0, SHARED_DIR)
            app_mod = importlib.import_module(app_mod_path)
            app_cls = getattr(app_mod, class_name)
            app_cols = get_columns(app_cls)
        except Exception as e:
            print(f"[{table_label}] ERROR loading app model: {e}")
            total_issues += 1
            continue
        finally:
            sys.path = saved_path2
            for key in list(sys.modules.keys()):
                if key.startswith("app.") or key == "app":
                    del sys.modules[key]
            sys.modules.update(saved_modules2)

        # ---- Compare ----
        issues = []
        exclusions = KNOWN_EXCLUSIONS.get(table_label, set())

        # Columns in admin but missing from app
        for col in sorted(admin_cols.keys() - app_cols.keys() - exclusions):
            issues.append(f"  MISSING in app: {col} ({admin_cols[col]})")

        # Columns in app but missing from admin (excluding known app-only)
        for col in sorted(app_cols.keys() - admin_cols.keys()):
            issues.append(f"  EXTRA in app:   {col} ({app_cols[col]})")

        # Type mismatches on shared columns
        for col in sorted(admin_cols.keys() & app_cols.keys()):
            admin_type = admin_cols[col].upper().replace(" ", "")
            app_type = app_cols[col].upper().replace(" ", "")
            if admin_type != app_type:
                issues.append(
                    f"  TYPE MISMATCH:  {col}  admin={admin_cols[col]}  app={app_cols[col]}"
                )

        if issues:
            print(f"\n[{table_label}] {len(issues)} issue(s):")
            for issue in issues:
                print(issue)
            total_issues += len(issues)
        else:
            print(f"[{table_label}] OK")

    print(f"\n{'='*50}")
    if total_issues == 0:
        print("All models in sync!")
        return 0
    else:
        print(f"Total drift issues: {total_issues}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
