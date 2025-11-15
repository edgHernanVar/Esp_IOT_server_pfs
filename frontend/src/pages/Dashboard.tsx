import React, { useState, useEffect } from 'react';
import DailyEventsBar from '../components/charts/DailyEventsBar';
import TopLabelsPie from '../components/charts/TopLabelsPie';
import EventList from '../components/EventList';
import { apiService, DailyStat, TopLabel, Device } from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [topLabels, setTopLabels] = useState<TopLabel[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      const devicesData = await apiService.getDevices();
      setDevices(devicesData);
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dailyData, topLabelsData] = await Promise.all([
        apiService.getDailyStats(selectedDevice || undefined, 7),
        apiService.getTopLabels(selectedDevice || undefined, 7, 5),
      ]);
      setDailyStats(dailyData);
      setTopLabels(topLabelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDevice(e.target.value);
    setSelectedLabel(''); // Reset label filter when device changes
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLabel(e.target.value);
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // Get unique labels from topLabels for filter
  const availableLabels = topLabels.map((item) => item.label);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>ESP IoT Dashboard</h1>
        <div className="dashboard-controls">
          <select
            value={selectedDevice}
            onChange={handleDeviceChange}
            className="filter-select"
          >
            <option value="">Todos los dispositivos</option>
            {devices.map((device, index) => (
              <option key={index} value={device.device_id}>
                {device.name}
              </option>
            ))}
          </select>
          {availableLabels.length > 0 && (
            <select
              value={selectedLabel}
              onChange={handleLabelChange}
              className="filter-select"
            >
              <option value="">Todas las etiquetas</option>
              {availableLabels.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          )}
          <button onClick={handleRefresh} className="refresh-button">
            🔄 Actualizar
          </button>
        </div>
      </header>

      {error && (
        <div className="dashboard-error">
          Error: {error}
        </div>
      )}

      {loading && dailyStats.length === 0 ? (
        <div className="dashboard-loading">Cargando datos...</div>
      ) : (
        <>
          <div className="charts-container">
            <div className="chart-card">
              <DailyEventsBar data={dailyStats} />
            </div>
            <div className="chart-card">
              <TopLabelsPie data={topLabels} />
            </div>
          </div>

          <EventList
            deviceId={selectedDevice || undefined}
            labelFilter={selectedLabel || undefined}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;

