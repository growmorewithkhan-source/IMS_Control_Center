# IMS Control Center — Online Windows EXE/Installer Build

This project is configured to build on GitHub's Windows runner. You do not need Windows, Python, PyInstaller, or Inno Setup installed on your own computer.

## What you will get

The GitHub Actions job produces:

- **IMS Control Center Setup.exe** — the normal Windows installer you can double-click.
- **IMS-Control-Center-Portable** — the unpacked application folder for testing.

## How to build online

1. Create/sign in to a GitHub account.
2. Create a new repository, for example `ims-control-center`.
3. Upload **all files and folders from this project** while keeping the folder structure.
4. Open the repository's **Actions** tab.
5. Select **Build Windows Installer**.
6. Click **Run workflow**.
7. Wait for the Windows build to finish.
8. Open the completed workflow run and scroll to **Artifacts**.
9. Download **IMS-Control-Center-Installer**.
10. Extract the downloaded artifact. Inside it is:

   `IMS Control Center Setup.exe`

Double-click that setup file on a Windows PC to install the application.

## Important

The application still expects these third-party Sysinternals tools on the target machine:

`C:\PsTools\PsExec.exe`

`C:\PsTools\psshutdown.exe`

The installer does not bundle them. Provide/install them separately according to your organization's licensing and IT policy.
