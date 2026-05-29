from __future__ import annotations

import shutil
import subprocess
import tarfile
import zipfile
from pathlib import Path
from typing import Any

from app.services.conversion_engine import ConverterPlugin


class ArchivePlugin(ConverterPlugin):
    """Archive adapters for zip/tar/rar pack/unpack operations."""

    name = "archive"

    _pairs = {
        ("application/zip", "application/zip"),
        ("application/zip", "application/x-tar"),
        ("application/x-tar", "application/x-tar"),
        ("application/x-tar", "application/zip"),
        ("application/x-rar-compressed", "application/x-rar-compressed"),
        ("application/x-rar-compressed", "application/zip"),
        ("application/zip", "application/x-rar-compressed"),
        ("application/x-tar", "application/x-rar-compressed"),
        ("application/x-rar-compressed", "application/x-tar"),
    }

    _operations = {"compress", "split"}

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

        input_mime = str(options.get("input_mime", "")).lower()
        output_mime = str(options.get("output_mime", "")).lower()

        if input_mime == "application/zip" and output_mime == "application/x-tar":
            return self._zip_to_tar(source, destination)
        if input_mime == "application/x-tar" and output_mime == "application/zip":
            return self._tar_to_zip(source, destination)
        if input_mime == "application/x-rar-compressed" and output_mime == "application/zip":
            return self._rar_to_zip(source, destination)
        if input_mime == "application/zip" and output_mime == "application/x-rar-compressed":
            return self._zip_to_rar(source, destination)

        shutil.copy2(source, destination)
        return str(destination)

    def _zip_to_tar(self, source: Path, destination: Path) -> str:
        with zipfile.ZipFile(source, "r") as zip_ref, tarfile.open(destination, "w") as tar_ref:
            for member in zip_ref.namelist():
                extracted = zip_ref.read(member)
                tmp_file = source.parent / member
                tmp_file.parent.mkdir(parents=True, exist_ok=True)
                tmp_file.write_bytes(extracted)
                tar_ref.add(tmp_file, arcname=member)
                tmp_file.unlink(missing_ok=True)
        return str(destination)

    def _tar_to_zip(self, source: Path, destination: Path) -> str:
        with tarfile.open(source, "r") as tar_ref, zipfile.ZipFile(destination, "w") as zip_ref:
            for member in tar_ref.getmembers():
                if member.isfile():
                    file_obj = tar_ref.extractfile(member)
                    if file_obj is None:
                        continue
                    zip_ref.writestr(member.name, file_obj.read())
        return str(destination)

    def _rar_to_zip(self, source: Path, destination: Path) -> str:
        subprocess.run(
            ["unrar", "x", "-o+", str(source), str(destination.parent)],
            check=True,
            capture_output=True,
            text=True,
        )
        with zipfile.ZipFile(destination, "w") as zip_ref:
            for file_path in destination.parent.iterdir():
                if file_path.is_file() and file_path != destination:
                    zip_ref.write(file_path, arcname=file_path.name)
        return str(destination)

    def _zip_to_rar(self, source: Path, destination: Path) -> str:
        subprocess.run(
            ["rar", "a", str(destination), str(source)],
            check=True,
            capture_output=True,
            text=True,
        )
        return str(destination)
