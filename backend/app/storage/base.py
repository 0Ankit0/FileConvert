from pathlib import Path

from abc import ABC, abstractmethod


class StorageProvider(ABC):
    @abstractmethod
    def save(self, object_key: str, content: bytes) -> str:
        raise NotImplementedError

    @abstractmethod
    def read(self, object_key: str) -> bytes:
        raise NotImplementedError

    @abstractmethod
    def save_file(self, object_key: str, source_path: Path) -> str:
        raise NotImplementedError
