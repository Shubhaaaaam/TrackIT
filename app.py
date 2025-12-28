from datetime import datetime, timedelta
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import os

CSV_FILE = "app_usage_log.csv"

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
        app = row["app_name"]
        seconds = row["usage_seconds"]
        opens = row["open_count"]
        date = row["log_date"]

        if app not in all_time_map:
            all_time_map[app] = {"seconds": 0, "open_count": 0}
        all_time_map[app]["seconds"] += seconds
        all_time_map[app]["open_count"] += opens

        if date == today_str:
            if app not in today_map:
                today_map[app] = {"seconds": 0, "open_count": 0}
            today_map[app]["seconds"] += seconds
            today_map[app]["open_count"] += opens

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

last_visited_timestamps = {}
site_total_durations = {}
LOG_FILE = "log.txt"

def log_to_file(message):
    with open(LOG_FILE, "a") as f:
        f.write(message + "\n")

@app.route("/log_url", methods=["POST"])
def log_url():
    data = request.get_json()
    event = data.get("event")
    url = data.get("url")
    timestamp_str = data.get("timestamp")

    current_timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
    log_message = ""
    flag = 0

    if event == "visited":
        log_message = f"Visited: {url} at {timestamp_str}"
        last_visited_timestamps[url] = current_timestamp

    elif event == "closed":
        log_message = f"Closed: {url} at {timestamp_str}"
        if url in last_visited_timestamps:
            del last_visited_timestamps[url]

    elif event == "session terminated":
        if url in last_visited_timestamps:
            visited_time = last_visited_timestamps.pop(url)
            duration = current_timestamp - visited_time

            log_message = (
                f"Session terminated: {url} at {timestamp_str} (Duration: {duration})"
            )

            prev = site_total_durations.get(url, timedelta())
            site_total_durations[url] = prev + duration

            log_message += "\n--- Current Site Durations ---\n"
            for site, total_time in site_total_durations.items():
                log_message += f"{site}: {total_time}\n"
            log_message += "------------------------------"

            log_to_file(log_message)
            flag = 1
        else:
            log_message = f"Session terminated: {url} at {timestamp_str}"

    elif event == "started":
        log_message = f"Started: {url} at {timestamp_str}"
        last_visited_timestamps[url] = current_timestamp

    else:
        log_message = f"Unknown event: {event}, URL: {url} at {timestamp_str}"

    print(log_message)
    if flag == 0:
        log_to_file(log_message)

    return jsonify({"message": f"URL {event} logged successfully"})

if __name__ == "__main__":
    app.run(port=6001, debug=True)
