import subprocess
subprocess.call("taskkill /F /IM node.exe", shell=True)
path = r"C:\Users\shubh\OneDrive\Desktop\Projects\Cloned_Repositories\TrackIT\dashboard"
subprocess.Popen("npm run dev", cwd=path, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE
)