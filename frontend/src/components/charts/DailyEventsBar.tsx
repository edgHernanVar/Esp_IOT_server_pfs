import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { DailyStat } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailyEventsBarProps {
  data: DailyStat[];
}

const DailyEventsBar: React.FC<DailyEventsBarProps> = ({ data }) => {
  const chartRef = useRef<ChartJS<'bar', number[], string>>(null);

  const chartData = {
    labels: data.map((stat) => {
      const date = new Date(stat.day_utc);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }),
    datasets: [
      {
        label: 'Eventos',
        data: data.map((stat) => stat.total_events),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Eventos por Día',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Eventos: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default DailyEventsBar;

