from __future__ import annotations

import json
import math
import re
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path
from zipfile import ZipFile


@dataclass(frozen=True)
class FileMetadata:
    pages: int | None = None
    duration_seconds: int | None = None


def _extract_pdf_pages(path: Path) -> int | None:
    data = path.read_bytes()
    matches = re.findall(rb"/Type\s*/Page\b", data)
    return len(matches) or None


def _extract_docx_pages(path: Path) -> int | None:
    try:
        with ZipFile(path) as archive:
            raw = archive.read("docProps/app.xml")
    except (KeyError, OSError, ValueError):
        return None

    text = raw.decode("utf-8", errors="ignore")
    page_match = re.search(r"<Pages>(\d+)</Pages>", text)
    if not page_match:
        return None
    return int(page_match.group(1))


def _probe_duration_with_ffprobe(path: Path) -> int | None:
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "json",
                str(path),
            ],
            capture_output=True,
            check=True,
            text=True,
            timeout=5,
        )
    except (FileNotFoundError, OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return None

    try:
        payload = json.loads(result.stdout)
        duration = float(payload["format"]["duration"])
        if duration <= 0:
            return None
        return math.ceil(duration)
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return None


def _extract_wav_duration(path: Path) -> int | None:
    try:
        with wave.open(str(path), "rb") as wav:
            frames = wav.getnframes()
            rate = wav.getframerate()
    except (FileNotFoundError, OSError, EOFError, wave.Error):
        return None

    if rate <= 0:
        return None
    duration = frames / rate
    if duration <= 0:
        return None
    return math.ceil(duration)


def extract_file_metadata(path: Path, conversion_type: str) -> FileMetadata:
    pages: int | None = None
    duration_seconds: int | None = None

    if conversion_type == "pdf_to_docx":
        pages = _extract_pdf_pages(path)
    elif conversion_type == "docx_to_pdf":
        pages = _extract_docx_pages(path)
    elif conversion_type in {"audio_to_text", "video_to_mp3"}:
        if path.suffix.lower() == ".wav":
            duration_seconds = _extract_wav_duration(path)
        if duration_seconds is None:
            duration_seconds = _probe_duration_with_ffprobe(path)

    return FileMetadata(pages=pages, duration_seconds=duration_seconds)
