"""Sentry SDK initialization for nearby-admin backend."""
import os


def init_sentry():
    """Initialize Sentry error tracking if SENTRY_DSN is set."""
    dsn = os.environ.get("SENTRY_DSN", "")
    if not dsn or not dsn.startswith("https://"):
        return
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("ENVIRONMENT", "development"),
        traces_sample_rate=0.1,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    )
