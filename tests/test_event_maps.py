"""
Tests for Task 48: Downloadable maps for events.
Base POI already has downloadable_maps JSONB and downloadable_map ImageType.
These tests verify events can use these features.
"""
import io
import struct
import zlib
import pytest
from conftest import create_event, MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY


def _create_test_png(width=10, height=10):
    """Create a valid PNG image for testing."""
    signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    ihdr = struct.pack('>I', 13) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    raw_rows = b''
    for _ in range(height):
        raw_rows += b'\x00' + b'\xff\x00\x00' * width
    compressed = zlib.compress(raw_rows)
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    return signature + ihdr + idat + iend


@pytest.fixture(scope="session")
def ensure_minio_bucket():
    """Ensure the test MinIO bucket exists."""
    try:
        import boto3
        from botocore.config import Config
        from botocore.exceptions import ClientError
        s3 = boto3.client(
            "s3",
            endpoint_url=MINIO_ENDPOINT,
            aws_access_key_id=MINIO_ACCESS_KEY,
            aws_secret_access_key=MINIO_SECRET_KEY,
            region_name="us-east-1",
            config=Config(signature_version="s3v4"),
        )
        try:
            s3.head_bucket(Bucket=MINIO_BUCKET)
        except ClientError:
            s3.create_bucket(Bucket=MINIO_BUCKET)
        return s3
    except Exception as e:
        pytest.skip(f"MinIO not available: {e}")


class TestEventDownloadableMaps:
    """Task 48: Events can have downloadable maps."""

    def test_event_downloadable_maps_stored(self, admin_client):
        """Events can have downloadable_maps JSONB field."""
        poi = create_event(
            admin_client, "Map Event",
            downloadable_maps=[
                {"name": "Event Map", "url": "https://example.com/map.pdf"}
            ],
        )
        assert poi["downloadable_maps"] is not None
        assert len(poi["downloadable_maps"]) == 1
        assert poi["downloadable_maps"][0]["name"] == "Event Map"

    def test_event_downloadable_maps_update(self, admin_client):
        """downloadable_maps can be updated on events."""
        poi = create_event(admin_client, "Map Update Event")
        resp = admin_client.put(
            f"/api/pois/{poi['id']}",
            json={
                "downloadable_maps": [
                    {"name": "Vendor Map", "url": "https://example.com/vendor-map.pdf"},
                    {"name": "Parking Map", "url": "https://example.com/parking.pdf"},
                ]
            },
        )
        assert resp.status_code == 200
        maps = resp.json()["downloadable_maps"]
        assert len(maps) == 2

    def test_event_map_image_upload(self, admin_client, ensure_minio_bucket):
        """Image can be uploaded as downloadable_map type for an event."""
        poi = create_event(admin_client, "Map Image Event")
        png_bytes = _create_test_png()
        resp = admin_client.post(
            f"/api/images/upload/{poi['id']}",
            files={"file": ("event-map.png", io.BytesIO(png_bytes), "image/png")},
            data={"image_type": "downloadable_map", "alt_text": "Event map"},
        )
        assert resp.status_code == 200, f"Upload failed: {resp.text}"
        assert resp.json()["id"] is not None

    def test_event_downloadable_maps_returned_in_get(self, admin_client):
        """downloadable_maps returned in GET response for events."""
        poi = create_event(
            admin_client, "Get Map Event",
            downloadable_maps=[{"name": "Trail Map", "url": "https://example.com/trail.pdf"}],
        )
        resp = admin_client.get(f"/api/pois/{poi['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["downloadable_maps"] is not None
        assert data["downloadable_maps"][0]["name"] == "Trail Map"
