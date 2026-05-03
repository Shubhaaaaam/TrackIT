from datetime import datetime,timedelta
import time
import psutil
import win32gui
import win32process
import csv
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USAGE_DIR = os.path.join(BASE_DIR, "usage")
os.makedirs(USAGE_DIR, exist_ok=True)

GLOBAL_CSV = os.path.join(USAGE_DIR, "global.csv")

SAVE_INTERVAL = 1
APP_NAME_MAP = {
    "code.exe": "VS Code", "devenv.exe": "Visual Studio", "pycharm64.exe": "PyCharm", "clion64.exe": "CLion", "idea64.exe": "IntelliJ IDEA", 
    "webstorm64.exe": "WebStorm", "chrome.exe": "Google Chrome", "msedge.exe": "Microsoft Edge", "firefox.exe": "Mozilla Firefox", 
    "brave.exe": "Brave Browser", "opera.exe": "Opera Browser", "whatsapp.exe": "WhatsApp Desktop", "whatsapp.root.exe": "WhatsApp Desktop", 
    "telegram.exe": "Telegram", "discord.exe": "Discord", "slack.exe": "Slack", "teams.exe": "Microsoft Teams", "skype.exe": "Skype", 
    "spotify.exe": "Spotify", "vlc.exe": "VLC Media Player", "itunes.exe": "iTunes", "obs64.exe": "OBS Studio", "sharex.exe": "ShareX", 
    "lockapp.exe": "Lock Screen", "searchapp.exe": "Windows Search", "taskmgr.exe": "Task Manager", "explorer.exe": "File Explorer", 
    "winword.exe": "Microsoft Word", "powerpnt.exe": "Microsoft PowerPoint", "excel.exe": "Microsoft Excel", "onenote.exe": "Microsoft OneNote", 
    "outlook.exe": "Microsoft Outlook", "startmenuexperiencehost.exe": "Start Menu", "shellexperiencehost.exe": "Windows Shell Experience", 
    "ciscocollabhost.exe": "Cisco Collaboration Host", "applicationframehost.exe": "Application Frame Host", "pickerhost.exe": "Picker Host", 
    "credentialuibroker.exe": "Credential UI Broker", "dwm.exe": "Desktop Window Manager", "conhost.exe": "Console Window Host", 
    "rundll32.exe": "Windows DLL Host", "werfault.exe": "Windows Error Reporting", "cmd.exe": "Command Prompt", "powershell.exe": "PowerShell", 
    "wsl.exe": "Windows Subsystem for Linux", "wslsettings.exe": "WSL Settings", "ubuntu.exe": "Ubuntu (WSL)", "bash.exe": "Bash Shell", 
    "cleanmgr.exe": "Disk Cleanup", "dfrgui.exe": "Disk Defragmenter", "snippingtool.exe": "Snipping Tool", "mspaint.exe": "Paint", 
    "notepad.exe": "Notepad", "notepad++.exe": "Notepad++", "photos.exe": "Photos", "paintdotnet.exe": "Paint.NET", 
    "githubdesktop.exe": "GitHub Desktop", "git-credential-manager.exe": "Git Credential Manager", "gitkraken.exe": "GitKraken", 
    "sourcetree.exe": "SourceTree", "docker desktop.exe": "Docker Desktop", "docker desktop installer.exe": "Docker Installer", 
    "postman.exe": "Postman", "insomnia.exe": "Insomnia", "winrar.exe": "WinRAR", "7zfm.exe": "7-Zip", "7z.exe": "7-Zip CLI", 
    "openwith.exe": "Open With", "msrdc.exe": "Remote Desktop", "anydesk.exe": "AnyDesk", "teamviewer.exe": "TeamViewer", 
    "zoom.exe": "Zoom", "chrome_proxy.exe": "Chrome Proxy", "adb.exe": "Android Debug Bridge", "androidstudio64.exe": "Android Studio", 
    "eclipse.exe": "Eclipse IDE", "netbeans64.exe": "NetBeans", "xampp-control.exe": "XAMPP Control Panel", "mysqlworkbench.exe": "MySQL Workbench", 
    "pgadmin4.exe": "pgAdmin 4", "redis-desktop-manager.exe": "Redis Desktop Manager", "mongodbcompass.exe": "MongoDB Compass"
}

IGNORE_APPS = {
    "lock screen",
    "windows search",
    "task manager",
    "file explorer",
    "open with",
    "windows shell",
    "cortana"
}

def normalize_app_name(process_name):
    return APP_NAME_MAP.get(process_name.lower(), process_name)

def get_weekday_csv():
    day = datetime.now().strftime("%A").lower()
    if day == "sunday":
        for file in os.listdir(USAGE_DIR):
            if file.endswith(".csv") and not file.startswith("global"):
                os.remove(os.path.join(USAGE_DIR, file))
    return os.path.join(USAGE_DIR, f"{day}.csv"), day

def init_csv(path, header):
    if not os.path.exists(path):
        with open(path, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(header)

def get_active_window_process():
    try:
        hwnd = win32gui.GetForegroundWindow()
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)

        app = normalize_app_name(process.name())
        if app.lower() in IGNORE_APPS:
            return None

        return app
    except Exception:
        return None

def load_existing(path, key_field):
    data = {}
    if not os.path.exists(path):
        return data

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            data[row[key_field]] = {
                "usage_seconds": int(row["usage_seconds"]),
                "open_count": int(row["open_count"])
            }
    return data

def save_csv(path, key_name, usage, opens, label):
    existing = load_existing(path, key_name)

    for app, seconds in usage.items():
        if app not in existing:
            existing[app] = {"usage_seconds": 0, "open_count": 0}

        existing[app]["usage_seconds"] += int(seconds)
        existing[app]["open_count"] += opens.get(app, 0)

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([key_name, "usage_seconds", "open_count", label])
        for app, v in existing.items():
            writer.writerow([app, v["usage_seconds"], v["open_count"], label])

if __name__ == "__main__":
    day_csv, current_day = get_weekday_csv()

    init_csv(day_csv, ["app_name", "usage_seconds", "open_count", "day"])
    init_csv(GLOBAL_CSV, ["app_name", "usage_seconds", "open_count", "scope"])

    usage_time = {}
    open_count = {}

    active_app = None
    last_switch = time.time()
    last_save = time.time()

    try:
        while True:
            now = time.time()
            new_csv, new_day = get_weekday_csv()

            if new_day != current_day:
                day_csv = new_csv
                current_day = new_day
                init_csv(day_csv, ["app_name", "usage_seconds", "open_count", "day"])

            current_app = get_active_window_process()

            if current_app and current_app != active_app:
                if active_app:
                    usage_time[active_app] = usage_time.get(active_app, 0) + (now - last_switch)

                open_count[current_app] = open_count.get(current_app, 0) + 1
                active_app = current_app
                last_switch = now

            if now - last_save >= SAVE_INTERVAL:
                if active_app:
                    usage_time[active_app] = usage_time.get(active_app, 0) + (now - last_switch)
                    last_switch = now

                save_csv(day_csv, "app_name", usage_time, open_count, current_day)
                save_csv(GLOBAL_CSV, "app_name", usage_time, open_count, "global")

                usage_time.clear()
                open_count.clear()
                last_save = now

            time.sleep(1)

    except KeyboardInterrupt:
        if active_app:
            usage_time[active_app] = usage_time.get(active_app, 0) + (time.time() - last_switch)

        save_csv(day_csv, "app_name", usage_time, open_count, current_day)
        save_csv(GLOBAL_CSV, "app_name", usage_time, open_count, "global")
