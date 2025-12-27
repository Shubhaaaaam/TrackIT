# TrackIT – Comprehensive User Activity Tracking & Analytics System

TrackIT is a **Windows-based user activity monitoring and analytics platform** that tracks application usage, browser activity, and user presence, and presents insights through an interactive dashboard.  
It is designed for **productivity analysis, usage analytics, research, and system behavior studies**.

---

## 🚀 Features

### 🖥️ Application Usage Tracking
- Tracks **foreground Windows applications**
- Records:
  - Active usage time (seconds)
  - Number of times an app becomes active
- Daily and all-time aggregation
- Human-readable app name normalization
- Lightweight and runs silently in background

### 🌐 Website Activity Tracking
- Chrome Extension-based website tracking
- Detects:
  - Site visit start
  - Site visit end
  - Session duration
- Maps raw URLs to readable site names
- Logs session-based browsing behavior

### 📸 Webcam Presence Capture
- Periodic automatic webcam image capture
- Captures timestamped photos at random intervals
- Runs silently without user interaction
- Useful for presence verification and research purposes

### 📊 Interactive Dashboard
- Built with **React + Recharts**
- Visualizes:
  - App usage time
  - Usage frequency
  - Top apps by duration
  - Daily trends
- Supports:
  - Today vs All-Time view
  - Search and sorting
  - Dark/Light mode
- Real-time backend integration

### ⚙️ Automatic Startup & Background Execution
- Runs automatically on Windows startup
- No console windows (uses `pythonw`)
- Desktop shortcut for quick dashboard access
- One-click system startup launcher

---

## 🛠️ Tech Stack

### Backend
- Python 3.x
- Flask
- Flask-CORS
- CSV-based storage
- psutil
- pywin32

### Frontend
- React
- Recharts
- Vite

### Browser Extension
- Chrome Extension (JavaScript)
- Background scripts
- REST API integration

### System & OS
- Windows 10 / 11
- OpenCV (Webcam)
- Windows Startup automation


---

## ▶️ How It Works

1. **On System Startup**
   - TrackIT starts automatically in the background
   - App tracking, browser tracking, and backend are initialized

2. **During Usage**
   - Foreground apps are tracked in real-time
   - Website activity is logged via Chrome extension
   - Webcam captures periodic snapshots

3. **Visualization**
   - Dashboard fetches data from Flask backend
   - Displays insights and usage analytics

---

## ⚡ Installation & Usage

## 1️⃣ Clone the Repository
```bash
git clone https://github.com/Shubhaaaaam/TrackIT.git
cd TrackIT
```
## ▶️ Installation & Usage

### 2️⃣ Run Once to Register Startup
```bash
python startup.py
```
## 🔐 Privacy & Transparency

- No data is sent externally  
- All data remains on the local machine  
- No hidden persistence (startup entry is visible)  
- Fully removable by deleting the startup shortcut  

⚠️ **Webcam capture should be used ethically and only with user consent.**

---

## 🎯 Use Cases

- Productivity analysis  
- Digital behavior research  
- Personal usage tracking  
- Academic projects  
- System usage analytics  
- Monitoring tools experimentation  

---

## 📌 Future Enhancements (Planned)

- Unified application + website analytics  
- Database support (PostgreSQL)  
- Idle time detection  
- Cross-platform support  
- User profiles  
- Exportable reports  

---

## 🧑‍💻 Author

**Shubham Raj**  
GitHub: [https://github.com/Shubhaaaaam](https://github.com/Shubhaaaaam)
