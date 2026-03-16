from app.plugins.archive_plugin import ArchivePlugin
from app.plugins.image_plugin import ImagePlugin
from app.plugins.media_plugin import MediaPlugin
from app.plugins.office_plugin import OfficePlugin
from app.plugins.pdf_plugin import PDFPlugin
from app.services.conversion_engine import ConversionRegistry


def build_registry() -> ConversionRegistry:
    registry = ConversionRegistry()
    registry.register(PDFPlugin())
    registry.register(OfficePlugin())
    registry.register(ImagePlugin())
    registry.register(MediaPlugin())
    registry.register(ArchivePlugin())
    return registry
