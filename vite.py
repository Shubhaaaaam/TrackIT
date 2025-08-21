import subprocess
subprocess.call("taskkill /F /IM node.exe", shell=True)
path = r"C:\Users\shubh\OneDrive\Desktop\Projects\Cloned_Repositories\TrackIT\dashboard"
subprocess.Popen(["cmd.exe", "/k", "npm run dev"], cwd=path, creationflags=subprocess.CREATE_NEW_CONSOLE)