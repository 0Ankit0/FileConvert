from __future__ import annotations

from pathlib import Path
from typing import Any

from app.services.conversion_engine import ConverterPlugin


class ImagePlugin(ConverterPlugin):
    """Image conversion/transforms backed by Pillow/OpenCV in full impl."""

    name = "image"

    _pairs = {
        ("image/png", "image/jpeg"),
        ("image/jpeg", "image/png"),
        ("image/webp", "image/png"),
        ("image/tiff", "image/jpeg"),
        ("image/heic", "image/jpeg"),
    }

    _operations = {"compress", "rotate", "watermark", "ocr"}

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

        # Placeholder passthrough - wire to Pillow/OpenCV in production.
        destination.write_bytes(source.read_bytes())
        return str(destination)
