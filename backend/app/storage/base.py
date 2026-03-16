from abc import ABC, abstractmethod


class StorageProvider(ABC):
    @abstractmethod
    def save(self, object_key: str, content: bytes) -> str:
        raise NotImplementedError

    @abstractmethod
    def read(self, object_key: str) -> bytes:
        raise NotImplementedError
