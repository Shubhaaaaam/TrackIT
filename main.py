from datetime import datetime
import time
import psutil
import win32gui
import win32process
import psycopg2

DB_NAME = "TrackIT"
DB_USER = "postgres"
DB_PASSWORD = "1111"
DB_HOST = "localhost"
DB_PORT = "5433"

TABLE_NAME = "app_usage_log"
SAVE_INTERVAL = 30

print("Windows app tracker started.")

APP_NAME_MAP = {
    "code.exe": "VS Code",
    "brave.exe": "Brave Browser",
    "devenv.exe": "Visual Studio",
    "whatsapp.root.exe": "WhatsApp Desktop",
    "pycharm64.exe": "PyCharm",
    "clion64.exe": "CLion",
    "idea64.exe": "IntelliJ IDEA",
    "webstorm64.exe": "WebStorm",
    "notepad.exe": "Notepad",
    "notepad++.exe": "Notepad++",
    "sublime_text.exe": "Sublime Text",
    "atom.exe": "Atom Editor",
    "chrome.exe": "Google Chrome",
    "msedge.exe": "Microsoft Edge",
    "firefox.exe": "Mozilla Firefox",
    "opera.exe": "Opera Browser",
    "brave.exe": "Brave Browser",
    "vivaldi.exe": "Vivaldi Browser",
    "cmd.exe": "Command Prompt",
    "powershell.exe": "PowerShell",
    "wt.exe": "Windows Terminal",
    "bash.exe": "Bash Shell",
    "ubuntu.exe": "Ubuntu WSL",
    "explorer.exe": "File Explorer",
    "taskmgr.exe": "Task Manager",
    "control.exe": "Control Panel",
    "regedit.exe": "Registry Editor",
    "mmc.exe": "Microsoft Management Console",
    "discord.exe": "Discord",
    "telegram.exe": "Telegram",
    "whatsapp.exe": "WhatsApp Desktop",
    "slack.exe": "Slack",
    "teams.exe": "Microsoft Teams",
    "skype.exe": "Skype",
    "vlc.exe": "VLC Media Player",
    "spotify.exe": "Spotify",
    "mpc-hc64.exe": "Media Player Classic",
    "photos.exe": "Microsoft Photos",
    "winword.exe": "MS Word",
    "excel.exe": "MS Excel",
    "powerpnt.exe": "MS PowerPoint",
    "onenote.exe": "MS OneNote",
    "acrobat.exe": "Adobe Acrobat",
    "acrord32.exe": "Adobe Reader",
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
    "obs64.exe": "OBS Studio",
    "calculator.exe": "Calculator",
    "paintdotnet.exe": "Paint.NET",
    "mspaint.exe": "Paint",
}

def init_db():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
            id SERIAL PRIMARY KEY,
            app_name TEXT NOT NULL,
            usage_seconds INTEGER NOT NULL,
            open_count INTEGER NOT NULL DEFAULT 0,
            log_date DATE NOT NULL,
            UNIQUE (app_name, log_date)
        );
    """)
    conn.commit()
    cur.close()
    return conn

def get_active_window_info():
    try:
        hwnd = win32gui.GetForegroundWindow()
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        process_name = process.name().lower()
        window_title = win32gui.GetWindowText(hwnd).strip()
        return process_name, window_title
    except Exception:
        return None, None

def resolve_app_name(process_name, window_title):
    if process_name in APP_NAME_MAP:
        return APP_NAME_MAP[process_name]

    if window_title:
        return window_title.split(" - ")[0]

    return process_name

def save_usage(conn, app_name, seconds, opens):
    if not app_name or seconds <= 0:
        return

    cur = conn.cursor()
    today = datetime.now().date()
    cur.execute(f"""
        INSERT INTO {TABLE_NAME} (app_name, usage_seconds, open_count, log_date)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (app_name, log_date)
        DO UPDATE SET
            usage_seconds = {TABLE_NAME}.usage_seconds + EXCLUDED.usage_seconds,
            open_count = {TABLE_NAME}.open_count + EXCLUDED.open_count;
    """, (app_name, int(seconds), opens, today))
    conn.commit()
    cur.close()

if __name__ == "__main__":
    conn = init_db()

    usage_times = {}
    open_counts = {}

    active_app = None
    start_time = None
    last_save_time = time.time()

    print("Tracking app usage... Saving every 30 seconds. Press Ctrl+C to stop.")

    try:
        while True:
            process_name, window_title = get_active_window_info()
            current_app = resolve_app_name(process_name, window_title)

            if current_app != active_app:
                if active_app and start_time:
                    elapsed = time.time() - start_time
                    usage_times[active_app] = usage_times.get(active_app, 0) + elapsed

                if current_app:
                    open_counts[current_app] = open_counts.get(current_app, 0) + 1
                    print(f"{current_app} opened ({open_counts[current_app]} times)")

                active_app = current_app
                start_time = time.time()

            if time.time() - last_save_time >= SAVE_INTERVAL:
                for app in usage_times:
                    save_usage(
                        conn,
                        app,
                        usage_times.get(app, 0),
                        open_counts.get(app, 0)
                    )

                usage_times.clear()
                open_counts.clear()
                last_save_time = time.time()
                print("Updating Data..................")

            time.sleep(1)

    except KeyboardInterrupt:
        if active_app and start_time:
            elapsed = time.time() - start_time
            usage_times[active_app] = usage_times.get(active_app, 0) + elapsed

        for app in usage_times:
            save_usage(
                conn,
                app,
                usage_times.get(app, 0),
                open_counts.get(app, 0)
            )

        conn.close()
        print("\nTracking stopped. Data saved to PostgreSQL.")
