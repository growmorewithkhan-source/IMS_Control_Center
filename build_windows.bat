@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================================
echo IMS Control Center - Windows Build
echo ============================================================

echo [1/5] Checking Python...
where py >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python launcher 'py' was not found.
    echo Install Python 3.11 or 3.12 for Windows, then run this again.
    pause
    exit /b 1
)

set PYTHON=py -3

%PYTHON% -c "import sys; print('Python', sys.version)"
if errorlevel 1 goto :fail

echo [2/5] Installing build dependencies...
%PYTHON% -m pip install --upgrade pip
if errorlevel 1 goto :fail
%PYTHON% -m pip install -r requirements-build.txt
if errorlevel 1 goto :fail

echo [3/5] Cleaning old build folders...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

if not exist ims_control_center.ico (
    echo WARNING: ims_control_center.ico is missing. EXE will use the default icon.
)

echo [4/5] Building IMS Control Center with PyInstaller...
%PYTHON% -m PyInstaller --noconfirm --clean IMS_Control_Center.spec
if errorlevel 1 goto :fail

if not exist "dist\IMS Control Center\IMS Control Center.exe" (
    echo ERROR: PyInstaller did not create the expected EXE.
    goto :fail
)

echo [5/5] Build completed successfully.
echo.
echo Output:
echo   dist\IMS Control Center\IMS Control Center.exe

echo.
echo To create the installer, install Inno Setup 6 and run:
echo   installer\make_installer.bat

echo.
pause
exit /b 0

:fail
echo.
echo BUILD FAILED.
pause
exit /b 1
