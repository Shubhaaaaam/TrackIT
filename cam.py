import cv2
import os
from datetime import datetime
import time
import random

def auto_capture():
    folder = "CapturedPhotos"
    os.makedirs(folder, exist_ok=True)

    cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cam.isOpened():
        return

    for _ in range(15):
        ret, frame = cam.read()
        if not ret:
            cam.release()
            return
        cv2.waitKey(30)

    ret, frame = cam.read()
    if not ret:
        cam.release()
        return

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filepath = os.path.join(folder, f"{timestamp}.jpg")
    cv2.imwrite(filepath, frame)
    print(f"Image saved as: {filepath}")

    cam.release()
    cv2.destroyAllWindows()

auto_capture()
time.sleep(random.randint(30, 120))
auto_capture()
