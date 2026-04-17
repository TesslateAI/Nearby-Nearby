"""
Read-only admin views for user-submitted forms originating in the nearby-app
frontend (waitlist, contact, feedback, business claims, community interest,
event suggestions).

The owning service is nearby-app, but the data lives in the same Postgres
database as the admin panel. We query the underlying tables directly via
parameterized SQL so we don't have to duplicate SQLAlchemy model definitions
across services. All endpoints require an admin or editor JWT.
"""

import csv
import io
import json
import logging
import zipfile
from datetime import datetime, date
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.permissions import require_admin_or_editor

logger = logging.getLogger(__name__)
router = APIRouter()

# Form-specific table names + the columns we surface in the admin UI.
# Order matters: it controls column order in the rendered tables.
FORM_TABLES: Dict[str, Dict[str, Any]] = {
    "waitlist": {
        "table": "waitlist",
        "columns": ["id", "email", "created_at"],
    },
    "contact": {
        "table": "contact_submissions",
        "columns": ["id", "name", "email", "message", "created_at"],
    },
    "feedback": {
        "table": "feedback_submissions",
        "columns": ["id", "email", "feedback", "file_urls", "created_at"],
    },
    "business-claims": {
        "table": "business_claims",
        "columns": [
            "id", "business_name", "contact_name", "contact_email",
            "contact_phone", "business_address", "how_heard",
            "anything_else", "status", "created_at",
        ],
    },
    "community-interest": {
        "table": "community_interest",
        "columns": [
            "id", "name", "email", "location", "role", "role_other",
            "why", "how_heard", "anything_else", "created_at",
        ],
    },
    "event-suggestions": {
        "table": "event_suggestions",
        "columns": [
            "id", "event_name", "event_date", "event_location",
            "event_description", "organizer_name", "organizer_email",
            "organizer_phone", "additional_info", "status", "created_at",
        ],
    },
}


def _serialize_row(row: Any, columns: List[str]) -> Dict[str, Any]:
    """Convert a SQLAlchemy Row → dict, coercing UUIDs and datetimes to JSON-safe values."""
    out: Dict[str, Any] = {}
    for col in columns:
        val = getattr(row, col, None)
        if val is None:
            out[col] = None
            continue
        # UUID and datetime both have isoformat/str representations FastAPI
        # would otherwise stringify, but explicit is better than implicit.
        try:
            from datetime import datetime, date
            from uuid import UUID
            if isinstance(val, (UUID,)):
                out[col] = str(val)
                continue
            if isinstance(val, (datetime, date)):
                out[col] = val.isoformat()
                continue
        except Exception:
            pass
        out[col] = val
    return out


def _table_exists(db: Session, table_name: str) -> bool:
    """Return True if the given table exists in the current schema."""
    result = db.execute(
        text("SELECT to_regclass(:qualified) IS NOT NULL AS exists"),
        {"qualified": f"public.{table_name}"},
    ).fetchone()
    return bool(result and result.exists)


@router.get("/form-responses/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_editor()),
):
    """Return submission counts for each form type. Missing tables report 0."""
    summary: Dict[str, int] = {}
    for slug, cfg in FORM_TABLES.items():
        table = cfg["table"]
        try:
            if not _table_exists(db, table):
                summary[slug] = 0
                continue
            # Identifier is from a server-controlled allowlist, not user input.
            row = db.execute(text(f"SELECT COUNT(*) AS n FROM {table}")).fetchone()
            summary[slug] = int(row.n) if row else 0
        except Exception:
            logger.exception("Failed to count rows in %s", table)
            summary[slug] = 0
    return summary


def _list_form(
    db: Session, slug: str, skip: int, limit: int
) -> Dict[str, Any]:
    cfg = FORM_TABLES.get(slug)
    if cfg is None:
        raise HTTPException(status_code=404, detail="Unknown form type")

    table = cfg["table"]
    columns = cfg["columns"]

    if not _table_exists(db, table):
        return {"items": [], "total": 0, "skip": skip, "limit": limit, "columns": columns}

    select_cols = ", ".join(columns)
    total_row = db.execute(text(f"SELECT COUNT(*) AS n FROM {table}")).fetchone()
    total = int(total_row.n) if total_row else 0

    rows = db.execute(
        text(
            f"SELECT {select_cols} FROM {table} "
            f"ORDER BY created_at DESC NULLS LAST "
            f"LIMIT :limit OFFSET :skip"
        ),
        {"limit": limit, "skip": skip},
    ).fetchall()

    items = [_serialize_row(r, columns) for r in rows]
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "columns": columns,
    }


def _csv_cell(value: Any) -> str:
    """Render a value as a CSV-friendly string. Lists/dicts become JSON."""
    if value is None:
        return ""
    if isinstance(value, (UUID, datetime, date)):
        return str(value) if isinstance(value, UUID) else value.isoformat()
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return str(value)


def _build_csv(db: Session, slug: str) -> str:
    cfg = FORM_TABLES[slug]
    table = cfg["table"]
    columns = cfg["columns"]

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(columns)

    if not _table_exists(db, table):
        return out.getvalue()

    select_cols = ", ".join(columns)
    rows = db.execute(
        text(f"SELECT {select_cols} FROM {table} ORDER BY created_at DESC NULLS LAST")
    ).fetchall()

    for r in rows:
        writer.writerow([_csv_cell(getattr(r, c, None)) for c in columns])

    return out.getvalue()


@router.get("/form-responses/export-all")
def export_all(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_editor()),
):
    """Return a ZIP containing one CSV per form type."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for slug in FORM_TABLES:
            try:
                zf.writestr(f"{slug}.csv", _build_csv(db, slug))
            except Exception:
                logger.exception("CSV export failed for %s", slug)
                zf.writestr(f"{slug}.csv", "")
    buf.seek(0)
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"form-responses-{stamp}.zip"
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/form-responses/{slug}/export")
def export_form(
    slug: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_editor()),
):
    """Return a single form's submissions as CSV."""
    if slug not in FORM_TABLES:
        raise HTTPException(status_code=404, detail="Unknown form type")
    csv_text = _build_csv(db, slug)
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    filename = f"{slug}-{stamp}.csv"
    return StreamingResponse(
        io.BytesIO(csv_text.encode("utf-8")),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/form-responses/{slug}")
def list_form_responses(
    slug: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_editor()),
):
    """List submissions for a specific form type, paginated, newest first."""
    return _list_form(db, slug, skip, limit)
