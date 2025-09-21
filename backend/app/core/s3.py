"""S3 configuration and client setup for image storage"""

import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class S3Config:
    """S3 configuration class"""

    def __init__(self):
        self.bucket_name = os.getenv("AWS_S3_BUCKET")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.cloudfront_domain = os.getenv("AWS_CLOUDFRONT_DOMAIN")  # Optional CDN

        # S3 configuration
        self.use_ssl = os.getenv("AWS_USE_SSL", "true").lower() == "true"
        self.signature_version = os.getenv("AWS_SIGNATURE_VERSION", "s3v4")

    @property
    def is_configured(self) -> bool:
        """Check if S3 is properly configured"""
        if not self.bucket_name:
            return False
        return bool(self.access_key_id or self._has_iam_role())

    def _has_iam_role(self) -> bool:
        """Check if running on EC2 with IAM role"""
        try:
            # This will work if running on EC2 with IAM role
            session = boto3.Session()
            credentials = session.get_credentials()
            return credentials is not None
        except:
            return False

    def get_s3_url(self, key: str) -> str:
        """Get public S3 URL for a key"""
        if self.cloudfront_domain:
            return f"https://{self.cloudfront_domain}/{key}"
        else:
            return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{key}"


class S3Client:
    """S3 client wrapper with error handling and utilities"""

    def __init__(self, config: S3Config):
        self.config = config
        self._client = None

    @property
    def client(self):
        """Lazy-loaded S3 client"""
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

                self._client = session.client(
                    "s3",
                    config=boto3.session.Config(
                        signature_version=self.config.signature_version,
                        use_ssl=self.config.use_ssl,
                    )
                )

                # Test connection
                self._client.head_bucket(Bucket=self.config.bucket_name)
                logger.info(f"S3 client initialized for bucket: {self.config.bucket_name}")

            except NoCredentialsError:
                logger.error("AWS credentials not found")
                raise ValueError("AWS credentials not configured properly")
            except ClientError as e:
                logger.error(f"S3 client initialization failed: {e}")
                raise ValueError(f"S3 configuration error: {e}")

        return self._client

    async def upload_file(
        self,
        file_data: bytes,
        key: str,
        content_type: str,
        metadata: Optional[dict] = None
    ) -> str:
        """Upload file to S3 and return the URL"""
        try:
            extra_args = {
                "ContentType": content_type,
                "CacheControl": "public, max-age=31536000",  # 1 year cache
            }

            if metadata:
                extra_args["Metadata"] = metadata

            # Upload to S3
            self.client.put_object(
                Bucket=self.config.bucket_name,
                Key=key,
                Body=file_data,
                **extra_args
            )

            # Return public URL
            return self.config.get_s3_url(key)

        except ClientError as e:
            logger.error(f"S3 upload failed for key {key}: {e}")
            raise ValueError(f"Failed to upload to S3: {e}")

    async def delete_file(self, key: str) -> bool:
        """Delete file from S3"""
        try:
            self.client.delete_object(
                Bucket=self.config.bucket_name,
                Key=key
            )
            logger.info(f"Deleted S3 object: {key}")
            return True

        except ClientError as e:
            logger.error(f"S3 delete failed for key {key}: {e}")
            return False

    def generate_presigned_url(
        self,
        key: str,
        expiration: int = 3600,
        method: str = "get_object"
    ) -> str:
        """Generate presigned URL for private access"""
        try:
            return self.client.generate_presigned_url(
                method,
                Params={"Bucket": self.config.bucket_name, "Key": key},
                ExpiresIn=expiration
            )
        except ClientError as e:
            logger.error(f"Presigned URL generation failed for key {key}: {e}")
            raise ValueError(f"Failed to generate presigned URL: {e}")

    def check_bucket_exists(self) -> bool:
        """Check if the configured bucket exists and is accessible"""
        try:
            self.client.head_bucket(Bucket=self.config.bucket_name)
            return True
        except ClientError:
            return False


# Global instances
s3_config = S3Config()
s3_client = S3Client(s3_config) if s3_config.is_configured else None