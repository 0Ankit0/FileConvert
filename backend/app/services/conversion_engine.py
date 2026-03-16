from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Protocol


MAX_FILE_SIZE_BYTES = 512 * 1024 * 1024  # 512MB


class ConverterPlugin(Protocol):
    """Contract for conversion plugins."""

    name: str

    def supports(self, input_mime: str, output_mime: str) -> bool:
        """Return True when this plugin can convert input_mime to output_mime."""

    def supported_pairs(self) -> list[tuple[str, str]]:
        """Return all supported (input_mime, output_mime) tuples."""

    def operations(self) -> set[str]:
        """Return available operations beyond conversion (merge/split/etc)."""

    def convert(self, source_path: str, destination_path: str, **options: Any) -> str:
        """Convert source_path into destination_path and return resulting path."""


@dataclass(slots=True)
class ConversionJob:
    """Normalized and validated conversion request."""

    source_path: str
    input_mime: str
    output_mime: str
    file_size_bytes: int
    options: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.source_path = str(Path(self.source_path))
        if not self.source_path:
            raise ValueError("source_path is required")
        if self.file_size_bytes <= 0:
            raise ValueError("file_size_bytes must be greater than 0")
        if self.file_size_bytes > MAX_FILE_SIZE_BYTES:
            raise ValueError(
                f"file_size_bytes exceeds max supported size ({MAX_FILE_SIZE_BYTES} bytes)"
            )

        self.input_mime = self._normalize_mime(self.input_mime, "input_mime")
        self.output_mime = self._normalize_mime(self.output_mime, "output_mime")

        if self.input_mime == self.output_mime and not self.options.get("allow_same_format"):
            raise ValueError("input_mime and output_mime cannot be identical")

        if not isinstance(self.options, dict):
            raise ValueError("options must be a dictionary")
        self._validate_options()

    @staticmethod
    def _normalize_mime(value: str, field_name: str) -> str:
        normalized = (value or "").strip().lower()
        if "/" not in normalized:
            raise ValueError(f"{field_name} must be a valid MIME type")
        return normalized

    def _validate_options(self) -> None:
        if "quality" in self.options:
            quality = self.options["quality"]
            if not isinstance(quality, int) or not (1 <= quality <= 100):
                raise ValueError("options.quality must be an int between 1 and 100")

        if "page_range" in self.options:
            page_range = self.options["page_range"]
            if not isinstance(page_range, str) or not page_range.strip():
                raise ValueError("options.page_range must be a non-empty string")

        if "ocr" in self.options and not isinstance(self.options["ocr"], bool):
            raise ValueError("options.ocr must be a boolean")


class ConversionRegistry:
    """In-memory registry for conversion plugins."""

    def __init__(self) -> None:
        self._plugins: dict[str, ConverterPlugin] = {}

    def register(self, plugin: ConverterPlugin) -> None:
        plugin_name = getattr(plugin, "name", "").strip()
        if not plugin_name:
            raise ValueError("Plugin must have a non-empty 'name' field")
        self._plugins[plugin_name] = plugin

    def unregister(self, plugin_name: str) -> None:
        self._plugins.pop(plugin_name, None)

    def list_plugins(self) -> list[ConverterPlugin]:
        return list(self._plugins.values())

    def find_plugin(self, input_mime: str, output_mime: str) -> ConverterPlugin:
        for plugin in self._plugins.values():
            if plugin.supports(input_mime, output_mime):
                return plugin
        raise LookupError(f"No plugin supports {input_mime} -> {output_mime}")

    def capabilities(self) -> dict[str, Any]:
        conversions: list[dict[str, str]] = []
        tool_operations: set[str] = set()

        for plugin in self._plugins.values():
            for in_mime, out_mime in plugin.supported_pairs():
                conversions.append(
                    {
                        "plugin": plugin.name,
                        "input_mime": in_mime,
                        "output_mime": out_mime,
                    }
                )
            tool_operations.update(plugin.operations())

        return {
            "plugins": [p.name for p in self._plugins.values()],
            "conversions": sorted(
                conversions,
                key=lambda item: (item["input_mime"], item["output_mime"], item["plugin"]),
            ),
            "operations": sorted(tool_operations),
        }

    def convert(self, job: ConversionJob, destination_path: str) -> str:
        plugin = self.find_plugin(job.input_mime, job.output_mime)
        options = {"input_mime": job.input_mime, "output_mime": job.output_mime, **job.options}
        return plugin.convert(job.source_path, destination_path, **options)
