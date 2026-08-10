from pathlib import Path
import sys


def app_dir() -> Path:
    """Return the folder containing the installed application files."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def resource_path(*parts: str) -> Path:
    return app_dir().joinpath(*parts)
