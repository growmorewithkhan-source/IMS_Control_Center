import os
import re
import socket
import subprocess
import shutil
import time
from pathlib import Path

from app_paths import resource_path

PSTOOLS_DIR = r"C:\PsTools"
PSSHUTDOWN = os.path.join(PSTOOLS_DIR, "psshutdown.exe")
PSEXEC = os.path.join(PSTOOLS_DIR, "PsExec.exe")

VNC_SERVICE_FILE = resource_path("vnc_service.txt")
MACS_FILE = resource_path("macs.txt")


def _normalize_domain(domain):
    raw = (domain or "").strip().strip(".")
    if raw.lower() in ("", "ims", "ims.edu.pk"):
        return "IMS"
    return raw


def _account(username, domain):
    username = (username or "").strip()
    if "\\" in username:
        return username
    return f"{_normalize_domain(domain)}\\{username}"


def _targets(data, computers=None):
    values = data.get("targets", []) if isinstance(data, dict) else []
    values = values if isinstance(values, list) else [values]

    if any(str(v).strip().upper() == "ALL" for v in values):
        return list(computers or [])

    result = []
    for value in values:
        value = str(value).strip()
        if value and value.upper() != "ALL" and value not in result:
            result.append(value)
    return result


def _require_psexec():
    if not os.path.exists(PSEXEC):
        return (False, r"PsExec.exe not found. Put Microsoft Sysinternals PsExec.exe in C:\PsTools\.")
    return (True, "")


