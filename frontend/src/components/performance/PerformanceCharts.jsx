import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../../utils/api';

const COLORS = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#6366f1'];
const PRIORITY_COLORS = {
  High: '#ef4444',
  Medium: '#3b82f6',
  Low: '#64748b'
};

const PerformanceCharts = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/tasks/performance');
        setData(res.data);
      } catch (error) {
        console.error('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-64 bg-secondary/50 rounded-2xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-64 bg-secondary/50 rounded-2xl"></div>
      <div className="h-64 bg-secondary/50 rounded-2xl"></div>
    </div>
  </div>;

  if (!data) return null;

  return (
    <div className="space-y-6 mb-10">
      {/* Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-border-color shadow-sm flex flex-col h-[350px]">
          <h3 className="text-lg font-bold text-text-primary mb-4">Status Distribution</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass-panel p-6 rounded-3xl border border-border-color shadow-sm flex flex-col h-[350px]">
          <h3 className="text-lg font-bold text-text-primary mb-4">Priority Breakdown</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                />
                <Bar dataKey="value">
                  {data.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Creation Trend */}
        <div className="glass-panel p-6 rounded-3xl border border-border-color shadow-sm flex flex-col h-[350px]">
          <h3 className="text-lg font-bold text-text-primary mb-4">Creation Trend (Last 7 Days)</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Productivity Chart */}
      <div className="glass-panel p-8 rounded-3xl border border-border-color shadow-sm">
        <h3 className="text-xl font-bold text-text-primary mb-6">Employee Task Completion</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data.productivityData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} axisLine={false} tickLine={false} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="var(--text-primary)" 
                fontSize={13} 
                width={100} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-primary)' }}
              />
              <Bar 
                dataKey="completed" 
                fill="url(#barGradient)" 
                radius={[0, 10, 10, 0]} 
                barSize={32}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
