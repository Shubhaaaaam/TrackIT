import os
import sys
import winshell
from win32com.client import Dispatch

def add_to_startup(script_path=None):
    if script_path is None:
        script_path = os.path.abspath(sys.argv[0])
    startup_folder = winshell.startup()
    shortcut_path = os.path.join(startup_folder, "MyPythonScript.lnk")
    python_path = sys.executable

    shell = Dispatch('WScript.Shell')
    shortcut = shell.CreateShortCut(shortcut_path)
    shortcut.Targetpath = python_path
    shortcut.Arguments = f'"{script_path}"'
    shortcut.WorkingDirectory = os.path.dirname(script_path)
    shortcut.IconLocation = python_path
    shortcut.save()
    print(f"Shortcut created at: {shortcut_path}")

if __name__ == "__main__":
    target_script = r"C:\Users\shubh\OneDrive\Desktop\Projects\Cloned Repositories\TrackIT\main.py"
    add_to_startup(target_script)
