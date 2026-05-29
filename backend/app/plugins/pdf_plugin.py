from __future__ import annotations

from pathlib import Path
from typing import Any

from app.services.conversion_engine import ConverterPlugin


class PDFPlugin(ConverterPlugin):
    """PDF-oriented operations backed by PyMuPDF/pypdf/reportlab toolchain."""

    name = "pdf"

    _pairs = {
        ("application/pdf", "application/pdf"),
        ("application/pdf", "image/png"),
        ("application/pdf", "image/jpeg"),
        ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        ("application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("application/pdf", "text/csv"),
        ("application/pdf", "text/plain"),
        ("image/png", "application/pdf"),
        ("image/jpeg", "application/pdf"),
        ("image/webp", "application/pdf"),
        ("application/msword", "application/pdf"),
        ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf"),
        ("application/vnd.ms-powerpoint", "application/pdf"),
        ("application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/pdf"),
        ("application/vnd.ms-excel", "application/pdf"),
        ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/pdf"),
        ("text/html", "application/pdf"),
        ("text/plain", "application/pdf"),
    }

    _operations = {
        "merge",
        "split",
        "compress",
        "rotate",
        "watermark",
        "ocr",
        "protect",
        "unlock",
        "page-numbers",
        "organize",
        "repair",
    }

    def supports(self, input_mime: str, output_mime: str) -> bool:
        return (input_mime, output_mime) in self._pairs

    def supported_pairs(self) -> list[tuple[str, str]]:
        return sorted(self._pairs)

    def operations(self) -> set[str]:
        return set(self._operations)

    def convert(self, source_path: str, destination_path: str, **options: Any) -> str:
        """Stub orchestration point for PyMuPDF/pypdf/reportlab flows."""
        source = Path(source_path)
        destination = Path(destination_path)
        destination.parent.mkdir(parents=True, exist_ok=True)

        # Placeholder behavior: copy bytes to target. Real implementation can branch:
        # - PyMuPDF: rendering/extraction/rotation
        # - pypdf: merge/split/watermark
        # - reportlab: PDF generation from images/text
        destination.write_bytes(source.read_bytes())
        return str(destination)
