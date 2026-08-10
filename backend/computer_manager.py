import os
import subprocess

from app_paths import resource_path


class ComputerManager:
    def __init__(self):
        self.computers = []

    def load(self):
        self.computers.clear()

        file_path = resource_path("computers.txt")

        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                for line in f:
                    name = line.strip()

                    if name and name not in self.computers:
                        self.computers.append(name)

    def total(self):
        return len(self.computers)

    def get_all(self):
        return self.computers

    def online_count(self):
        online = 0

        for pc in self.computers:
            try:
                result = subprocess.run(
                    ["ping", "-n", "1", "-w", "300", pc],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )

                if result.returncode == 0:
                    online += 1

            except:
                pass

        return online

    def offline_count(self):
        return self.total() - self.online_count()

    def network_percentage(self):
        if self.total() == 0:
            return 0

        return round((self.online_count() / self.total()) * 100)

    def shutdown_computer(self, target):
        """
        Shuts down a target computer (hostname or IP address) using Windows shutdown command.
        """
        try:
            result = subprocess.run(
                ["shutdown", "/s", "/m", f"\\\\{target}", "/t", "0"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return {"success": True, "message": f"Successfully sent shutdown signal to {target}"}
            else:
                return {"success": False, "message": result.stderr.strip() or "Shutdown failed. Check network permissions or credentials."}
        except Exception as e:
            return {"success": False, "message": str(e)}