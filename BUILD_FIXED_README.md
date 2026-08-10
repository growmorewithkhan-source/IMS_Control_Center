# IMS Control Center - Fixed Windows Build

This version fixes the installed EXE `ERR_FILE_NOT_FOUND` problem by building a PyInstaller **onedir** application. `login.html`, `index.html`, `static/`, `js/`, the logo, and configuration files are placed beside the EXE in the installed application directory.

## GitHub
Replace these files in the repository:

- `app_paths.py`
- `IMS_Control_Center.spec`
- `installer/IMS_Control_Center.iss`
- `.github/workflows/build-windows.yml`

Then commit the changes and run **Actions → Build Windows Installer → Run workflow**.

The artifact is:

`IMS-Control-Center-Installer` → `IMS Control Center Setup.exe`

## Important
The application still expects the Windows-specific PsTools executables used by the original project. Keep those available according to your organization's IT/licensing policy.
