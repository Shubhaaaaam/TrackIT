import subprocess
import time
while True:
    process = subprocess.Popen(['python', 'main.py'], start_new_session=False)
    time.sleep(10)
    process.terminate()
    process.wait()
