import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { CheckSquare, Clock, CheckCircle, Users, Activity } from 'lucide-react';

const DashboardStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/tasks/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to load stats');
      }
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: <CheckSquare size={24} />, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800' },
    { label: 'Pending', value: stats.pending, icon: <Clock size={24} />, color: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800' },
    { label: 'In Progress', value: stats.inProgress, icon: <Activity size={24} />, color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800' },
    { label: 'Completed/Reviewed', value: stats.completed + stats.reviewed, icon: <CheckCircle size={24} />, color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' }
  ];

  if (stats.totalUsers !== undefined) {
    statCards.unshift({ label: 'Total Users', value: stats.totalUsers, icon: <Users size={24} />, color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat, idx) => (
        <div key={idx} className="glass-panel p-4 rounded-2xl border border-white/40 dark:border-slate-700/50 hover-scale flex flex-col items-center text-center justify-center">
          <div className={`p-3 rounded-xl mb-3 ${stat.color}`}>
            {stat.icon}
          </div>
          <p className="text-3xl font-bold text-text-primary mb-1">{stat.value}</p>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
