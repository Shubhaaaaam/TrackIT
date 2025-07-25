import psutil
import time
import subprocess
process = subprocess.Popen(['python', 'app.py'], start_new_session=False)

def check_and_notify_app_status(app_names):
    previous_app_status = {app: False for app in app_names}

    print("Monitoring applications... Press Ctrl+C to stop.")
    while True:
        current_app_status = {app: False for app in app_names}

        for process in psutil.process_iter(['name']):
            try:
                process_name = process.info['name'].lower()
                for app_name in app_names:
                    if app_name.lower() in process_name:
                        current_app_status[app_name] = True
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass

        for app, is_currently_running in current_app_status.items():
            if is_currently_running and not previous_app_status[app]:
                print(f"Notification: '{app}' has just opened!")

            elif not is_currently_running and previous_app_status[app]:
                print(f"Notification: '{app}' has just closed.")

        previous_app_status = current_app_status

        time.sleep(2)

if __name__ == "__main__":
    applications_to_monitor = [
        "Code.exe",
        "WhatsApp.exe",
        "chrome.exe",
        "firefox.exe",
        "msedge.exe",
        "winword.exe",
        "excel.exe",
        "powerpnt.exe",
        "outlook.exe",
        "notepad.exe",
        "notepad++.exe",
        "vlc.exe",
        "spotify.exe",
        "teams.exe",
        "zoom.exe",
        "slack.exe",
        "discord.exe",
        "telegram.exe",
        "gimp.exe",
        "photoshop.exe",
        "AcroRd32.exe",
        "calc.exe",
        "spotify.exe",
        "pycharm64.exe",
        "idea64.exe",
        "sublime_text.exe",
        "thunderbird.exe",
        "wmplayer.exe",
        "brave.exe",
        "opera.exe",
    ]

    try:
        check_and_notify_app_status(applications_to_monitor)
    except KeyboardInterrupt:
        print("\nMonitoring stopped.")
