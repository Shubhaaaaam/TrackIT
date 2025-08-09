from flask import Flask, request, jsonify
from datetime import datetime
import logging

app = Flask(__name__)

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