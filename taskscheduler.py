import os
import sys
import winshell
from win32com.client import Dispatch
from pathlib import Path

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


def get_desktop_path():
    """Return the correct Desktop path, even if under OneDrive."""
    possible_paths = [
        Path.home() / "Desktop",
        Path.home() / "OneDrive" / "Desktop"
    ]
    for path in possible_paths:
        if path.exists():
            return path
    return Path.cwd()

def create_shortcut(url="http://localhost:5173/", shortcut_name="TrackIT"):
    desktop = get_desktop_path()
    shortcut_path = desktop / f"{shortcut_name}.url"
    content = f"[InternetShortcut]\nURL={url}\nIconIndex=0\n"
    with open(shortcut_path, 'w') as shortcut_file:shortcut_file.write(content)
    print(f"✅ Shortcut created successfully!")
    print(f"📂 Location: {shortcut_path}")
    print(f"🔗 Opens: {url}")


if __name__ == "__main__":
    target_script = r"C:\Users\shubh\OneDrive\Desktop\Projects\Cloned Repositories\TrackIT\main.py"
    add_to_startup(target_script)
    create_shortcut()