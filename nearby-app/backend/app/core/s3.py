"""S3 configuration and client for feedback file uploads"""

import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class S3Config:
    """S3 configuration — supports AWS S3 and MinIO"""

    def __init__(self):
        self.bucket_name = os.getenv("AWS_S3_BUCKET")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.cloudfront_domain = os.getenv("AWS_CLOUDFRONT_DOMAIN")
        self.endpoint_url = os.getenv("AWS_S3_ENDPOINT_URL")

    @property
    def is_minio(self) -> bool:
        return self.endpoint_url is not None

    @property
    def is_configured(self) -> bool:
        if not self.bucket_name:
            return False
        return bool(self.access_key_id or self._has_iam_role())

    def _has_iam_role(self) -> bool:
        """Check if running with IAM role credentials (ECS task role or EC2 instance profile)"""
        try:
            session = boto3.Session()
            credentials = session.get_credentials()
            return credentials is not None
        except:
            return False

    def get_s3_url(self, key: str) -> str:
        if self.cloudfront_domain:
            return f"https://{self.cloudfront_domain}/{key}"
        elif self.endpoint_url:
            external_url = self.endpoint_url.replace("minio:", "localhost:")
            return f"{external_url}/{self.bucket_name}/{key}"
        else:
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{key}"


class S3Client:
    """S3 client wrapper with lazy initialization"""

    def __init__(self, config: S3Config):
        self.config = config
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                session_kwargs = {
                    "region_name": self.config.region,
                }

                # Add credentials if provided (otherwise use IAM role)
                if self.config.access_key_id and self.config.secret_access_key:
                    session_kwargs.update({
                        "aws_access_key_id": self.config.access_key_id,
                        "aws_secret_access_key": self.config.secret_access_key,
                    })

                session = boto3.Session(**session_kwargs)

                client_kwargs = {
                    "config": boto3.session.Config(
                        signature_version="s3v4",
                        s3={"addressing_style": "path"},
                    )
                }
                if self.config.endpoint_url:
                    client_kwargs["endpoint_url"] = self.config.endpoint_url
                    client_kwargs["use_ssl"] = False

                self._client = session.client("s3", **client_kwargs)

                try:
                    self._client.head_bucket(Bucket=self.config.bucket_name)
                except ClientError as e:
                    code = e.response.get("Error", {}).get("Code", "")
                    if code in ["404", "NoSuchBucket"] and self.config.is_minio:
                        self._client.create_bucket(Bucket=self.config.bucket_name)
                    else:
                        raise

                logger.info(f"S3 client initialized for bucket: {self.config.bucket_name}")
            except NoCredentialsError:
                logger.error("AWS credentials not found")
                raise ValueError("AWS credentials not configured")
            except ClientError as e:
                logger.error(f"S3 client init failed: {e}")
                raise ValueError(f"S3 configuration error: {e}")
        return self._client

    async def upload_file(self, file_data: bytes, key: str, content_type: str) -> str:
        self.client.put_object(
            Bucket=self.config.bucket_name,
            Key=key,
            Body=file_data,
            ContentType=content_type,
            CacheControl="public, max-age=31536000",
        )
        return self.config.get_s3_url(key)


# Global instances
s3_config = S3Config()
s3_client = S3Client(s3_config) if s3_config.is_configured else None
