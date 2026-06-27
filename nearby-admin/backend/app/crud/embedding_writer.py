"""Best-effort embed-on-write (Phase A7).

When a POI is created, updated, or autosaved in nearby-admin, this module
(re)generates its document embedding through the shared TEI client and stores
it on ``points_of_interest.embedding``.

Hard guarantees (this is the whole point of the module):

* **It NEVER breaks or slow-fails a POI save.** Every public entry point is
  wrapped so that any exception — import error, DB error, TEI hiccup — is
  swallowed and logged, never re-raised. The caller has already committed the
  user's data before we run; we only ever ADD an embedding.
* **It self-heals.** If the TEI service is unconfigured or down, the write is a
  clean no-op; the A6 backfill (``scripts/backfill_embeddings.py``) re-embeds
  anything with ``embedding IS NULL`` later.
* **It uses its OWN transaction and only touches the ``embedding`` column.** The
  reload session and the UPDATE connection are independent of the caller's
  already-committed session, so a failure here cannot roll back or corrupt the
  POI row's user data.

The ``embedding`` column is intentionally NOT mapped on the ORM model (so
ordinary SELECTs don't break where pgvector is absent), so the vector is written
with raw SQL: ``UPDATE ... SET embedding = CAST(:embedding AS vector)`` — the
same statement the A6 backfill uses, keeping write-time and backfill text +
storage byte-identical.
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import text
from sqlalchemy.orm import joinedload

from app import models
from app.database import SessionLocal, engine
from shared.embeddings import build_searchable_text_from_orm, get_embedding_client

logger = logging.getLogger(__name__)


# POI field names whose value feeds ``build_searchable_text`` (and therefore the
# stored embedding). Used by ``should_reembed`` so autosave only re-embeds when a
# semantically relevant field changed — not on every keystroke-batch.
#
# Derived directly from what ``shared/embeddings/text_builder.py`` reads:
#   * the base ``points_of_interest`` columns it pulls off the poi dict
#     (``_POI_TEXT_FIELDS`` in text_builder), plus
#   * the subtype fields it reads off the trail/event/business gates, plus
#   * ``categories`` (category assignment changes the text), plus
#   * a few admin-form field names that map onto those columns (so a change in
#     the form payload still triggers a re-embed).
EMBED_RELEVANT_FIELDS: set[str] = {
    # --- base points_of_interest columns the text builder reads ---
    "name",
    "poi_type",
    "description_short",
    "description_long",
    "business_amenities",
    "entertainment_options",
    "youth_amenities",
    "amenities",
    "ideal_for",
    "ideal_for_key",
    "wifi_options",
    "pet_options",
    "public_toilets",
    "facilities_options",
    "things_to_do",
    "natural_features",
    "outdoor_types",
    "playground_available",
    "camping_lodging",
    "cost",
    "price_range_per_person",
    "alcohol_options",
    "discounts",
    "address_city",
    # --- category assignment (changes "Categories: ..." in the text) ---
    "categories",
    "category_ids",
    "main_category_id",
    # --- trail subtype fields (text builder trail gate) ---
    "difficulty",
    "length_text",
    "route_type",
    "trail_surfaces",
    "trail_experiences",
    # --- event subtype field (text builder event gate) ---
    "venue_settings",
    # --- business subtype field (text builder business gate) ---
    "price_range",
    # --- admin-form aliases that map onto the description columns ---
    "teaser_paragraph",
}


def _load_poi_with_joins(db, poi_id):
    """Load a POI with the same joins ``get_poi`` uses so the text builder sees
    the trail/event/business/category enrichment."""
    return (
        db.query(models.PointOfInterest)
        .options(
            joinedload(models.PointOfInterest.business),
            joinedload(models.PointOfInterest.park),
            joinedload(models.PointOfInterest.trail),
            joinedload(models.PointOfInterest.event),
            joinedload(models.PointOfInterest.categories),
        )
        .filter(models.PointOfInterest.id == poi_id)
        .first()
    )


def write_embedding_best_effort(db, poi_id) -> None:
    """(Re)generate and store the embedding for ``poi_id``. Best-effort: never
    raises, no-ops cleanly when the TEI service is unconfigured or down.

    Call this AFTER the caller has committed the POI's user data. The argument
    ``db`` is accepted for call-site symmetry but is NOT written through — the
    reload happens on a FRESH ``SessionLocal`` session and the UPDATE runs on its
    own ``engine.connect()`` transaction, so this can never roll back or corrupt
    the already-committed POI row.
    """
    try:
        client = get_embedding_client()
        if not client.enabled:
            # TEI service not configured -> no-op; the A6 backfill handles it.
            return

        # Reload on a fresh session so we read the post-commit state with the
        # joins loaded, fully decoupled from the caller's session/transaction.
        reload_db = SessionLocal()
        try:
            poi = _load_poi_with_joins(reload_db, poi_id)
            if poi is None:
                return
            searchable_text = build_searchable_text_from_orm(poi)
        finally:
            reload_db.close()

        vec = client.embed(searchable_text, kind="document")
        if vec is None:
            # Service down / bad response -> skip; the backfill self-heals.
            return

        # The embedding column is intentionally NOT ORM-mapped, so write it with
        # raw SQL in its OWN transaction (same statement as the A6 backfill).
        with engine.connect() as connection:
            connection.execute(
                text(
                    "UPDATE points_of_interest "
                    "SET embedding = CAST(:embedding AS vector) "
                    "WHERE id = :id"
                ),
                {"embedding": str(vec), "id": str(poi_id)},
            )
            connection.commit()
    except Exception as exc:  # noqa: BLE001 — best-effort by contract, never raise
        logger.warning(
            "write_embedding_best_effort failed for poi_id=%s (ignored): %s",
            poi_id,
            exc,
        )
        return


def should_reembed(changed_keys) -> bool:
    """Return True if any changed field affects the searchable text.

    Used by autosave to avoid re-embedding on every whitelisted payload that
    only touched embedding-irrelevant fields.
    """
    if not changed_keys:
        return False
    return bool(set(changed_keys) & EMBED_RELEVANT_FIELDS)
