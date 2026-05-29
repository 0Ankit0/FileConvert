from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

from app.services.conversion_engine import ConverterPlugin


class OfficePlugin(ConverterPlugin):
    """LibreOffice headless bridge for office document conversions."""

    name = "office"

    _pairs = {
        ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf"),
        ("application/msword", "application/pdf"),
        ("application/vnd.ms-excel", "application/pdf"),
        ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/pdf"),
        ("application/vnd.ms-powerpoint", "application/pdf"),
        ("application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/pdf"),
        ("text/plain", "application/vnd.oasis.opendocument.text"),
        ("application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("application/pdf", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        ("application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("text/html", "application/pdf"),
    }

    _operations = {"merge", "split"}

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

        outdir = destination.parent
        target_ext = destination.suffix.lstrip(".") or "pdf"
        subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to",
                target_ext,
                str(source),
                "--outdir",
                str(outdir),
            ],
            check=True,
            capture_output=True,
            text=True,
        )

        converted = outdir / f"{source.stem}.{target_ext}"
        if converted != destination and converted.exists():
            converted.replace(destination)
        return str(destination)
