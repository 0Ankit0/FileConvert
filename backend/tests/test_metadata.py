from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path
from zipfile import ZipFile

from backend.metadata import extract_file_metadata


def test_extract_pdf_pages(tmp_path: Path) -> None:
    sample = tmp_path / "sample.pdf"
    sample.write_bytes(b"%PDF-1.4\n1 0 obj <</Type /Page>>\n2 0 obj <</Type /Page>>\n")

    metadata = extract_file_metadata(sample, "pdf_to_docx")

    assert metadata.pages == 2
    assert metadata.duration_seconds is None


def test_extract_docx_pages(tmp_path: Path) -> None:
    sample = tmp_path / "sample.docx"
    with ZipFile(sample, "w") as archive:
        archive.writestr("docProps/app.xml", "<Properties><Pages>7</Pages></Properties>")

    metadata = extract_file_metadata(sample, "docx_to_pdf")

    assert metadata.pages == 7
    assert metadata.duration_seconds is None


def test_extract_wav_duration_rounds_up(tmp_path: Path) -> None:
    sample = tmp_path / "sample.wav"
    with wave.open(str(sample), "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(8000)
        writer.writeframes(b"\x00\x00" * 12001)  # 1.500125 seconds

    metadata = extract_file_metadata(sample, "audio_to_text")

    assert metadata.duration_seconds == 2
    assert metadata.pages is None


def test_ffprobe_fallback_for_non_wav_audio(monkeypatch) -> None:
    class Result:
        stdout = json.dumps({"format": {"duration": "12.01"}})

    def fake_run(*args, **kwargs):
        return Result()

    monkeypatch.setattr(subprocess, "run", fake_run)

    metadata = extract_file_metadata(Path("song.mp3"), "audio_to_text")

    assert metadata.duration_seconds == 13
    assert metadata.pages is None
