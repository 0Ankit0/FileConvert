import os
from pathlib import Path

import boto3

from app.storage.base import StorageProvider


class S3StorageProvider(StorageProvider):
    def __init__(self) -> None:
        endpoint_url = os.getenv("S3_ENDPOINT_URL")
        self.bucket = os.getenv("S3_BUCKET", "fileconvert")
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
        )

    def save(self, object_key: str, content: bytes) -> str:
        self.client.put_object(Bucket=self.bucket, Key=object_key, Body=content)
        return f"s3://{self.bucket}/{object_key}"

    def read(self, object_key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=object_key)
        return response["Body"].read()

    def save_file(self, object_key: str, source_path: Path) -> str:
        with source_path.open("rb") as source:
            self.client.upload_fileobj(source, self.bucket, object_key)
        return f"s3://{self.bucket}/{object_key}"
