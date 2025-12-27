import subprocess, sys, importlib.util
pythonw = sys.executable.replace("python.exe", "pythonw.exe")
NO_WINDOW = subprocess.CREATE_NO_WINDOW
BUILT_IN = {"datetime", "time", "os", "csv", "random", "logging", "subprocess"}
def install(pkgs):
    for p in pkgs:
        if p not in BUILT_IN and not importlib.util.find_spec(p):
            subprocess.check_call([sys.executable, "-m", "pip", "install", p])
processes = [
    ("vite.py", []),
    ("main.py", ["psutil", "win32gui", "win32process"]),
    ("cam.py", ["opencv-python"]),
    ("app.py", ["flask", "flask_cors"]),
]
for script, pkgs in processes:
    install(pkgs)
    subprocess.Popen([pythonw, script], creationflags=NO_WINDOW)
print("All processes started successfully.")
