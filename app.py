from datetime import datetime, timedelta
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import csv
import os
import threading
import google.generativeai as genai
import pandas as pd

genai.configure(api_key="YOUR_API_KEY")
model = genai.GenerativeModel("gemini-2.5-flash")

PHOTO_DIR = r"F:\Projects\TrackIT\CapturedPhotos"
REPORT_DIR = "reports"
CSV_FILE = "app_log.csv"

app = Flask(__name__)
CORS(app)

def load_reports():
    all_data = []

    for file in os.listdir(REPORT_DIR):
        if file.endswith(".csv"):
            path = os.path.join(REPORT_DIR, file)
            df = pd.read_csv(path)
            all_data.append(df)

    if not all_data:
        return pd.DataFrame()

    return pd.concat(all_data, ignore_index=True)


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

def summarize_with_gemini(df):
    grouped = (
        df.groupby("site")["total_seconds"]
        .sum()
        .sort_values(ascending=False)
    )

    summary_text = "User activity summary:\n"
    for site, seconds in grouped.items():
        summary_text += f"- {site}: {seconds} seconds\n"

    prompt = f"""
            You are a productivity analysis assistant.

            Given this user activity data:
            {summary_text}

            Generate:
            1. A concise daily summary
            2. Productivity insights
            3. Time-wasting patterns (if any)
            4. Suggestions to improve focus
            """
    response = model.generate_content(prompt)
    return response.text

def summary():
    df = load_reports()

    if df.empty:
        return jsonify({"error": "No data found"}), 404

    gemini_summary = summarize_with_gemini(df)

    return jsonify({
        "status": "ok",
        "sites_tracked": df["site"].nunique(),
        "total_time_minutes": int(df["total_seconds"].sum()),
        "ai_summary": gemini_summary
    })

@app.route("/report", methods=["GET"])
def report_ui():
    df = load_reports()

    if df.empty:
        return "<h2>No data found</h2>", 404

    ai_summary = summarize_with_gemini(df)

    return jsonify({"ai_summary": ai_summary})

@app.route("/photos/<path:filename>")
def serve_photo(filename):
    return send_from_directory(PHOTO_DIR, filename)

@app.route("/users", methods=["GET"])
def get_users():
    users = []

    if not os.path.exists(PHOTO_DIR):
        return jsonify([])

    for file in os.listdir(PHOTO_DIR):
        if file.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            users.append({
                "name": os.path.splitext(file)[0],
                "photo": f"http://localhost:6001/photos/{file}"
            })

    return jsonify(users)

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

    file_exists = os.path.exists(path)

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow(["date", "site", "total_seconds", "minutes", "hours"])

        for site, duration in site_data.items():
            total_seconds = int(duration.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            writer.writerow([day.isoformat(), site, total_seconds, minutes, hours])

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

        log_to_file(f"{event.upper()} | {url} | {timestamp.isoformat()}")

    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=6001, debug=True)
