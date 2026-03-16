from __future__ import annotations

import hashlib
import hmac
import mimetypes
import socket
import struct
import time
from dataclasses import dataclass
from pathlib import Path


class ValidationError(ValueError):
    pass


@dataclass(frozen=True)
class FileRules:
    allowed_extensions: set[str]
    allowed_mimes: set[str]


RULES_BY_CONVERSION: dict[str, FileRules] = {
    "pdf_to_docx": FileRules({".pdf"}, {"application/pdf"}),
    "docx_to_pdf": FileRules(
        {".docx"},
        {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/zip",
        },
    ),
    "audio_to_text": FileRules({".wav", ".mp3", ".m4a"}, {"audio/wav", "audio/mpeg", "audio/mp4"}),
    "video_to_mp3": FileRules({".mp4", ".mov", ".mkv"}, {"video/mp4", "video/quicktime", "video/x-matroska"}),
}


def sniff_mime(path: Path) -> str:
    # lightweight sniffing: magic headers first, then Python mimetypes fallback.
    data = path.read_bytes()[:16]
    if data.startswith(b"%PDF"):
        return "application/pdf"
    if data.startswith(b"PK\x03\x04"):
        return "application/zip"
    if data[:4] == b"RIFF" and data[8:12] == b"WAVE":
        return "audio/wav"
    if data[:3] == b"ID3":
        return "audio/mpeg"
    if data[4:8] == b"ftyp":
        return "video/mp4"
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


def validate_extension_and_mime(path: Path, conversion_type: str) -> str:
    rules = RULES_BY_CONVERSION.get(conversion_type)
    if not rules:
        raise ValidationError(f"unsupported conversion type: {conversion_type}")

    ext = path.suffix.lower()
    if ext not in rules.allowed_extensions:
        raise ValidationError(f"extension {ext} is not allowed for {conversion_type}")

    mime = sniff_mime(path)
    if mime not in rules.allowed_mimes:
        raise ValidationError(f"mime {mime} is not allowed for {conversion_type}")
    return mime


class VirusDetectedError(RuntimeError):
    pass


class VirusScannerUnavailableError(RuntimeError):
    pass


class ClamAVScanner:
    """Simple ClamAV INSTREAM integration hook."""

    def __init__(self, host: str, port: int, timeout: float = 5.0) -> None:
        self.host = host
        self.port = port
        self.timeout = timeout

    def scan_file(self, path: Path) -> None:
        try:
            with socket.create_connection((self.host, self.port), timeout=self.timeout) as sock:
                sock.sendall(b"zINSTREAM\x00")
                with path.open("rb") as f:
                    while chunk := f.read(4096):
                        sock.sendall(struct.pack(">I", len(chunk)))
                        sock.sendall(chunk)
                sock.sendall(struct.pack(">I", 0))
                result = sock.recv(2048).decode("utf-8", errors="replace")
        except OSError as exc:
            raise VirusScannerUnavailableError("clamav unavailable") from exc

        if "FOUND" in result:
            raise VirusDetectedError(result.strip())
        if "OK" not in result:
            raise VirusScannerUnavailableError(f"unexpected clamav response: {result.strip()}")


class SignedURLService:
    def __init__(self, secret: str) -> None:
        self.secret = secret.encode("utf-8")

    def create_token(self, object_key: str, expires_at: int) -> str:
        payload = f"{object_key}:{expires_at}".encode("utf-8")
        sig = hmac.new(self.secret, payload, hashlib.sha256).hexdigest()
        return f"{object_key}:{expires_at}:{sig}"

    def verify_token(self, token: str) -> str:
        try:
            object_key, expires_at_raw, signature = token.rsplit(":", 2)
            expires_at = int(expires_at_raw)
        except ValueError as exc:
            raise ValidationError("invalid signed url token") from exc

        if expires_at < int(time.time()):
            raise ValidationError("download url expired")

        payload = f"{object_key}:{expires_at}".encode("utf-8")
        expected = hmac.new(self.secret, payload, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValidationError("invalid signed url signature")
        return object_key
