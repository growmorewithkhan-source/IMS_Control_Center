IMS Control Center - Updated

What is included
- Domain login using Windows LogonUser (IMS / ims / ims.edu.pk accepted)
- Backend authorization for every remote-control action
- Shutdown / Restart
- Start / Stop VNC service
- Wake-on-LAN
- Remote CMD / PowerShell
- Open website remotely
- Copy files to remote Windows paths
- Send message
- Computer monitoring
- 35 GPULAB computers already listed in computers.txt

IMPORTANT
The software cannot make remote administration work by code alone. The network and target PCs must permit the requested operation.

Required on the control PC:
1. Python + pywebview.
2. C:\PsTools\psshutdown.exe
3. C:\PsTools\PsExec.exe for Restart/VNC/CMD/PowerShell/Website.
4. The logged-in IMS account must have administrator rights on the target PCs.
5. Windows Firewall / Remote Service Management / Admin Shares / RPC must allow the required traffic.

VNC:
- vnc_service.txt currently contains: tvnserver
- Change it to the actual VNC Windows service name used in the lab if different.

Wake-on-LAN:
- macs.txt must contain each PC's real MAC address, for example:
  GPULAB-pc01.ims.edu.pk=AA-BB-CC-DD-EE-FF
- Default lab broadcast is 172.16.7.255.
- WOL also depends on BIOS/UEFI and NIC Wake-on-LAN settings.

Computer list:
computers.txt contains GPULAB-pc01 through GPULAB-pc35.

Security:
- The password is kept only in memory during the running application session.
- It is not written to localStorage, sessionStorage, or a project file.
- Remote actions are checked by the Python backend, so changing browser/localStorage values cannot authorize an action.

Run:
py main.py
