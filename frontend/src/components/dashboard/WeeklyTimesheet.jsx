import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar, Clock, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

const WeeklyTimesheet = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tasks/timesheets?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        setData(res.data);
      } catch (error) {
        console.error('Failed to load timesheets');
      } finally {
        setLoading(false);
      }
    };
    fetchTimesheets();
  }, [currentDate]);

  const formatSeconds = (seconds) => {
    if (!seconds) return '-';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset * 7);
    setCurrentDate(newDate);
  };

  if (loading) return <div className="h-64 bg-secondary/50 rounded-3xl animate-pulse"></div>;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-border-color shadow-xl bg-secondary mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary flex items-center">
            <Calendar className="mr-3 text-primary-500" size={24} />
            Weekly Timesheet
          </h3>
          <p className="text-xs text-text-secondary mt-1">Time tracked by employees this week</p>
        </div>
        
        <div className="flex items-center bg-background border border-border-color rounded-xl p-1">
          <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors text-text-secondary">
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 text-sm font-bold text-text-primary min-w-[200px] text-center">
            {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
          </span>
          <button onClick={() => changeWeek(1)} className="p-2 hover:bg-secondary rounded-lg transition-colors text-text-secondary">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-border-color">
              <th className="pb-4 font-bold text-text-secondary text-xs uppercase tracking-wider">Employee</th>
              {days.map(day => (
                <th key={day.toString()} className="pb-4 font-bold text-text-secondary text-xs uppercase tracking-wider text-center">
                  {format(day, 'EEE')}<br/>
                  <span className="text-[10px] font-medium opacity-50">{format(day, 'dd')}</span>
                </th>
              ))}
              <th className="pb-4 font-bold text-text-primary text-xs uppercase tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {data.map((row) => (
              <tr key={row.user._id} className="group hover:bg-primary/5 transition-colors">
                <td className="py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs mr-3">
                      {row.user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-primary">{row.user.name}</div>
                      <div className="text-[10px] text-text-secondary">{row.user.role}</div>
                    </div>
                  </div>
                </td>
                {days.map(day => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const duration = row.days[dayStr] || 0;
                  return (
                    <td key={day.toString()} className={`py-4 text-center text-sm font-medium ${duration > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-text-secondary opacity-30'}`}>
                      {formatSeconds(duration)}
                    </td>
                  );
                })}
                <td className="py-4 text-right">
                  <div className="text-sm font-black text-text-primary">{formatSeconds(row.totalTime)}</div>
                  <div className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">TOTAL HRS</div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-text-secondary opacity-50 italic">
                  No time tracked for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyTimesheet;
