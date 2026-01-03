from datetime import datetime, timedelta
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import csv
import os
import threading
import google.generativeai as genai
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PHOTO_DIR = os.path.join(BASE_DIR, "CapturedPhotos")
REPORT_DIR = os.path.join(BASE_DIR, "webreports")
CSV_FILE = os.path.join(BASE_DIR, "app_log.csv")
LOG_FILE = os.path.join(BASE_DIR, "web_log.txt")

try:
    with open(os.path.join(BASE_DIR, "api.txt"), "r") as f:
        api = f.read().strip()
except FileNotFoundError:
    api = None

model = None
if api:
    genai.configure(api_key=api)
    model = genai.GenerativeModel("gemini-2.5-flash")

app = Flask(__name__)
CORS(app)

def generate_weekly_report(usage_dir="usage", output_file="weekly.csv"):
    summary = {}

    if not os.path.exists(usage_dir):
        return

    for filename in os.listdir(usage_dir):
        if not filename.endswith(".csv") or filename.lower() == "global.csv":
            continue

        file_path = os.path.join(usage_dir, filename)

        with open(file_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            if not reader.fieldnames or len(reader.fieldnames) < 4:
                continue

            day = reader.fieldnames[3].lower()

            if day not in summary:
                summary[day] = {"count": 0, "time": 0}

            for row in reader:
                summary[day]["count"] += int(row.get("open_count", 0))
                summary[day]["time"] += int(row.get("usage_seconds", 0))

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["day", "count", "time"])

        for day, data in summary.items():
            writer.writerow([day, data["count"], data["time"]])

generate_weekly_report()

def get_weekly_summary(usage_dir):
    summary = {}

    if not os.path.exists(usage_dir):
        return summary

    for filename in os.listdir(usage_dir):
        if not filename.endswith(".csv") or filename.lower() == "global.csv":
            continue

        path = os.path.join(usage_dir, filename)

        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            if not reader.fieldnames or len(reader.fieldnames) < 4:
                continue

            day = reader.fieldnames[3].lower()

            summary.setdefault(day, {"count": 0, "time": 0})

            for row in reader:
                summary[day]["count"] += int(row.get("open_count", 0))
                summary[day]["time"] += int(row.get("usage_seconds", 0))

    return summary

def load_reports():
    all_data = []

    for file in os.listdir(REPORT_DIR):
        if file.endswith("alltime.csv"):
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
    if model is None:
        return "AI summary unavailable"

    if "site" not in df.columns or "total_seconds" not in df.columns:
        return "Invalid report format"

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

@app.route("/summary/weekly", methods=["GET"])
def weekly_summary():
    weekly_data = get_weekly_summary(USAGE_DIR)
    return jsonify(weekly_data)

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

USAGE_DIR = os.path.join(BASE_DIR, "usage")

GLOBAL_CSV = os.path.join(USAGE_DIR, "global.csv")
def read_csv_safe(path):
    data = []
    if not os.path.exists(path):
        return data

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append({
                "app_name": row["app_name"],
                "usage_seconds": int(row["usage_seconds"]),
                "open_count": int(row["open_count"])
            })
    return data

@app.route("/summary", methods=["GET"])
def summary():
    today_name = datetime.now().strftime("%A").lower()
    today_csv = os.path.join(USAGE_DIR, f"{today_name}.csv")

    today_data = read_csv_safe(today_csv)
    all_time_data = read_csv_safe(GLOBAL_CSV)

    return jsonify({
        "all_time": all_time_data,
        "today": today_data
    })


log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

active_sessions = {}
daily_totals = {}

lock = threading.Lock()

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

    alltime = f"alltime.csv"
    path = os.path.join(REPORT_DIR, alltime)
    fglobal = os.path.exists(path)

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if not fglobal:
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
