@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ============================================================
echo IMS Control Center - Installer Build
 echo ============================================================

if not exist "dist\IMS Control Center\IMS Control Center.exe" (
    echo ERROR: Application build not found.
    echo Run build_windows.bat first.
    pause
    exit /b 1
)

set ISCC=
if exist "%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" set ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe
if not defined ISCC if exist "%ProgramFiles%\Inno Setup 6\ISCC.exe" set ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe

if not defined ISCC (
    echo ERROR: Inno Setup 6 was not found.
    echo Install Inno Setup 6, then run this script again.
    pause
    exit /b 1
)

echo Building installer...
"%ISCC%" "installer\IMS_Control_Center.iss"
if errorlevel 1 (
    echo Installer build failed.
    pause
    exit /b 1
)

echo.
echo Installer created in:
echo   installer_output\IMS Control Center Setup.exe
pause
exit /b 0
