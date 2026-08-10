from pathlib import Path
import sys


def app_dir() -> Path:
    """Return the directory containing the installed application/executable."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def resource_path(*parts: str) -> Path:
    """Return a path to an application resource.

    For the installed onedir build, resources are placed beside the EXE.
    During development, resources are read from the project directory.
    """
    return app_dir().joinpath(*parts)
