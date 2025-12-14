import subprocess
import sys
packages = [
    "flask",
    "flask-cors",
    "psycopg2",
    "psutil",
    "pywin32",
    "winshell",
]
for package in packages:
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])
pythonw = sys.executable.replace("python.exe", "pythonw.exe")
process1 = subprocess.Popen([pythonw, "vite.py"], creationflags=subprocess.CREATE_NO_WINDOW)
process2 = subprocess.Popen([pythonw, "main.py"], creationflags=subprocess.CREATE_NO_WINDOW)
process3 = subprocess.Popen([pythonw, "cam.py"], creationflags=subprocess.CREATE_NO_WINDOW)
process4 = subprocess.Popen([pythonw, "app.py"], creationflags=subprocess.CREATE_NO_WINDOW)

#while True:
#    process3 = subprocess.Popen(['python', 'app.py'], start_new_session=False)
#    print("Browser Tracking Server Restarted...")
#    time.sleep(30)
#    process3.terminate()
#    process3.wait()