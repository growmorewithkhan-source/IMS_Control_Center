# IMS Control Center — Windows EXE + Installer

## What this package does

This project is prepared for a normal Windows installation workflow:

1. PyInstaller builds `IMS Control Center.exe`.
2. Inno Setup packages the PyInstaller folder into `IMS Control Center Setup.exe`.
3. The installer creates Start Menu and optional Desktop shortcuts and an uninstaller.
4. HTML/CSS/JS files and application configuration files are bundled with the application.

## Build on Windows

Use Windows 10/11.

### 1. Install Python

Recommended: Python 3.11 or 3.12, 64-bit.

During installation, enable **Add Python to PATH**.

### 2. Install Inno Setup 6

Install Inno Setup 6 from its official website.

### 3. Build the application

Double-click:

`build_windows.bat`

The EXE will be created at:

`dist\IMS Control Center\IMS Control Center.exe`

### 4. Build the installer

Double-click:

`installer\make_installer.bat`

The final installer will be:

`installer_output\IMS Control Center Setup.exe`

## PsTools requirement

The current application intentionally continues to use the existing external PsTools dependency:

- `C:\PsTools\PsExec.exe`
- `C:\PsTools\psshutdown.exe`

Do not place passwords or credentials into the installer script.

Install/obtain the required Microsoft Sysinternals tools according to their licensing and your organization's policy.

## Important deployment note

The installer does not automatically install or redistribute PsExec/PsShutdown. This avoids silently bundling third-party administrative tools without your approval.

## Application data

These files are bundled next to the installed EXE:

- `computers.txt`
- `macs.txt`
- `vnc_service.txt`
- `ims_logo.png`
- `login.html`
- `index.html`
- `static\`
- `js\`

Because they are external files, an administrator can update the computer list/MAC list/service name without rebuilding the Python executable.

## WebView2

The application uses pywebview. On modern Windows systems, the Microsoft Edge WebView2 Runtime should be installed. If the target PC does not have a compatible WebView2 runtime, install Microsoft's WebView2 Runtime before launching the application.

## Important security note

The EXE is a package, not a security boundary. The application still keeps the authenticated password in process memory because the existing remote-control commands require credentials. Do not hard-code an IMS password into the source or EXE.
