from __future__ import annotations

from pathlib import Path
from typing import Any

from app.services.conversion_engine import ConverterPlugin


class DataPlugin(ConverterPlugin):
    """Structured data conversion helpers."""

    name = "data"

    _pairs = {
        ("text/csv", "application/json"),
        ("application/json", "text/csv"),
    }

    _operations = {"normalize", "validate"}

    def supports(self, input_mime: str, output_mime: str) -> bool:
        return (input_mime, output_mime) in self._pairs

    def supported_pairs(self) -> list[tuple[str, str]]:
        return sorted(self._pairs)

    def operations(self) -> set[str]:
        return set(self._operations)

    def convert(self, source_path: str, destination_path: str, **options: Any) -> str:
        source = Path(source_path)
        destination = Path(destination_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(source.read_bytes())
        return str(destination)
