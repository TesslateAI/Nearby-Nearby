"""
Tests for Tasks 169-170: Sentry.io integration.

Tests that init_sentry() correctly initializes sentry-sdk when SENTRY_DSN is set,
and gracefully does nothing when it's not set.
"""
import os
import pytest
from unittest.mock import patch, MagicMock


# ---------------------------------------------------------------------------
# Task 169: nearby-app backend Sentry init
# ---------------------------------------------------------------------------
class TestSentryBackendInit:
    def test_sentry_init_with_dsn(self):
        """When SENTRY_DSN is set, sentry_sdk.init should be called."""
        with patch.dict(os.environ, {"SENTRY_DSN": "https://fake@sentry.io/1"}):
            with patch("sentry_sdk.init") as mock_init:
                # Force reimport to pick up env var
                import importlib
                import sys
                # Remove cached module if present
                for mod_name in list(sys.modules.keys()):
                    if "app.core.sentry" in mod_name:
                        del sys.modules[mod_name]

                # Import from nearby-app
                app_backend = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "nearby-app", "backend"
                )
                if app_backend not in sys.path:
                    sys.path.insert(0, app_backend)

                # Clear any cached app.core.sentry
                for mod_name in list(sys.modules.keys()):
                    if mod_name == "app" or mod_name.startswith("app."):
                        pass  # don't remove all app modules, just sentry

                from app.core.sentry import init_sentry
                init_sentry()
                mock_init.assert_called_once()

    def test_sentry_init_without_dsn(self):
        """When SENTRY_DSN is not set, sentry_sdk.init should NOT be called."""
        env = os.environ.copy()
        env.pop("SENTRY_DSN", None)
        with patch.dict(os.environ, env, clear=True):
            with patch("sentry_sdk.init") as mock_init:
                import sys
                for mod_name in list(sys.modules.keys()):
                    if "app.core.sentry" in mod_name:
                        del sys.modules[mod_name]

                app_backend = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "nearby-app", "backend"
                )
                if app_backend not in sys.path:
                    sys.path.insert(0, app_backend)

                from app.core.sentry import init_sentry
                init_sentry()
                mock_init.assert_not_called()

    def test_sentry_init_with_disabled_dsn(self):
        """When SENTRY_DSN is 'disabled', sentry_sdk.init should NOT be called."""
        with patch.dict(os.environ, {"SENTRY_DSN": "disabled"}):
            with patch("sentry_sdk.init") as mock_init:
                import sys
                for mod_name in list(sys.modules.keys()):
                    if "app.core.sentry" in mod_name:
                        del sys.modules[mod_name]

                app_backend = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "nearby-app", "backend"
                )
                if app_backend not in sys.path:
                    sys.path.insert(0, app_backend)

                from app.core.sentry import init_sentry
                init_sentry()
                mock_init.assert_not_called()

    def test_sentry_fastapi_integration(self):
        """Verify FastApiIntegration is in the integrations list."""
        with patch.dict(os.environ, {"SENTRY_DSN": "https://fake@sentry.io/1"}):
            with patch("sentry_sdk.init") as mock_init:
                import sys
                for mod_name in list(sys.modules.keys()):
                    if "app.core.sentry" in mod_name:
                        del sys.modules[mod_name]

                app_backend = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "nearby-app", "backend"
                )
                if app_backend not in sys.path:
                    sys.path.insert(0, app_backend)

                from app.core.sentry import init_sentry
                init_sentry()

                call_kwargs = mock_init.call_args
                integrations = call_kwargs.kwargs.get("integrations", []) if call_kwargs.kwargs else []
                # At least one integration should be FastApiIntegration
                integration_types = [type(i).__name__ for i in integrations]
                assert "FastApiIntegration" in integration_types, \
                    f"FastApiIntegration not found in {integration_types}"


# ---------------------------------------------------------------------------
# Task 170: nearby-admin backend Sentry init
# ---------------------------------------------------------------------------
class TestSentryAdminBackendInit:
    def test_admin_sentry_init_with_dsn(self):
        """Admin backend: When SENTRY_DSN is set, sentry_sdk.init should be called."""
        with patch.dict(os.environ, {"SENTRY_DSN": "https://fake@sentry.io/2"}):
            with patch("sentry_sdk.init") as mock_init:
                import sys
                admin_backend = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)),
                    "nearby-admin", "backend"
                )

                # We need to import the admin sentry module directly
                # Since conftest already has admin on sys.path, we can import it
                for mod_name in list(sys.modules.keys()):
                    if "app.core.sentry" in mod_name:
                        del sys.modules[mod_name]

                from app.core.sentry import init_sentry
                init_sentry()
                mock_init.assert_called_once()

    def test_admin_sentry_init_without_dsn(self):
        """Admin backend: When SENTRY_DSN is not set, graceful no-op."""
        env = os.environ.copy()
        env.pop("SENTRY_DSN", None)
        with patch.dict(os.environ, env, clear=True):
            with patch("sentry_sdk.init") as mock_init:
                import sys
                for mod_name in list(sys.modules.keys()):
                    if "app.core.sentry" in mod_name:
                        del sys.modules[mod_name]

                from app.core.sentry import init_sentry
                init_sentry()
                mock_init.assert_not_called()
