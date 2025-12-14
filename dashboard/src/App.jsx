import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const App = () => {
  const initialAppData = useMemo(() => [
    { id: 1, name: 'Email Client', usageCount: 120, totalDuration: 7200000 },
    { id: 2, name: 'Code Editor', usageCount: 85, totalDuration: 10800000 },
    { id: 3, name: 'Video Conferencing', usageCount: 45, totalDuration: 3600000 },
    { id: 4, name: 'Project Management Tool', usageCount: 90, totalDuration: 5400000 },
    { id: 5, name: 'Design Software', usageCount: 30, totalDuration: 9000000 },
    { id: 6, name: 'Browser', usageCount: 250, totalDuration: 21600000 },
    { id: 7, name: 'Music Player', usageCount: 180, totalDuration: 14400000 },
    { id: 8, name: 'Chat Application', usageCount: 200, totalDuration: 6000000 },
    { id: 9, name: 'Social Media', usageCount: 300, totalDuration: 18000000 },
    { id: 10, name: 'Gaming', usageCount: 60, totalDuration: 12000000 },
  ], []);

  const [appData, setAppData] = useState(initialAppData);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showSimulateMessage, setShowSimulateMessage] = useState(false);
  const [selectedAppForSim, setSelectedAppForSim] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [viewMode, setViewMode] = useState('all_time');


  useEffect(() => {
  const fetchSummary = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const source = data[viewMode] || [];

      const formatted = source.map((item, idx) => ({
        id: idx + 1,
        name: item.app,
        usageCount: item.opens ?? 0,   
        totalDuration: (item.seconds ?? 0) * 1000, 
      }));

      setAppData(formatted);
    } catch (err) {
      console.error('Failed to fetch /summary:', err);
    }
  };

  fetchSummary();
}, []);


  const formatDuration = useCallback((ms) => {
    if (ms === 0) return '0m';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (parts.length === 0 && seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  }, []);

  const filteredAndSortedAppData = useMemo(() => {
    let filtered = appData.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else {
        valA = a[sortBy];
        valB = b[sortBy];
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [appData, searchTerm, sortBy, sortOrder]);

  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  const simulateUsage = useCallback((appId) => {
    setAppData(prevData =>
      prevData.map(app =>
        app.id === appId
          ? {
            ...app,
            usageCount: app.usageCount + 1,
            totalDuration: app.totalDuration + Math.floor(Math.random() * (3600000 - 60000) + 60000)
          }
          : app
      )
    );
    const updatedApp = appData.find(app => app.id === appId);
    setSelectedAppForSim(updatedApp);
    setShowSimulateMessage(true);
  }, [appData]);

  useEffect(() => {
    let timer;
    if (showSimulateMessage) {
      timer = setTimeout(() => setShowSimulateMessage(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [showSimulateMessage]);

  const totalUsageDuration = useMemo(() => {
    return appData.reduce((sum, app) => sum + app.totalDuration, 0);
  }, [appData]);

  const totalUsageCount = useMemo(() => {
    return appData.reduce((sum, app) => sum + app.usageCount, 0);
  }, [appData]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#6A0572', '#FB8B24', '#8A2BE2', '#DC143C'];

  const appsWithAverageDuration = useMemo(() => {
    return appData.map(app => ({
      ...app,
      averageDurationPerUse: app.usageCount > 0 ? app.totalDuration / app.usageCount : 0
    }));
  }, [appData]);

  const mostUsedApp = useMemo(() => {
    if (!appData || appData.length === 0) return { name: '-', usageCount: 0 };
    return appData.reduce((prev, current) => (prev.usageCount > current.usageCount ? prev : current), appData[0]);
  }, [appData]);

  const longestUsedApp = useMemo(() => {
    if (!appData || appData.length === 0) return { name: '-', totalDuration: 0 };
    return appData.reduce((prev, current) => (prev.totalDuration > current.totalDuration ? prev : current), appData[0]);
  }, [appData]);

  const dailyUsageData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      name: day,
      'Total Usage (Hours)': parseFloat(((Math.random() * 4 + 2) + index * 0.5).toFixed(2)),
      'Total Apps Used': Math.floor(Math.random() * 4 + 5)
    }));
  }, []);

  const topAppsByUsageCount = useMemo(() => {
    return [...appData].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
  }, [appData]);

  const topAppsByDuration = useMemo(() => {
    return [...appData].sort((a, b) => b.totalDuration - a.totalDuration).slice(0, 5);
  }, [appData]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <div className={`dashboard-container ${theme}-theme`}>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          width: 100%;
        }

        :root {
          --primary-color-light: #5a7dff;
          --secondary-color-light: #00c6ff;
          --accent-color-light: #ff6b6b;
          --text-color-light: #2c3e50;
          --light-text-color-light: #7f8c8d;
          --bg-color-light: #ecf0f1;
          --card-bg-light: #ffffff;
          --border-color-light: #e0e6eb;
          --shadow-light-light: rgba(0, 0, 0, 0.08);
          --shadow-medium-light: rgba(0, 0, 0, 0.15);
          --gradient-start-light: #5a7dff;
          --gradient-end-light: #00c6ff;

          --primary-color-dark: #8c9eff;
          --secondary-color-dark: #00e0ff;
          --accent-color-dark: #ff7f7f;
          --text-color-dark: #f0f0f0;
          --light-text-color-dark: #b0b0b0;
          --bg-color-dark: #000000;
          --card-bg-dark: #1a1a1a;
          --border-color-dark: #333333;
          --shadow-light-dark: rgba(255, 255, 255, 0.05);
          --shadow-medium-dark: rgba(255, 255, 255, 0.1);
          --gradient-start-dark: #333333;
          --gradient-end-dark: #000000;
        }

        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .dashboard-container {
          width: 100vw;
          min-height: 100vh;
          margin: 0;
          padding: 25px;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          gap: 30px;
          box-sizing: border-box;
          overflow-y: auto;
          transition: background-color 0.5s ease, color 0.5s ease;
        }

        .light-theme {
          background-color: var(--bg-color-light);
          color: var(--text-color-light);
        }

        .dark-theme {
          background-color: var(--bg-color-dark);
          color: var(--text-color-dark);
        }

        .header {
          background: linear-gradient(135deg, var(--gradient-start-light), var(--gradient-end-light));
          color: #fff;
          padding: 35px 45px;
          border-radius: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 8px 20px var(--shadow-medium-light);
          position: relative;
          overflow: hidden;
        }
        .dark-theme .header {
          background: linear-gradient(135deg, var(--gradient-start-dark), var(--gradient-end-dark));
          box-shadow: 0 8px 20px var(--shadow-medium-dark);
        }

        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
          transform: rotate(30deg);
          pointer-events: none;
        }

        .header h1 {
          margin: 0;
          font-size: 2.8em;
          font-weight: 700;
          letter-spacing: -0.8px;
          z-index: 1;
        }

        .header p {
          margin: 0;
          font-size: 1.2em;
          opacity: 0.95;
          z-index: 1;
        }

        .header .user-icon {
          font-size: 3.5em;
          opacity: 0.8;
          z-index: 1;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
        }

        .stat-card {
          background-color: var(--card-bg-light);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 6px 20px var(--shadow-light-light);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.5s ease;
          border: 1px solid var(--border-color-light);
        }
        .dark-theme .stat-card {
          background-color: var(--card-bg-dark);
          box-shadow: 0 6px 20px var(--shadow-light-dark);
          border: 1px solid var(--border-color-dark);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 25px var(--shadow-medium-light);
        }
        .dark-theme .stat-card:hover {
          box-shadow: 0 12px 25px var(--shadow-medium-dark);
        }

        .stat-card h3 {
          margin-top: 0;
          font-size: 1.2em;
          color: var(--light-text-color-light);
          font-weight: 500;
          margin-bottom: 15px;
        }
        .dark-theme .stat-card h3 {
          color: var(--light-text-color-dark);
        }

        .stat-card p {
          font-size: 2.8em;
          font-weight: 700;
          color: var(--primary-color-light);
          margin-bottom: 0;
          letter-spacing: -0.5px;
        }
        .dark-theme .stat-card p {
          color: var(--primary-color-dark);
        }

        .controls-section {
          background-color: var(--card-bg-light);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 6px 20px var(--shadow-light-light);
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: center;
          justify-content: space-between;
          border: 1px solid var(--border-color-light);
          transition: background-color 0.5s ease;
        }
        .dark-theme .controls-section {
          background-color: var(--card-bg-dark);
          box-shadow: 0 6px 20px var(--shadow-light-dark);
          border: 1px solid var(--border-color-dark);
        }

        .search-bar input {
          width: 300px;
          padding: 14px 18px;
          border: 1px solid var(--border-color-light);
          border-radius: 10px;
          font-size: 1.05em;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.5s ease, color 0.5s ease;
          background-color: var(--card-bg-light);
          color: var(--text-color-light);
        }
        .dark-theme .search-bar input {
          border: 1px solid var(--border-color-dark);
          background-color: var(--bg-color-dark);
          color: var(--text-color-dark);
        }

        .search-bar input:focus {
          outline: none;
          border-color: var(--primary-color-light);
          box-shadow: 0 0 0 4px rgba(90, 125, 255, 0.2);
        }
        .dark-theme .search-bar input:focus {
          border-color: var(--primary-color-dark);
          box-shadow: 0 0 0 4px rgba(140, 158, 255, 0.2);
        }

        .sort-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .sort-controls label {
          font-weight: 500;
          color: var(--light-text-color-light);
          font-size: 1.05em;
        }
        .dark-theme .sort-controls label {
          color: var(--light-text-color-dark);
        }

        .sort-controls select {
          padding: 12px 18px;
          border: 1px solid var(--border-color-light);
          border-radius: 10px;
          font-size: 1.05em;
          background-color: var(--card-bg-light);
          color: var(--text-color-light);
          cursor: pointer;
          appearance: none;
          background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%237f8c8d%22%20d%3D%22M287%20197.6l-131.3%20131.3c-4.1%204.1-9.6%206.2-15.1%206.2s-11-2.1-15.1-6.2L5.4%20197.6c-8.2-8.2-8.2-21.5%200-29.7s21.5-8.2%2029.7%200l111.2%20111.2L257.3%20167.9c8.2-8.2%2021.5-8.2%2029.7%200s8.2%2021.5%200%2029.7z%22%2F%3E%3C%2Fsvg%3E');
          background-repeat: no-repeat;
          background-position: right 15px center;
          background-size: 14px;
          padding-right: 40px;
          transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease;
        }
        .dark-theme .sort-controls select {
          border: 1px solid var(--border-color-dark);
          background-color: var(--bg-color-dark);
          color: var(--text-color-dark);
          background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%23b0b0b0%22%20d%3D%22M287%20197.6l-131.3%20131.3c-4.1%204.1-9.6%206.2-15.1%206.2s-11-2.1-15.1-6.2L5.4%20197.6c-8.2-8.2-8.2-21.5%200-29.7s21.5-8.2%2029.7%200l111.2%20111.2L257.3%20167.9c8.2-8.2%2021.5-8.2%2029.7%200s8.2%2021.5%200%2029.7z%22%2F%3E%3C%2Fsvg%3E');
        }

        .sort-controls button {
          background-color: var(--primary-color-light);
          color: #fff;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1.05em;
          transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(90, 125, 255, 0.3);
        }
        .dark-theme .sort-controls button {
          background-color: var(--primary-color-dark);
          box-shadow: 0 4px 10px rgba(140, 158, 255, 0.3);
        }

        .sort-controls button:hover {
          background-color: #4a6ee2;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(90, 125, 255, 0.4);
        }
        .dark-theme .sort-controls button:hover {
          background-color: #7b9bff;
          box-shadow: 0 6px 15px rgba(140, 158, 255, 0.4);
        }

        .sort-controls button:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(90, 125, 255, 0.3);
        }
        .dark-theme .sort-controls button:active {
          box-shadow: 0 2px 5px rgba(140, 158, 255, 0.3);
        }

        .app-list {
          background-color: var(--card-bg-light);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 6px 20px var(--shadow-light-light);
          border: 1px solid var(--border-color-light);
          transition: background-color 0.5s ease;
        }
        .dark-theme .app-list {
          background-color: var(--card-bg-dark);
          box-shadow: 0 6px 20px var(--shadow-light-dark);
          border: 1px solid var(--border-color-dark);
        }

        .app-list h2 {
          margin-top: 0;
          margin-bottom: 25px;
          font-size: 2em;
          color: var(--text-color-light);
          font-weight: 600;
        }
        .dark-theme .app-list h2 {
          color: var(--text-color-dark);
        }

        .app-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 8px;
        }

        .app-table th, .app-table td {
          padding: 18px;
          text-align: left;
          border-bottom: 1px solid var(--border-color-light);
          transition: border-color 0.5s ease;
        }
        .dark-theme .app-table th, .dark-theme .app-table td {
          border-bottom: 1px solid var(--border-color-dark);
        }

        .app-table th {
          background-color: var(--bg-color-light);
          font-weight: 600;
          color: var(--light-text-color-light);
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.5s ease;
          border-top: 1px solid var(--border-color-light);
        }
        .dark-theme .app-table th {
          background-color: var(--bg-color-dark);
          color: var(--light-text-color-dark);
          border-top: 1px solid var(--border-color-dark);
        }

        .app-table th:first-child { border-top-left-radius: 10px; }
        .app-table th:last-child { border-top-right-radius: 10px; }

        .app-table th:hover {
          background-color: #e3e7eb;
        }
        .dark-theme .app-table th:hover {
          background-color: #2a2a2a;
        }

        .app-table tbody tr {
          background-color: var(--card-bg-light);
          transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }
        .dark-theme .app-table tbody tr {
          background-color: var(--card-bg-dark);
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .app-table tbody tr:hover {
          background-color: #f8f9fa;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        }
        .dark-theme .app-table tbody tr:hover {
          background-color: #222222;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .app-table tbody tr:last-child td {
          border-bottom: none;
        }

        .app-name {
          font-weight: 600;
          color: var(--primary-color-light);
          display: flex;
          flex-direction: column;
        }
        .dark-theme .app-name {
          color: var(--primary-color-dark);
        }

        .usage-bar-container {
          width: 100%;
          background-color: var(--border-color-light);
          border-radius: 5px;
          height: 10px;
          overflow: hidden;
          margin-top: 8px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
          transition: background-color 0.5s ease;
        }
        .dark-theme .usage-bar-container {
          background-color: var(--border-color-dark);
        }

        .usage-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--secondary-color-light), #00aaff);
          border-radius: 5px;
          transition: width 0.5s ease-out, background 0.5s ease;
        }
        .dark-theme .usage-bar {
          background: linear-gradient(90deg, var(--secondary-color-dark), #00aaff);
        }

        .simulate-button {
          background-color: var(--secondary-color-light);
          color: #fff;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95em;
          transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
          box-shadow: 0 3px 8px rgba(0, 198, 255, 0.3);
        }
        .dark-theme .simulate-button {
          background-color: var(--secondary-color-dark);
          box-shadow: 0 3px 8px rgba(0, 170, 255, 0.3);
        }

        .simulate-button:hover {
          background-color: #00b0e0;
          transform: translateY(-1px);
          box-shadow: 0 5px 12px rgba(0, 198, 255, 0.4);
        }
        .dark-theme .simulate-button:hover {
          background-color: #0099e0;
          box-shadow: 0 5px 12px rgba(0, 170, 255, 0.4);
        }

        .simulate-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 5px rgba(0, 198, 255, 0.3);
        }
        .dark-theme .simulate-button:active {
          box-shadow: 0 2px 5px rgba(0, 170, 255, 0.3);
        }

        .message-box {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #2ecc71;
          color: #fff;
          padding: 18px 30px;
          border-radius: 10px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
          z-index: 1000;
          opacity: 0;
          animation: fadeInOut 3s forwards;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.1em;
          font-weight: 500;
        }

        .message-box.error {
          background-color: #e74c3c;
        }

        .message-box .icon {
          font-size: 1.5em;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0); }
          90% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }

        .charts-section {
          background-color: var(--card-bg-light);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 6px 20px var(--shadow-light-light);
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
          justify-content: space-around;
          align-items: flex-start;
          border: 1px solid var(--border-color-light);
          transition: background-color 0.5s ease;
        }
        .dark-theme .charts-section {
          background-color: var(--card-bg-dark);
          box-shadow: 0 6px 20px var(--shadow-light-dark);
          border: 1px solid var(--border-color-dark);
        }

        .chart-card {
          flex: 1;
          min-width: 350px;
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          border: 1px solid var(--border-color-light);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transition: border-color 0.5s ease;
        }
        .dark-theme .chart-card {
          border: 1px solid var(--border-color-dark);
        }

        .chart-card h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: var(--text-color-light);
          font-weight: 600;
          font-size: 1.6em;
        }
        .dark-theme .chart-card h3 {
          color: var(--text-color-dark);
        }

        .key-insights-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 25px;
        }

        .insight-card {
          background-color: var(--card-bg-light);
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 6px 20px var(--shadow-light-light);
          text-align: center;
          border: 1px solid var(--border-color-light);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.5s ease;
        }
        .dark-theme .insight-card {
          background-color: var(--card-bg-dark);
          box-shadow: 0 6px 20px var(--shadow-light-dark);
          border: 1px solid var(--border-color-dark);
        }

        .insight-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 25px var(--shadow-medium-light);
        }
        .dark-theme .insight-card:hover {
          box-shadow: 0 12px 25px var(--shadow-medium-dark);
        }

        .insight-card h3 {
          margin-top: 0;
          font-size: 1.2em;
          color: var(--light-text-color-light);
          font-weight: 500;
          margin-bottom: 10px;
        }
        .dark-theme .insight-card h3 {
          color: var(--light-text-color-dark);
        }

        .insight-card p {
          font-size: 2.2em;
          font-weight: 700;
          color: var(--accent-color-light);
          margin-bottom: 0;
        }
        .dark-theme .insight-card p {
          color: var(--accent-color-dark);
        }

        .insight-card .app-name-text {
          font-size: 1.4em;
          font-weight: 600;
          color: var(--primary-color-light);
          margin-top: 10px;
        }
        .dark-theme .insight-card .app-name-text {
          color: var(--primary-color-dark);
        }

        .theme-toggle-button {
          background-color: var(--card-bg-light);
          color: var(--text-color-light);
          border: 1px solid var(--border-color-light);
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1em;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.1s ease;
          box-shadow: 0 2px 5px var(--shadow-light-light);
        }
        .dark-theme .theme-toggle-button {
          background-color: var(--card-bg-dark);
          color: var(--text-color-dark);
          border: 1px solid var(--border-color-dark);
          box-shadow: 0 2px 5px var(--shadow-light-dark);
        }

        .theme-toggle-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px var(--shadow-medium-light);
        }
        .dark-theme .theme-toggle-button:hover {
          box-shadow: 0 4px 8px var(--shadow-medium-dark);
        }

        .theme-toggle-button .icon {
          font-size: 1.2em;
        }


        @media (max-width: 1200px) {
          .charts-section {
            flex-direction: column;
            align-items: center;
          }
          .chart-card {
            width: 90%;
            max-width: 700px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 15px;
            gap: 20px;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
            padding: 25px 30px;
          }

          .header h1 {
            font-size: 2.2em;
          }

          .header p {
            font-size: 1em;
          }

          .header .user-icon {
            font-size: 3em;
          }

          .stats-grid, .key-insights-section {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .stat-card, .insight-card {
            padding: 25px;
            border-radius: 12px;
          }

          .stat-card p {
            font-size: 2.2em;
          }

          .insight-card p {
            font-size: 1.8em;
          }

          .insight-card .app-name-text {
            font-size: 1.2em;
          }

          .controls-section {
            flex-direction: column;
            align-items: stretch;
            padding: 25px;
            border-radius: 12px;
          }

          .search-bar input {
            width: 100%;
            padding: 12px 15px;
            font-size: 1em;
          }

          .sort-controls {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            gap: 10px;
          }

          .sort-controls select,
          .sort-controls button {
            width: 100%;
            padding: 12px 15px;
            font-size: 1em;
          }

          .app-list {
            padding: 25px;
            border-radius: 12px;
          }

          .app-list h2 {
            font-size: 1.8em;
            margin-bottom: 20px;
          }

          .app-table th, .app-table td {
            padding: 15px;
            font-size: 0.9em;
          }

          .app-table th:nth-child(3),
          .app-table td:nth-child(3) {
            display: none;
          }

          .simulate-button {
            padding: 8px 12px;
            font-size: 0.85em;
          }

          .chart-card {
            min-width: unset;
            width: 100%;
            height: 300px;
            padding: 15px;
            border-radius: 10px;
          }

          .chart-card h3 {
            font-size: 1.3em;
            margin-bottom: 15px;
          }

          .message-box {
            padding: 15px 25px;
            font-size: 1em;
            gap: 10px;
          }

          .message-box .icon {
            font-size: 1.3em;
          }
        }

        @media (max-width: 480px) {
          .header h1 {
            font-size: 1.8em;
          }

          .header p {
            font-size: 0.9em;
          }

          .stat-card p {
            font-size: 1.8em;
          }
        }
      `}</style>

      <header className="header">
        <div>
          <h1>User Dashboard</h1>
          <p>Welcome, John Doe! Here's an overview of your app usage.</p>
        </div>
        <div>
          <button onClick={() =>
            setViewMode(viewMode === 'today' ? 'all_time' : 'today')
          }>
            <h3>{viewMode === 'today' ? 'Today' : 'All Time'}</h3>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="theme-toggle-button" onClick={toggleTheme}>
            <span className="icon">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <div className="user-icon">
            <span role="img" aria-label="user icon">👤</span>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Apps Tracked</h3>
          <p>{appData.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Usage Count</h3>
          <p>{totalUsageCount}</p>
        </div>
        <div className="stat-card">
          <h3>Total Usage Duration</h3>
          <p>{formatDuration(totalUsageDuration)}</p>
        </div>
      </section>

      <section className="key-insights-section">
        <div className="insight-card">
          <h3>Most Used App</h3>
          <p>{mostUsedApp.usageCount} times</p>
          <span className="app-name-text">{mostUsedApp.name}</span>
        </div>
        <div className="insight-card">
          <h3>Longest Used App</h3>
          <p>{formatDuration(longestUsedApp.totalDuration)}</p>
          <span className="app-name-text">{longestUsedApp.name}</span>
        </div>
      </section>

      <section className="controls-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sort-controls">
          <label htmlFor="sortBy">Sort by:</label>
          <select id="sortBy" value={sortBy} onChange={(e) => handleSort(e.target.value)}>
            <option value="name">App Name</option>
            <option value="usageCount">Usage Count</option>
            <option value="totalDuration">Total Duration</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>
          </button>
        </div>
      </section>

      <section className="charts-section">
        <div className="chart-card">
          <h3>App Usage Count</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredAndSortedAppData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip formatter={(value) => `${value} times`} />
              <Legend />
              <Bar dataKey="usageCount" fill={PIE_COLORS[0]} name="Times Used" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>App Usage Duration Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredAndSortedAppData}
                dataKey="totalDuration"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {
                  filteredAndSortedAppData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))
                }
              </Pie>
              <Tooltip formatter={(value) => formatDuration(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Average Duration Per Use</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={appsWithAverageDuration}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis tickFormatter={(value) => formatDuration(value)} />
              <Tooltip formatter={(value) => formatDuration(value)} />
              <Legend />
              <Bar dataKey="averageDurationPerUse" fill={PIE_COLORS[2]} name="Avg. Duration" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="charts-section">

        <div className="chart-card">
          <h3>Daily Usage Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyUsageData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke={PIE_COLORS[0]} />
              <YAxis yAxisId="right" orientation="right" stroke={PIE_COLORS[3]} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="Total Usage (Hours)" stroke={PIE_COLORS[0]} activeDot={{ r: 8 }} />
              <Line yAxisId="right" type="monotone" dataKey="Total Apps Used" stroke={PIE_COLORS[3]} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top 5 Apps by Usage Count</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topAppsByUsageCount}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => `${value} times`} />
              <Legend />
              <Bar dataKey="usageCount" fill={PIE_COLORS[4]} name="Times Used" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top 5 Apps by Total Duration</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topAppsByDuration}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" tickFormatter={(value) => formatDuration(value)} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(value) => formatDuration(value)} />
              <Legend />
              <Bar dataKey="totalDuration" fill={PIE_COLORS[5]} name="Total Duration" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="app-list">
        <h2>Your App Usage Details</h2>
        <table className="app-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')}>
                App Name {sortBy === 'name' && <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th onClick={() => handleSort('usageCount')}>
                Times Used {sortBy === 'usageCount' && <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th onClick={() => handleSort('totalDuration')}>
                Total Duration {sortBy === 'totalDuration' && <span>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedAppData.length > 0 ? (
              filteredAndSortedAppData.map(app => (
                <tr key={app.id}>
                  <td className="app-name">
                    {app.name}
                    <div className="usage-bar-container">
                      <div
                        className="usage-bar"
                        style={{ width: `${(app.totalDuration / totalUsageDuration) * 100 || 0}%` }}
                      ></div>
                    </div>
                  </td>
                  <td>{app.usageCount}</td>
                  <td>{formatDuration(app.totalDuration)}</td>
                  <td>
                    <button className="simulate-button" onClick={() => simulateUsage(app.id)}>
                      Simulate Usage
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--light-text-color)' }}>
                  No apps found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {showSimulateMessage && selectedAppForSim && (
        <div className="message-box">
          <span className="icon">✅</span>
          <span>Simulated usage for <strong>{selectedAppForSim.name}</strong>!</span>
        </div>
      )}
    </div>
  );
};

export default App;
