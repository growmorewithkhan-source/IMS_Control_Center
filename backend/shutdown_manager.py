import os
import subprocess


PSTOOLS_PATH = r"C:\PsTools\psshutdown.exe"


def _normalize_domain(domain):
    raw = (domain or "").strip().strip(".")
    if not raw:
        return "IMS"
    if raw.lower() in ("ims", "ims.edu.pk"):
        return "IMS"
    return raw


def handle_shutdown(data, username, password, domain="IMS"):
    """
    Send a remote shutdown command using the credentials that were
    successfully authenticated by the login screen.

    data:
        {"targets": ["GPULAB-pc01.ims.edu.pk"], "delay": 0, "force": True}

    The password is kept in memory only for the current application session;
    it is not written to a file.
    """
    try:
        if not username or not password:
            return {
                "success": False,
                "message": "Access Denied. No authenticated credentials are available."
            }

        targets = data.get("targets", []) if isinstance(data, dict) else []
        delay = int(data.get("delay", 0)) if isinstance(data, dict) else 0
        force = bool(data.get("force", True)) if isinstance(data, dict) else True

        if not targets:
            return {"success": False, "message": "No computer was selected."}

        if not os.path.exists(PSTOOLS_PATH):
            return {
                "success": False,
                "message": r"psshutdown.exe not found. Put PsShutdown in C:\PsTools\."
            }

        domain_name = _normalize_domain(domain)
        account = f"{domain_name}\\{username}"

        manager_targets = targets
        if any(str(t).strip().upper() == "ALL" for t in targets):
            from backend.computer_manager import ComputerManager
            manager = ComputerManager()
            manager.load()
            manager_targets = manager.computers

        results = []

        for target in manager_targets:
            target = str(target).strip()
            if not target:
                continue

            cmd = [
                PSTOOLS_PATH,
                f"\\\\{target}",
                "-s",
                "-t", str(max(0, delay)),
                "-u", account,
                "-p", password,
                "-accepteula"
            ]

            if force:
                cmd.append("-f")

            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                if result.returncode == 0:
                    results.append({
                        "target": target,
                        "success": True,
                        "message": f"Shutdown command sent to {target}"
                    })
                else:
                    error = (result.stderr or result.stdout or "Shutdown failed.").strip()
                    results.append({
                        "target": target,
                        "success": False,
                        "message": error
                    })

            except subprocess.TimeoutExpired:
                results.append({
                    "target": target,
                    "success": False,
                    "message": "Shutdown request timed out."
                })
            except Exception as exc:
                results.append({
                    "target": target,
                    "success": False,
                    "message": str(exc)
                })

        successful = sum(1 for item in results if item["success"])
        failed = len(results) - successful

        return {
            "success": successful > 0 and failed == 0,
            "message": f"Shutdown completed: {successful} successful, {failed} failed.",
            "details": results
        }

    except Exception as exc:
        return {"success": False, "message": str(exc)}
