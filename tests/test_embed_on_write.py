"""Tests for Phase A7 best-effort embed-on-write (nearby-admin).

These tests assert ROBUSTNESS, not the embedding pipeline itself. The TEI client
is DISABLED by default in the test environment (``EMBEDDING_SERVICE_URL`` is
unset in conftest), so ``client.embed`` returns ``None`` and
``write_embedding_best_effort`` no-ops cleanly without touching the (unmapped,
possibly absent) ``embedding`` column.

The end-to-end "vector actually stored" test belongs to the Shared
embedding-pipeline phase (pgvector + a mock client) and is intentionally NOT
here — nothing below requires the ``embedding`` column to exist.
"""

import importlib

import pytest

from conftest import create_business


# The module under test (admin backend is on sys.path via conftest).
embedding_writer = importlib.import_module("app.crud.embedding_writer")


class TestSaveNeverBreaks:
    def test_create_succeeds_when_service_unconfigured(self, admin_client):
        """A POI create returns 201 even though the embedding service is
        unconfigured — the writer no-ops cleanly (client disabled)."""
        # Sanity: the TEI client really is disabled in tests.
        from shared.embeddings import get_embedding_client
        assert get_embedding_client().enabled is False

        data = create_business(admin_client, name="Embed NoOp Cafe")
        assert data["name"] == "Embed NoOp Cafe"
        assert data["poi_type"] == "BUSINESS"
        assert "id" in data

    def test_create_succeeds_when_writer_raises(self, admin_client, monkeypatch):
        """If the embed-on-write hook itself blows up, the POI is STILL created.

        The call site must swallow/contain errors so a writer bug can never break
        a save. We force the writer to raise and assert the create still 201s.
        """
        def _boom(*args, **kwargs):
            raise RuntimeError("simulated embedding-writer failure")

        # The hook does a runtime `from app.crud.embedding_writer import ...`, so
        # patching the attribute on the module is picked up by the call site.
        monkeypatch.setattr(
            embedding_writer, "write_embedding_best_effort", _boom
        )

        data = create_business(admin_client, name="Embed Boom Cafe")
        assert data["name"] == "Embed Boom Cafe"
        assert "id" in data

    def test_writer_directly_never_raises_when_disabled(self, db_session):
        """Calling the writer directly is a clean no-op when the client is
        disabled — it must not raise even if the embedding column is absent."""
        from conftest import orm_create_business

        poi = orm_create_business(db_session, name="Direct Writer POI")
        db_session.commit()

        # Must not raise (client disabled -> returns before any SQL).
        embedding_writer.write_embedding_best_effort(db_session, poi.id)


class TestShouldReembedGate:
    def test_returns_true_for_relevant_fields(self):
        assert embedding_writer.should_reembed({"name"}) is True
        assert embedding_writer.should_reembed({"description_long"}) is True
        assert embedding_writer.should_reembed({"description_short"}) is True

    def test_returns_false_for_irrelevant_field(self):
        # is_verified does not feed the searchable text.
        assert embedding_writer.should_reembed({"is_verified"}) is False

    def test_mixed_set_with_one_relevant_is_true(self):
        assert embedding_writer.should_reembed({"is_verified", "name"}) is True

    def test_empty_set_is_false(self):
        assert embedding_writer.should_reembed(set()) is False
