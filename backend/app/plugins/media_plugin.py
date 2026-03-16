from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any

from app.services.conversion_engine import ConverterPlugin


class MediaPlugin(ConverterPlugin):
    """ffmpeg wrapper for audio/video transcodes."""

    name = "media"

    _pairs = {
        ("video/mp4", "video/webm"),
        ("video/webm", "video/mp4"),
        ("audio/mpeg", "audio/wav"),
        ("audio/wav", "audio/mpeg"),
        ("video/mp4", "audio/mpeg"),
    }

    _operations = {"compress", "split", "rotate"}

    def supports(self, input_mime: str, output_mime: str) -> bool:
        return (input_mime, output_mime) in self._pairs

    def supported_pairs(self) -> list[tuple[str, str]]:
        return sorted(self._pairs)

    def operations(self) -> set[str]:
        return set(self._operations)

    def convert(self, source_path: str, destination_path: str, **options: Any) -> str:
        destination = Path(destination_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        extra_args = options.get("ffmpeg_args", [])
        if not isinstance(extra_args, list):
            raise ValueError("ffmpeg_args must be a list")

        subprocess.run(
            ["ffmpeg", "-y", "-i", source_path, *extra_args, destination_path],
            check=True,
            capture_output=True,
            text=True,
        )
        return destination_path
