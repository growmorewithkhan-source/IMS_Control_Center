IMS CONTROL CENTER - UPDATED REMOTE MANAGEMENT
================================================

START
-----
1. Install Python and pywebview:
   py -m pip install pywebview

2. Put these Microsoft Sysinternals tools in:
   C:\PsTools\
      psshutdown.exe
      PsExec.exe

3. Put your domain computer names in:
   computers.txt

4. Run:
   py main.py

AUTHENTICATION
--------------
The app starts at login.html. Use your real IMS domain account.
The password is kept only in memory for the running session.
It is not written to a file or localStorage.

REMOTE FEATURES
---------------
Shutdown
  Uses PsShutdown with the authenticated IMS account.

Restart
  Uses PsShutdown with the authenticated IMS account.

Start/Stop VNC
  Uses remote Windows Service Control. The app checks the service
  name in vnc_service.txt. Default: tvnserver (TightVNC).
  If your VNC server uses another service name, replace the single
  line in vnc_service.txt.

CMD / PowerShell
  Uses PsExec.exe with the authenticated IMS account.
  PsExec must be present in C:\PsTools\.

Wake on LAN
  Uses a magic packet. Add each PC's MAC address to macs.txt:
    GPULAB-pc01.ims.edu.pk=AA-BB-CC-DD-EE-FF
  The app also tries ARP for PCs that are currently reachable.
  Broadcast delivery depends on the VLAN/network configuration.

Open Website
  Supports All / Single / Selected target PCs. Uses PsExec to launch
  the URL in an interactive user session. A logged-on user/session is
  required on the target for a visible browser window.


Copy Files
  Supports All / Single / Selected target PCs. Copies a local file to
  a remote absolute Windows path using the target's administrative
  drive share (for example C$).
  The authenticated account needs the required administrative rights.

Send Message
  Supports All / Single / Selected target PCs. Uses Windows MSG through
  the authenticated IPC connection.
  A logged-on target session is required for a visible message.

IMPORTANT
---------
These functions require the logged-in IMS account to have the
corresponding Windows/domain permissions on the lab PCs. A valid
login alone does not automatically grant remote-admin rights.

For VNC, CMD, PowerShell, website launch, file copy and messaging,
the target Windows firewall, services, shares and local security
policy must also allow the requested operation.

Do not put a real password in source code, computers.txt, macs.txt,
or vnc_service.txt.
