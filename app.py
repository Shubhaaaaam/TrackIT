from datetime import datetime, timedelta
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import os
import threading

CSV_FILE = "app_log.csv"

app = Flask(__name__)
CORS(app)

def load_csv():
    if not os.path.exists(CSV_FILE):
        return []

    data = []
    with open(CSV_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append({
                "app_name": row["app_name"],
                "usage_seconds": int(row["usage_seconds"]),
                "open_count": int(row["open_count"]),
                "log_date": row["log_date"]
            })
    return data

@app.route("/summary", methods=["GET"])
def summary():
    rows = load_csv()
    if not rows:
        return jsonify({"all_time": [], "today": []})

    all_time_map = {}
    today_map = {}
    today_str = str(datetime.now().date())

    for row in rows:
        app_name = row["app_name"]
        seconds = row["usage_seconds"]
        opens = row["open_count"]
        date = row["log_date"]

        if app_name not in all_time_map:
            all_time_map[app_name] = {"seconds": 0, "open_count": 0}
        all_time_map[app_name]["seconds"] += seconds
        all_time_map[app_name]["open_count"] += opens

        if date == today_str:
            if app_name not in today_map:
                today_map[app_name] = {"seconds": 0, "open_count": 0}
            today_map[app_name]["seconds"] += seconds
            today_map[app_name]["open_count"] += opens

    all_time = [
        {"app": app, "seconds": v["seconds"], "open_count": v["open_count"]}
        for app, v in all_time_map.items()
    ]
    today = [
        {"app": app, "seconds": v["seconds"], "open_count": v["open_count"]}
        for app, v in today_map.items()
    ]

    all_time.sort(key=lambda x: x["seconds"], reverse=True)
    today.sort(key=lambda x: x["seconds"], reverse=True)

    return jsonify({"all_time": all_time, "today": today})

log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

active_sessions = {}
daily_totals = {}

lock = threading.Lock()

LOG_FILE = "web_log.txt"
REPORT_DIR = "reports"

os.makedirs(REPORT_DIR, exist_ok=True)

def log_to_file(message):
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(message + "\n")

def export_day_to_csv(day, site_data):
    filename = f"usage_{day}.csv"
    path = os.path.join(REPORT_DIR, filename)

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "site", "total_seconds", "minutes", "hours"])

        for site, duration in site_data.items():
            total_seconds = int(duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            writer.writerow([day.isoformat(), site, total_seconds, hours, minutes])

@app.route("/log_url", methods=["POST"])
def log_url():
    data = request.get_json(force=True)

    event = data.get("event")
    url = data.get("url")
    timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
    event_date = datetime.fromisoformat(data["date"]).date()

    with lock:
        for site, session in list(active_sessions.items()):
            if session["date"] != event_date:
                duration = timestamp - session["start"]
                daily_totals.setdefault(session["date"], {})
                daily_totals[session["date"]].setdefault(site, timedelta())
                daily_totals[session["date"]][site] += duration
                export_day_to_csv(session["date"], daily_totals[session["date"]])
                active_sessions.pop(site)

        if event == "started":
            active_sessions[url] = {
                "start": timestamp,
                "date": event_date
            }

        elif event in ("session terminated", "paused"):
            session = active_sessions.pop(url, None)
            if session:
                duration = timestamp - session["start"]
                daily_totals.setdefault(session["date"], {})
                daily_totals[session["date"]].setdefault(url, timedelta())
                daily_totals[session["date"]][url] += duration
                export_day_to_csv(session["date"], daily_totals[session["date"]])

        elif event == "heartbeat":
            pass

        else:
            log_to_file(f"UNKNOWN EVENT | {data}")

        log_to_file(f"{event.upper()} | {url} | {timestamp.isoformat()}")

    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=6001, debug=False)
