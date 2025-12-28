from datetime import datetime
import time
import psutil
import win32gui
import win32process
import csv
import os

CSV_FILE = "app_usage_log.csv"
SAVE_INTERVAL = 0.5

#print("Windows app tracker started.")

APP_NAME_MAP = {
    "code.exe": "VS Code",
    "devenv.exe": "Visual Studio",
    "pycharm64.exe": "PyCharm",
    "clion64.exe": "CLion",
    "idea64.exe": "IntelliJ IDEA",
    "webstorm64.exe": "WebStorm",

    "chrome.exe": "Google Chrome",
    "msedge.exe": "Microsoft Edge",
    "firefox.exe": "Mozilla Firefox",
    "brave.exe": "Brave Browser",
    "opera.exe": "Opera Browser",
    "vivaldi.exe": "Vivaldi Browser",

    "explorer.exe": "File Explorer",
    "cmd.exe": "Command Prompt",
    "powershell.exe": "PowerShell",
    "wt.exe": "Windows Terminal",
    "Taskmgr.exe": "Task Manager",
    "OpenWith.exe": "Open With",

    "whatsapp.exe": "WhatsApp Desktop",
    "whatsapp.root.exe": "WhatsApp Desktop",
    "telegram.exe": "Telegram",
    "discord.exe": "Discord",
    "slack.exe": "Slack",
    "teams.exe": "Microsoft Teams",
    "skype.exe": "Skype",
    "SearchApp.exe": "Windows Search",
    
    "notepad.exe": "Notepad",
    "notepad++.exe": "Notepad++",
    "sublime_text.exe": "Sublime Text",
    "atom.exe": "Atom Editor",

    "vlc.exe": "VLC Media Player",
    "spotify.exe": "Spotify",
    "obs64.exe": "OBS Studio",

    "winword.exe": "MS Word",
    "excel.exe": "MS Excel",
    "powerpnt.exe": "MS PowerPoint",
    "onenote.exe": "MS OneNote",

    "git.exe": "Git",
    "githubdesktop.exe": "GitHub Desktop",
    "docker.exe": "Docker",
    "dockerdesktop.exe": "Docker Desktop",
    "postman.exe": "Postman",
    "mongosh.exe": "Mongo Shell",
    "studio64.exe": "Android Studio",

    "steam.exe": "Steam",
    "epicgameslauncher.exe": "Epic Games Launcher",
    "riotclientservices.exe": "Riot Client",
}

def normalize_app_name(process_name):
    return APP_NAME_MAP.get(process_name.lower(), process_name)

def init_csv():
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["app_name", "usage_seconds", "open_count", "log_date"])

def get_active_window_process():
    try:
        hwnd = win32gui.GetForegroundWindow()
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        return normalize_app_name(process.name())
    except Exception:
        return None

def load_existing_data():
    data = {}
    if not os.path.exists(CSV_FILE):
        return data

    with open(CSV_FILE, "r") as file:
        reader = csv.DictReader(file)
        for row in reader:
            key = (row["app_name"], row["log_date"])
            data[key] = {
                "usage_seconds": int(row["usage_seconds"]),
                "open_count": int(row["open_count"])
            }
    return data

def save_to_csv(session_usage, session_opens):
    existing = load_existing_data()
    today = str(datetime.now().date())

    for app, seconds in session_usage.items():
        key = (app, today)
        if key not in existing:
            existing[key] = {"usage_seconds": 0, "open_count": 0}

        existing[key]["usage_seconds"] += int(seconds)
        existing[key]["open_count"] += session_opens.get(app, 0)

    with open(CSV_FILE, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["app_name", "usage_seconds", "open_count", "log_date"])
        for (app, date), values in existing.items():
            writer.writerow([app, values["usage_seconds"], values["open_count"], date])


if __name__ == "__main__":
    init_csv()

    usage_time = {}
    open_count = {}

    active_app = None
    last_switch_time = time.time()
    last_save_time = time.time()

    try:
        while True:
            current_app = get_active_window_process()
            now = time.time()

            if current_app != active_app:
                if active_app:
                    elapsed = now - last_switch_time
                    usage_time[active_app] = usage_time.get(active_app, 0) + elapsed

                if current_app:
                    open_count[current_app] = open_count.get(current_app, 0) + 1

                active_app = current_app
                last_switch_time = now

            if now - last_save_time >= SAVE_INTERVAL:
                if active_app:
                    elapsed = now - last_switch_time
                    usage_time[active_app] = usage_time.get(active_app, 0) + elapsed
                    last_switch_time = now

                save_to_csv(usage_time, open_count)
                usage_time.clear()
                open_count.clear()
                last_save_time = now

            time.sleep(1)

    except KeyboardInterrupt:
        if active_app:
            elapsed = time.time() - last_switch_time
            usage_time[active_app] = usage_time.get(active_app, 0) + elapsed

        save_to_csv(usage_time, open_count)
        #print("\nTracking stopped. Final data saved.")
