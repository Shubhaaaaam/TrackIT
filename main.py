import time
import psutil
import win32gui
import win32process
from datetime import datetime

SUMMARY_FILE = "applog.txt"

def get_active_window_process():
    try:
        hwnd = win32gui.GetForegroundWindow()
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        return process.name().lower()
    except Exception:
        return None

def save_summary(usage_dict):
    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        f.write(f"Application Usage Summary ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})\n")
        f.write("=" * 50 + "\n")
        for app, seconds in usage_dict.items():
            mins, secs = divmod(int(seconds), 60)
            hours, mins = divmod(mins, 60)
            f.write(f"{app}: {hours}h {mins}m {secs}s\n")

if __name__ == "__main__":
    usage_times = {}
    active_app = None
    start_time = None

    print("Tracking app usage... Press Ctrl+C to stop.")
    try:
        while True:
            current_app = get_active_window_process()
            if current_app != active_app:
                if active_app and start_time:
                    elapsed = time.time() - start_time
                    usage_times[active_app] = usage_times.get(active_app, 0) + elapsed
                active_app = current_app
                start_time = time.time()
            time.sleep(1)
    except KeyboardInterrupt:
        if active_app and start_time:
            elapsed = time.time() - start_time
            usage_times[active_app] = usage_times.get(active_app, 0) + elapsed
        save_summary(usage_times)
        print(f"\nUsage summary saved to '{SUMMARY_FILE}'.")
