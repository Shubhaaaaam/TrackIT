from flask import Flask, jsonify
import psycopg2
from datetime import datetime

DB_NAME = "TraceIT"
DB_USER = "postgres"
DB_PASSWORD = "1111"
DB_HOST = "localhost"
DB_PORT = "5432"

app = Flask(__name__)

def get_usage_summary():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()

    # All-time usage
    cur.execute("""
        SELECT app_name, SUM(usage_seconds) AS total_seconds
        FROM app_usage_log
        GROUP BY app_name
        ORDER BY total_seconds DESC;
    """)
    all_time = cur.fetchall()

    # Today's usage
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

    return {
        "all_time": [{"app": app, "seconds": secs} for app, secs in all_time],
        "today": [{"app": app, "seconds": secs} for app, secs in today]
    }

@app.route("/summary", methods=["GET"])
def summary():
    data = get_usage_summary()
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
