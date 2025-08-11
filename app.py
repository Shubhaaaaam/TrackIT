from datetime import datetime
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
from datetime import datetime

DB_NAME = "TraceIT"
DB_USER = "postgres"
DB_PASSWORD = "1111"
DB_HOST = "localhost"
DB_PORT = "5432"

app = Flask(__name__)
CORS(app)
 
@app.route("/summary", methods=["GET"])
def summary():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT app_name, SUM(usage_seconds) AS total_seconds
        FROM app_usage_log
        GROUP BY app_name
        ORDER BY total_seconds DESC;
    """)
    all_time = cur.fetchall()

    cur.execute("""
        SELECT app_name, SUM(usage_seconds) AS total_seconds
        FROM app_usage_log
        WHERE log_date = CURRENT_DATE
        GROUP BY app_name
        ORDER BY total_seconds DESC;
    """)
    today = cur.fetchall()

    cur.close()
    conn.close()

    data= {
        "all_time": [{"app": app, "seconds": secs} for app, secs in all_time],
        "today": [{"app": app, "seconds": secs} for app, secs in today]
    }
    return jsonify(data)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

last_visited_timestamps = {}
site_total_durations = {}

LOG_FILE = 'log.txt'

def log_to_file(message):
    with open(LOG_FILE, 'a') as f:
        f.write(message + '\n')

@app.route('/log_url', methods=['POST'])
def log_url():
    if request.method == 'POST':
        data = request.get_json()
        event = data.get('event')
        url = data.get('url')
        timestamp_str = data.get('timestamp')

        current_timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))

        log_message = ""
        flag=0
        if event == 'visited':
            log_message = f"Visited: {url} at {timestamp_str}"
            last_visited_timestamps[url] = current_timestamp
        elif event == 'closed':
            log_message = f"Closed: {url} at {timestamp_str}"
            if url in last_visited_timestamps:
                del last_visited_timestamps[url]
        elif event == 'session terminated':
            if url in last_visited_timestamps:
                visited_time = last_visited_timestamps.pop(url)
                duration = current_timestamp - visited_time
                log_message = f"Session terminated: {url} at {timestamp_str} (Duration: {duration})"

                if url in site_total_durations:
                    site_total_durations[url] += duration
                else:
                    site_total_durations[url] = duration
                
                log_message += "\n--- Current Site Durations ---\n"
                for site, total_time in site_total_durations.items():
                    log_message += f"{site}: {total_time}\n"
                log_message += "------------------------------"
                log_to_file(log_message)
                flag = 1
            else:
                log_message = f"Session terminated: {url} at {timestamp_str}"
        elif event == 'started':
            log_message = f"Started: {url} at {timestamp_str}"
            last_visited_timestamps[url] = current_timestamp
        else:
            log_message = f"Unknown event: {event}, URL: {url} at {timestamp_str}"
        
        print(log_message)
        if flag==0:
            log_to_file(log_message)
        
        return jsonify({"message": f"URL {event} successfully"})

if __name__ == '__main__':
    app.run(port=5000, debug=True)