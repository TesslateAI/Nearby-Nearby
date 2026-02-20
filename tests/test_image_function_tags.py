"""
Tests for Task 51: Image function tagging.
Add function_tags JSONB to images for categorized display.
"""
import io
import json
import struct
import zlib
import pytest
from conftest import create_business, MINIO_ENDPOINT, MINIO_BUCKET, MINIO_ACCESS_KEY, MINIO_SECRET_KEY


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


def _upload_image(client, poi_id, image_type="gallery", function_tags=None, filename="test.png"):
    """Helper to upload an image with optional function tags."""
    png_bytes = _create_test_png()
    data = {"image_type": image_type}
    if function_tags is not None:
        data["function_tags"] = json.dumps(function_tags)
    resp = client.post(
        f"/api/images/upload/{poi_id}",
        files={"file": (filename, io.BytesIO(png_bytes), "image/png")},
        data=data,
    )
    return resp


class TestImageFunctionTags:
    """Task 51: function_tags on images."""

    def test_upload_image_with_function_tags(self, admin_client, ensure_minio_bucket):
        """Image uploaded with function_tags are stored correctly."""
        poi = create_business(admin_client, "Tagged Biz")
        resp = _upload_image(
            admin_client, poi["id"],
            function_tags=["storefront", "entrance"],
        )
        assert resp.status_code == 200, f"Upload failed: {resp.text}"
        image_id = resp.json()["id"]

        # Fetch the image and verify tags
        img_resp = admin_client.get(f"/api/images/image/{image_id}")
        assert img_resp.status_code == 200
        assert "storefront" in img_resp.json()["function_tags"]
        assert "entrance" in img_resp.json()["function_tags"]

    def test_update_image_function_tags(self, admin_client, ensure_minio_bucket):
        """Function tags can be updated on existing image."""
        poi = create_business(admin_client, "Update Tag Biz")
        resp = _upload_image(admin_client, poi["id"])
        assert resp.status_code == 200, f"Upload failed: {resp.text}"
        image_id = resp.json()["id"]

        # Update with function tags
        update_resp = admin_client.put(
            f"/api/images/image/{image_id}",
            json={"function_tags": ["interior", "parking"]},
        )
        assert update_resp.status_code == 200
        assert "interior" in update_resp.json()["function_tags"]
        assert "parking" in update_resp.json()["function_tags"]

    def test_multiple_function_tags(self, admin_client, ensure_minio_bucket):
        """Image can have multiple function tags."""
        poi = create_business(admin_client, "Multi Tag Biz")
        tags = ["storefront", "entrance", "signage", "exterior"]
        resp = _upload_image(
            admin_client, poi["id"],
            function_tags=tags,
        )
        assert resp.status_code == 200, f"Upload failed: {resp.text}"
        image_id = resp.json()["id"]

        img_resp = admin_client.get(f"/api/images/image/{image_id}")
        assert len(img_resp.json()["function_tags"]) == 4

    def test_function_tags_in_response(self, admin_client, ensure_minio_bucket):
        """function_tags included in image list response."""
        poi = create_business(admin_client, "List Tag Biz")
        resp1 = _upload_image(
            admin_client, poi["id"],
            function_tags=["storefront"],
            filename="store1.png",
        )
        assert resp1.status_code == 200, f"Upload failed: {resp1.text}"
        resp2 = _upload_image(
            admin_client, poi["id"],
            function_tags=["interior"],
            filename="store2.png",
        )
        assert resp2.status_code == 200, f"Upload failed: {resp2.text}"

        resp = admin_client.get(f"/api/images/poi/{poi['id']}")
        assert resp.status_code == 200
        images = resp.json()
        # At least one image should have function_tags
        tagged = [img for img in images if img.get("function_tags")]
        assert len(tagged) >= 1

    def test_filter_images_by_function_tag(self, admin_client, ensure_minio_bucket):
        """Can filter POI images by function tag."""
        poi = create_business(admin_client, "Filter Tag Biz")
        _upload_image(
            admin_client, poi["id"],
            function_tags=["storefront"],
            filename="front.png",
        )
        _upload_image(
            admin_client, poi["id"],
            function_tags=["interior"],
            filename="inside.png",
        )

        # Filter by tag
        resp = admin_client.get(
            f"/api/images/poi/{poi['id']}",
            params={"function_tag": "storefront"},
        )
        assert resp.status_code == 200
        images = resp.json()
        assert len(images) >= 1, "Filter should return at least one image with the 'storefront' tag"
        # Should only return images with "storefront" tag
        for img in images:
            assert "storefront" in img.get("function_tags", [])
