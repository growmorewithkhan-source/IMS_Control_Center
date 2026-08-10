# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

ROOT = Path(SPECPATH).resolve()

hiddenimports = [
    "webview",
    "webview.platforms.winforms",
    "webview.platforms.edgechromium",
]
try:
    hiddenimports += collect_submodules("webview")
except Exception:
    pass

datas = [
    (str(ROOT / "login.html"), "."),
    (str(ROOT / "index.html"), "."),
    (str(ROOT / "ims_logo.png"), "."),
    (str(ROOT / "computers.txt"), "."),
    (str(ROOT / "macs.txt"), "."),
    (str(ROOT / "vnc_service.txt"), "."),
    (str(ROOT / "static"), "static"),
    (str(ROOT / "js"), "js"),
]
try:
    datas += collect_data_files("webview")
except Exception:
    pass

a = Analysis(
    [str(ROOT / "main.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="IMS Control Center",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(ROOT / "ims_control_center.ico") if (ROOT / "ims_control_center.ico").exists() else None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    a.zipfiles,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="IMS Control Center",
)
