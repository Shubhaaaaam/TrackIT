import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './App.css';
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
  const [viewMode, setViewMode] = useState('today');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('http://127.0.0.1:6001/summary');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const source = data[viewMode] || [];

        const formatted = source.map((item, idx) => ({
          id: idx + 1,
          name: item.app,
          usageCount: Number(item.open_count) || 0,
          totalDuration: Number(item.seconds) * 1000 || 0
        }));


        setAppData(formatted);
      } catch (err) {
        console.error('Failed to fetch /summary:', err);
      }
    };

    fetchSummary();
  }, [viewMode]);


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
    return appData.reduce((sum, app) => sum + (app.usageCount || 0), 0);
  }, [appData]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B', '#6A0572', '#FB8B24', '#8A2BE2', '#DC143C'];

  const appsWithAverageDuration = useMemo(() => {
    return appData.map(app => ({
      ...app,
      averageDurationPerUse: app.usageCount > 0 ? app.totalDuration / app.usageCount : 0
    }));
  }, [appData]);

  const mostUsedApp = useMemo(() => {
    if (!appData.length) return { name: '-', usageCount: 0 };

    return appData.reduce((prev, curr) =>
      (curr.usageCount || 0) > (prev.usageCount || 0) ? curr : prev
    );
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
      <header className="header">
        <div>
          <a href='new.html'>USERS</a>
        </div>
        <div>
          <h1>User Dashboard</h1>
          <p>Welcome, John Doe! Here's an overview of your app usage.</p>
        </div>
        <div>
          <h3>{viewMode === 'today' ? "Today's Data" : "All Time Data"}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="theme-toggle-button" onClick={() =>
            setViewMode(viewMode === 'today' ? 'all_time' : 'today')
          }>
            <span>{viewMode === 'today' ? 'All' : 'Today'}</span>
          </button>
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
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={160} interval={0} />
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
                outerRadius={150}
                fill="#8884d8"
                labelLine={false}
              //label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
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
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={160} interval={0} />
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