def _run(command, timeout=30):
    try:
        return subprocess.run(command, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None
    except Exception as exc:
        return exc


def restart(data, username, password, domain, computers):
    if not username or not password:
        return {"success": False, "message": "Access Denied. Please sign in first."}
    if not os.path.exists(PSSHUTDOWN):
        return {"success": False, "message": r"psshutdown.exe not found in C:\PsTools\."}

    targets = _targets(data, computers)
    if not targets:
        return {"success": False, "message": "No computer was selected."}

    delay = max(0, int(data.get("delay", 0))) if isinstance(data, dict) else 0
    force = bool(data.get("force", True)) if isinstance(data, dict) else True
    account = _account(username, domain)
    results = []

    for target in targets:
        cmd = [
            PSSHUTDOWN, f"\\\\{target}", "-r", "-t", str(delay),
            "-u", account, "-p", password, "-accepteula"
        ]
        if force:
            cmd.append("-f")
        result = _run(cmd)
        if result is None:
            results.append({"target": target, "success": False, "message": "Request timed out."})
        elif isinstance(result, Exception):
            results.append({"target": target, "success": False, "message": str(result)})
        elif result.returncode == 0:
            results.append({"target": target, "success": True, "message": "Restart command sent."})
        else:
            msg = (result.stderr or result.stdout or "Restart failed.").strip()
            results.append({"target": target, "success": False, "message": msg})

    ok = sum(x["success"] for x in results)
    return {
        "success": ok == len(results),
        "message": f"Restart completed: {ok} successful, {len(results)-ok} failed.",
        "details": results
    }


def remote_command(data, username, password, domain, computers, shell="cmd"):
    if not username or not password:
        return {"success": False, "message": "Access Denied. Please sign in first."}
    good, msg = _require_psexec()
    if not good:
        return {"success": False, "message": msg}

    command = str(data.get("command", "")).strip() if isinstance(data, dict) else ""
    if not command:
        return {"success": False, "message": "No command was entered."}

    targets = _targets(data, computers)
    if not targets:
        return {"success": False, "message": "No computer was selected."}

    account = _account(username, domain)
    results = []

    for target in targets:
        if shell == "powershell":
            executable = "powershell.exe"
            args = ["-NoProfile", "-NonInteractive", "-Command", command]
        else:
            executable = "cmd.exe"
            args = ["/c", command]

        cmd = [
            PSEXEC, f"\\\\{target}", "-u", account, "-p", password,
            "-h", "-nobanner", "-accepteula", executable
        ] + args

        result = _run(cmd, timeout=60)
        if result is None:
            results.append({"target": target, "success": False, "message": "Request timed out."})
        elif isinstance(result, Exception):
            results.append({"target": target, "success": False, "message": str(result)})
        else:
            output = (result.stdout or result.stderr or "").strip()
            results.append({
                "target": target,
                "success": result.returncode == 0,
                "message": output[:2000] if output else ("Command completed." if result.returncode == 0 else "Command failed.")
            })

    ok = sum(x["success"] for x in results)
    return {
        "success": ok == len(results),
        "message": f"{shell.upper()} execution: {ok} successful, {len(results)-ok} failed.",
        "details": results
    }


def _service_names():
    try:
        name = VNC_SERVICE_FILE.read_text(encoding="utf-8").strip()
        if name:
            return [name]
    except Exception:
        pass
    return ["tvnserver", "uvnc_service", "WinVNC4"]


def _net_use(target, account, password):
    share = f"\\\\{target}\\IPC$"
    result = _run(["net", "use", share, password, f"/user:{account}", "/persistent:no"], timeout=20)
    if isinstance(result, Exception) or result is None:
        return False
    return result.returncode == 0


def _net_delete(target):
    share = f"\\\\{target}\\IPC$"
    _run(["net", "use", share, "/delete", "/y"], timeout=15)


def _service_action(data, username, password, domain, computers, action):
    if not username or not password:
        return {"success": False, "message": "Access Denied. Please sign in first."}
    targets = _targets(data, computers)
    if not targets:
        return {"success": False, "message": "No computer was selected."}

    account = _account(username, domain)
    results = []

    for target in targets:
        connected = _net_use(target, account, password)
        if not connected:
            results.append({"target": target, "success": False, "message": "Could not authenticate to the remote computer."})
            continue

        found = None
        try:
            for service in _service_names():
                query = _run(["sc", f"\\\\{target}", "query", service], timeout=15)
                if query is not None and not isinstance(query, Exception) and query.returncode == 0:
                    found = service
                    break

            if not found:
                results.append({
                    "target": target,
                    "success": False,
                    "message": "No supported VNC service found. Set the service name in vnc_service.txt."
                })
                continue

            result = _run(["sc", f"\\\\{target}", action, found], timeout=20)
            ok = result is not None and not isinstance(result, Exception) and result.returncode == 0
            text = ""
            if result is not None and not isinstance(result, Exception):
                text = (result.stdout or result.stderr or "").strip()

            results.append({
                "target": target,
                "success": ok,
                "message": text or (f"{action.title()} command sent to {found}." if ok else f"Could not {action} {found}.")
            })
        finally:
            _net_delete(target)

    ok = sum(x["success"] for x in results)
    return {
        "success": ok == len(results),
        "message": f"VNC {action}: {ok} successful, {len(results)-ok} failed.",
        "details": results
    }


def start_vnc(data, username, password, domain, computers):
    return _service_action(data, username, password, domain, computers, "start")


def stop_vnc(data, username, password, domain, computers):
    return _service_action(data, username, password, domain, computers, "stop")


def _read_mac_file():
    mapping = {}
    if not MACS_FILE.exists():
        return mapping
    try:
        for line in MACS_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            mapping[key.strip().lower()] = value.strip()
    except Exception:
        pass
    return mapping


def _normalize_mac(mac):
    hexchars = re.sub(r"[^0-9A-Fa-f]", "", mac or "")
    if len(hexchars) != 12:
        return None
    return ":".join(hexchars[i:i+2] for i in range(0, 12, 2)).lower()


def _mac_from_arp(target):
    try:
        ip = socket.gethostbyname(target)
        result = _run(["arp", "-a", ip], timeout=10)
        if result is None or isinstance(result, Exception):
            return None
        for token in (result.stdout or "").split():
            mac = _normalize_mac(token)
            if mac:
                return mac
    except Exception:
        pass
    return None


def _send_magic_packet(mac, broadcast="255.255.255.255"):
    mac_bytes = bytes.fromhex(mac.replace(":", ""))
    packet = b"\xff" * 6 + mac_bytes * 16
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.sendto(packet, (broadcast, 9))
    finally:
        sock.close()


def wake_on_lan(data, username, password, domain, computers):
    # WOL does not require an active target session, but MAC addresses do.
    targets = _targets(data, computers)
    if not targets:
        return {"success": False, "message": "No computer was selected."}

    macs = _read_mac_file()
    broadcast = str(data.get("broadcast", "172.16.7.255")).strip() if isinstance(data, dict) else "172.16.7.255"
    results = []

    for target in targets:
        mac = _normalize_mac(macs.get(target.lower(), "")) or _mac_from_arp(target)
        if not mac:
            results.append({
                "target": target,
                "success": False,
                "message": "MAC address not found. Add it to macs.txt as hostname=MAC."
            })
            continue
        try:
            _send_magic_packet(mac, broadcast)
            results.append({"target": target, "success": True, "message": f"WOL packet sent to {mac}."})
        except Exception as exc:
            results.append({"target": target, "success": False, "message": str(exc)})

    ok = sum(x["success"] for x in results)
    return {
        "success": ok == len(results),
        "message": f"Wake-on-LAN: {ok} successful, {len(results)-ok} failed.",
        "details": results
    }


def open_website(data, username, password, domain, computers):
    if not username or not password:
        return {"success": False, "message": "Access Denied. Please sign in first."}
    good, msg = _require_psexec()
    if not good:
        return {"success": False, "message": msg}

    url = str(data.get("url", "")).strip() if isinstance(data, dict) else ""
    if not re.match(r"^https?://", url, re.I):
        return {"success": False, "message": "URL must start with http:// or https://."}

    targets = _targets(data, computers)
    if not targets:
        return {"success": False, "message": "No computer was selected."}

    account = _account(username, domain)
    results = []

    for target in targets:
        # PsExec -i uses the specified interactive session. Session 1 is common,
        # but not universal, so first try to discover a logged-on session.
        session_id = "1"
        try:
            q = _run(["quser", f"/server:{target}"], timeout=15)
            if q is not None and not isinstance(q, Exception):
                for line in (q.stdout or "").splitlines()[1:]:
                    m = re.search(r"\s+(\d+)\s+(?:Active|Disc)\s+", line, re.I)
                    if m:
                        session_id = m.group(1)
                        break
        except Exception:
            pass

        cmd = [
            PSEXEC, f"\\\\{target}", "-u", account, "-p", password,
            "-h", "-i", session_id, "-d", "-nobanner", "-accepteula",
            "cmd.exe", "/c", "start", '""', url
        ]
        result = _run(cmd, timeout=30)
        ok = result is not None and not isinstance(result, Exception) and result.returncode == 0
        results.append({
            "target": target,
            "success": ok,
            "message": "Website launch sent." if ok else ((result.stderr or result.stdout or "Could not launch website.").strip() if result is not None and not isinstance(result, Exception) else "Request failed.")
        })

    ok = sum(x["success"] for x in results)
    return {
        "success": ok == len(results),
        "message": f"Website launch: {ok} successful, {len(results)-ok} failed.",
        "details": results
    }


def copy_files(data, username, password, domain, computers):
    if not username or not password:
        return {"success": False, "message": "Access Denied. Please sign in first."}

    source = str(data.get("source", "")).strip() if isinstance(data, dict) else ""
    dest = str(data.get("dest", "")).strip() if isinstance(data, dict) else ""
    if not source or not dest:
        return {"success": False, "message": "Source and destination are required."}
    if not os.path.isfile(source):
        return {"success": False, "message": f"Source file not found: {source}"}

    targets = _targets(data, computers)
    if not targets:
        return {"success": False, "message": "No computer was selected."}

    account = _account(username, domain)
    results = []

    # Destination is a Windows path on each target, e.g.
    # C:\Users\Public\Desktop -> \\TARGET\C$\Users\Public\Desktop
    drive_match = re.match(r"^([A-Za-z]):[\\/](.*)$", dest)
    if not drive_match:
        return {"success": False, "message": "Destination must be an absolute Windows path such as C:\\Users\\Public\\Desktop."}

    drive = drive_match.group(1).upper()
    relative = drive_match.group(2).replace("/", "\\")
    for target in targets:
        connected = _net_use(target, account, password)
        if not connected:
            results.append({"target": target, "success": False, "message": "Could not authenticate to the remote computer."})
            continue
        try:
            remote_dir = rf"\\{target}\{drive}$\{relative}"
            os.makedirs(remote_dir, exist_ok=True)
            dest_file = os.path.join(remote_dir, os.path.basename(source))
            shutil.copy2(source, dest_file)
            results.append({"target": target, "success": True, "message": f"Copied to {dest_file}"})
        except Exception as exc:
            results.append({"target": target, "success": False, "message": str(exc)})
        finally:
            _net_delete(target)

    ok = sum(x["success"] for x in results)
    return {
        "success": ok == len(results),
        "message": f"File copy: {ok} successful, {len(results)-ok} failed.",
        "details": results
    }


def send_message(data, username, password, domain, computers):
    if not username or not password:
        return {"success": False, "message": "Access Denied. Please sign in first."}

    message = str(data.get("message", "")).strip() if isinstance(data, dict) else ""
    if not message:
        return {"success": False, "message": "Message is required."}

    targets = _targets(data, computers)
    if not targets:
        return {"success": False, "message": "No computer was selected."}

    account = _account(username, domain)
    results = []

    for target in targets:
        connected = _net_use(target, account, password)
        if not connected:
            results.append({"target": target, "success": False, "message": "Could not authenticate to the remote computer."})
            continue
        try:
            # MSG /SERVER uses the authenticated IPC$ connection.
            result = _run(["msg", "*", "/SERVER:" + target, message], timeout=20)
            ok = result is not None and not isinstance(result, Exception) and result.returncode == 0
            text = ""
            if result is not None and not isinstance(result, Exception):
                text = (result.stdout or result.stderr or "").strip()
            results.append({"target": target, "success": ok, "message": text or ("Message sent." if ok else "Could not send message.")})
        finally:
            _net_delete(target)

    ok = sum(x["success"] for x in results)
    return {
        "success": ok == len(results),
        "message": f"Message sending: {ok} successful, {len(results)-ok} failed.",
        "details": results
    }
