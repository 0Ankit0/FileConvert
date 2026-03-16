from pathlib import Path

from app.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    def __init__(self, root: str = "data") -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, object_key: str, content: bytes) -> str:
        target = self.root / object_key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return str(target)

    def read(self, object_key: str) -> bytes:
        return (self.root / object_key).read_bytes()
