# 🚀 TrackIT – Productivity Monitoring System
A powerful, automated monitoring tool that tracks **desktop app usage**, **browser activity**, and provides **detailed productivity insights** with a clean dashboard.
TrackIT is a lightweight and intelligent productivity monitoring system built using Python, PostgreSQL, Flask, and a Vite-based dashboard. It tracks active application usage, logs browser activity, analyzes digital behavior, and displays insights through a structured reporting interface.
The system runs silently in the background with minimal CPU usage while capturing accurate usage durations and filtering idle time.

---

## 📌 Overview
TrackIT is a real‑time productivity tracking system built using:

- **Python** → Monitoring Daemon + Backend APIs  
- **PostgreSQL** → Persistent storage  
- **Flask** → REST API server  
- **Vite + React** → Frontend dashboard  
- **Windows APIs** → Active window and process tracking  

It monitors **active apps**, **browser URLs**, **session durations**, and **idle time**, then visualizes results in a dashboard.

---

## ✨ Key Features
- 🔹 Real‑time active application tracking  
- 🔹 Browser URL session logging  
- 🔹 Idle‑time filtering  
- 🔹 Daily + All‑time usage summaries  
- 🔹 PostgreSQL storage with conflict‑free upserts  
- 🔹 Automated launcher for backend + monitoring + frontend  
- 🔹 Lightweight & low CPU usage  
- 🔹 Cross‑platform roadmap (Linux/macOS coming soon)

---

## 📁 Project Structure
```
TrackIT/
│── backend/
│   ├── app.py            # Flask backend server
│   ├── main.py           # Windows monitoring daemon
│   ├── orchestrator.py   # Starts all modules
│   ├── vite.py           # Vite dev server runner
│   └── shortcut.py       # Desktop launcher shortcut
│
│── dashboard/            # Frontend (Vite + React)
│
│── database/
│   └── schema.sql        # PostgreSQL schema
│
└── README.md
```

---

## 🛠️ Technologies Used

### **Backend**
- Python 3.9+
- Flask / Flask‑CORS
- psycopg2
- psutil
- pywin32

### **Frontend**
- Vite  
- React / JavaScript  
- TailwindCSS  

### **Database**
- PostgreSQL  

### **Platform**
- Windows 10/11

---

## 📥 Installation & Setup Guide

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/Shubhaaaaam/TrackIT.git
cd TrackIT
```

---

## **2️⃣ Create Python Virtual Environment**
```bash
python -m venv venv
venv\Scriptsctivate       # Windows
```

---

## **3️⃣ Install Python Dependencies**
```bash
pip install -r requirements.txt
```

---

## **4️⃣ Setup PostgreSQL Database**
### Create Database
```sql
CREATE DATABASE trackit;
```

### Create Table
```sql
CREATE TABLE app_usage_log (
    id SERIAL PRIMARY KEY,
    app_name TEXT NOT NULL,
    usage_seconds INTEGER NOT NULL,
    log_date DATE NOT NULL,
    UNIQUE (app_name, log_date)
);
```

---

## **5️⃣ Start Monitoring Daemon**
```bash
python backend/main.py
```

---

## **6️⃣ Start Flask Backend Server**
```bash
python backend/app.py
```

---

## **7️⃣ Start Frontend Dashboard**
```bash
cd dashboard
npm install
npm run dev
```

---

## **8️⃣ Start All Services Automatically (Recommended)**  
```bash
python backend/orchestrator.py
```

This launches:

- Vite Dev Server  
- Flask Backend  
- Monitoring Daemon  
- Auto‑restart backend loop  

---

## 📊 API Endpoints

### **GET /summary**
Returns:
- Total usage time per app  
- Today’s usage time per app  

### **POST /log_url**
Used by browser logger extension:
- `visited`
- `started`
- `session terminated`
- `closed`

---

## 📈 Example Console Output
```
Windows app tracker started.
chrome.exe was opened
Updating Data..................
Visited: https://google.com
Session terminated: (Duration: 00:12:15)
```

---

## 📌 Future Enhancements
- Linux & macOS support  
- Cloud sync (Firestore / Supabase)  
- ML‑based productivity prediction  
- Browser extension for advanced tab‑tracking  
- Rich interactive dashboard components  
- Export reports as PDF/Excel  

---

## 🤝 Contributing
Contributions welcome!  
Please submit a Pull Request or open an Issue.

---

## 📜 License
MIT License  

---

## 👤 Author
**Shubham Raj**  
GitHub: https://github.com/Shubhaaaaam
