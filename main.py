import time
import psutil
import win32gui
import win32process
from datetime import datetime
import psycopg2
import subprocess

process = subprocess.Popen(['python', 'app.py'], start_new_session=False)

DB_NAME = "TraceIT"
DB_USER = "postgres"
DB_PASSWORD = "1111"
DB_HOST = "localhost"
DB_PORT = "5432"

TABLE_NAME = "app_usage_log"
SAVE_INTERVAL = 30

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
            log_date DATE NOT NULL,
            UNIQUE (app_name, log_date)
        );
    """)
    conn.commit()
    cur.close()
    return conn

def get_active_window_process():
    try:
        hwnd = win32gui.GetForegroundWindow()
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process = psutil.Process(pid)
        return process.name().lower()
    except Exception:
        return None

def save_usage(conn, app_name, seconds):
    if not app_name:
        return
    cur = conn.cursor()
    today = datetime.now().date()
    cur.execute(f"""
        INSERT INTO {TABLE_NAME} (app_name, usage_seconds, log_date)
        VALUES (%s, %s, %s)
        ON CONFLICT (app_name, log_date)
        DO UPDATE SET usage_seconds = {TABLE_NAME}.usage_seconds + EXCLUDED.usage_seconds;
    """, (app_name, int(seconds), today))
    conn.commit()
    cur.close()

if __name__ == "__main__":
    conn = init_db()
    usage_times = {}
    active_app = None
    start_time = None
    last_save_time = time.time()

    print("Tracking app usage... Saving every 30 seconds. Press Ctrl+C to stop.")
    try:
        while True:
            current_app = get_active_window_process()

            if current_app != active_app:
                if active_app and start_time:
                    elapsed = time.time() - start_time
                    usage_times[active_app] = usage_times.get(active_app, 0) + elapsed
                active_app = current_app
                start_time = time.time()

            if time.time() - last_save_time >= SAVE_INTERVAL:
                for app, seconds in usage_times.items():
                    save_usage(conn, app, seconds)
                usage_times.clear()
                last_save_time = time.time()

            time.sleep(1)

    except KeyboardInterrupt:
        if active_app and start_time:
            elapsed = time.time() - start_time
            usage_times[active_app] = usage_times.get(active_app, 0) + elapsed
        for app, seconds in usage_times.items():
            save_usage(conn, app, seconds)
        conn.close()
        print("\nTracking stopped. Data saved to PostgreSQL.")
