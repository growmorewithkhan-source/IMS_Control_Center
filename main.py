import os
import ctypes
import socket
import webview
import subprocess
import getpass
from pathlib import Path

from app_paths import resource_path

from backend.computer_manager import ComputerManager
from backend.shutdown_manager import handle_shutdown
from backend.action_manager import (
    restart, start_vnc, stop_vnc, wake_on_lan,
    remote_command, open_website, copy_files, send_message
)

# High DPI Fix
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(1)
except:
    pass


class Api:
    def __init__(self):
        self.authenticated = False
        self.auth_username = None
        self.auth_domain = None
        self.auth_password = None

    @staticmethod
    def _domain_options(domain):
        raw = (domain or "").strip()
        low = raw.lower().rstrip(".")

        if low == "ims":
            return ["IMS"]
        if low == "ims.edu.pk":
            return ["IMS", "ims.edu.pk"]
        return [raw] if raw else ["IMS", "ims.edu.pk"]

    def verify_windows_login(self, username, password, domain):
        """
        Validate Windows/AD credentials using the Windows LogonUser API.
        No Active Directory administration console/access is required, but
        the PC must be able to reach a domain controller.
        """
        import ctypes
        from ctypes import wintypes

        username = (username or "").strip()
        password = password or ""
        domain = (domain or "").strip()

        # Clear any previous session before a new attempt.
        self.authenticated = False
        self.auth_username = None
        self.auth_domain = None
        self.auth_password = None

        if not username or not password:
            return False

        if "\\" in username:
            parts = username.split("\\", 1)
            domain = parts[0]
            username = parts[1]

        login_attempts = []
        for d in self._domain_options(domain):
            if "." in d:
                # UPN form plus DOMAIN\user fallback.
                login_attempts.append((f"{username}@{d}", None))
                login_attempts.append((username, "IMS"))
            else:
                login_attempts.append((username, d))

        LOGON32_LOGON_NETWORK = 3
        LOGON32_PROVIDER_DEFAULT = 0

        try:
            advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
            kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

            LogonUserW = advapi32.LogonUserW
            LogonUserW.argtypes = [
                wintypes.LPCWSTR,
                wintypes.LPCWSTR,
                wintypes.LPCWSTR,
                wintypes.DWORD,
                wintypes.DWORD,
                ctypes.POINTER(wintypes.HANDLE)
            ]
            LogonUserW.restype = wintypes.BOOL

            for login_name, login_domain in login_attempts:
                token = wintypes.HANDLE()

                ok = LogonUserW(
                    login_name,
                    login_domain,
                    password,
                    LOGON32_LOGON_NETWORK,
                    LOGON32_PROVIDER_DEFAULT,
                    ctypes.byref(token)
                )

                if ok:
                    kernel32.CloseHandle(token)

                    self.authenticated = True
                    self.auth_username = username
                    self.auth_domain = login_domain or domain
                    self.auth_password = password
                    return True

            return False

        except Exception as e:
            print(f"Windows authentication error: {e}")
            return False

    def logout(self):
        self.authenticated = False
        self.auth_username = None
        self.auth_domain = None
        self.auth_password = None
        return True

    def is_authenticated(self):
        return self._authorized()

    def get_current_system_user(self):
        try:
            hostname = socket.gethostname()
            try:
                current_user = os.getlogin()
            except:
                current_user = getpass.getuser()
            return f"{hostname} \\ {current_user}"
        except Exception as e:
            print(f"Error fetching system user: {e}")
            return "UNKNOWN \\ User"

    def test(self):
        try:
            manager = ComputerManager()
            manager.load()
            return {
                "total": manager.total(),
                "online": manager.online_count(),
                "offline": manager.offline_count(),
                "network": manager.network_percentage()
            }
        except Exception as e:
            print(f"Error in test: {e}")
            return {"total": 0, "online": 0, "offline": 0, "network": 0}

    def get_total_computers(self):
        try:
            manager = ComputerManager()
            manager.load()
            return manager.total()
        except:
            return 0

    def get_online_computers(self):
        try:
            manager = ComputerManager()
            manager.load()
            return manager.online_count()
        except:
            return 0

    def get_offline_computers(self):
        try:
            manager = ComputerManager()
            manager.load()
            return manager.offline_count()
        except:
            return 0

    def get_network_percentage(self):
        try:
            manager = ComputerManager()
            manager.load()
            return manager.network_percentage()
        except:
            return 0

    def get_lab_network(self):
        try:
            ip = socket.gethostbyname(socket.gethostname())
            return ip
        except:
            return "Not Connected"

    def get_all_computers(self):
        try:
            manager = ComputerManager()
            manager.load()
            computers_data = []

            for pc_name_or_ip in manager.computers:
                name_str = str(pc_name_or_ip).strip()

                try:
                    res = subprocess.run(
                        ["ping", "-n", "1", "-w", "300", name_str],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                    is_online = (res.returncode == 0)
                except:
                    is_online = False

                ip_address = name_str
                try:
                    resolved_ip = socket.gethostbyname(name_str)
                    ip_address = resolved_ip
                except:
                    pass

                computers_data.append({
                    "name": name_str,
                    "ip": ip_address,
                    "status": "Online" if is_online else "Offline"
                })

            return computers_data

        except Exception as e:
            print(f"Error fetching computers: {e}")
            return []

    def _authorized(self):
        return self.authenticated and bool(self.auth_username) and bool(self.auth_password)

    def _action(self, fn, data):
        if not self._authorized():
            return {
                "success": False,
                "message": "Access Denied. Please sign in with a valid IMS domain account."
            }
        manager = ComputerManager()
        manager.load()
        try:
            return fn(
                data or {},
                self.auth_username,
                self.auth_password,
                self.auth_domain or "IMS",
                manager.computers
            )
        except Exception as exc:
            return {"success": False, "message": str(exc)}

    def restart_computer(self, data):
        return self._action(restart, data)

    def start_vnc(self, data):
        return self._action(start_vnc, data)

    def stop_vnc(self, data):
        return self._action(stop_vnc, data)

    def wake_on_lan(self, data):
        # WOL itself does not need credentials, but keep it behind the
        # authenticated application session for consistency.
        if not self._authorized():
            return {"success": False, "message": "Access Denied. Please sign in first."}
        manager = ComputerManager()
        manager.load()
        try:
            return wake_on_lan(
                data or {},
                self.auth_username,
                self.auth_password,
                self.auth_domain or "IMS",
                manager.computers
            )
        except Exception as exc:
            return {"success": False, "message": str(exc)}

    def execute_cmd(self, data):
        return self._action(lambda d,u,p,dom,pcs: remote_command(d,u,p,dom,pcs,"cmd"), data)

    def execute_powershell(self, data):
        return self._action(lambda d,u,p,dom,pcs: remote_command(d,u,p,dom,pcs,"powershell"), data)

    def open_website(self, data):
        return self._action(open_website, data)

    def copy_files(self, data):
        return self._action(copy_files, data)

    def send_message(self, data):
        return self._action(send_message, data)

    def shutdown_computer(self, data):
        # Backend authorization: frontend/localStorage alone cannot bypass this.
        if not self.authenticated:
            return {
                "success": False,
                "message": "Access Denied. Please sign in with a valid IMS domain account."
            }

        try:
            return handle_shutdown(
                data,
                username=self.auth_username,
                password=self.auth_password,
                domain=self.auth_domain or "IMS"
            )
        except Exception as e:
            return {"success": False, "message": str(e)}


html_file = resource_path("login.html")

api_instance = Api()
webview.create_window(
    'IMS Control Center',
    html_file.as_uri(),
    js_api=api_instance, 
    width=1280, 
    height=720, 
    min_size=(1024, 680)
)

webview.start()