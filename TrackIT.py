import subprocess
import time
process1 = subprocess.Popen(['python', 'vite.py'], start_new_session=True)
process2 = subprocess.Popen(['python', 'main.py'], start_new_session=True)
while True:
    process3 = subprocess.Popen(['python', 'app.py'], start_new_session=False)
    time.sleep(30)
    process3.terminate()
    process3.wait()