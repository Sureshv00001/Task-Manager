import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isSameDay } from 'date-fns';
import api from '../../utils/api';
import Modal from '../ui/Modal';
import TaskDetails from './TaskDetails';

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/tasks?limit=1000');
        setTasks(res.data.tasks);
      } catch (error) {
        console.error('Failed to load tasks for calendar');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const getTasksForDate = (date) => {
    return tasks.filter(task => isSameDay(new Date(task.deadline), date));
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayTasks = getTasksForDate(date);
      if (dayTasks.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="flex -space-x-1">
              {dayTasks.slice(0, 3).map((task, idx) => (
                <div 
                  key={task._id} 
                  className={`w-2 h-2 rounded-full border border-white dark:border-slate-800 ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}
                  title={task.title}
                />
              ))}
              {dayTasks.length > 3 && (
                <div className="w-2 h-2 rounded-full bg-gray-600 text-[6px] flex items-center justify-center text-white">+</div>
              )}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading calendar...</div>;

  const dayTasks = getTasksForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-border-color shadow-xl bg-secondary">
        <Calendar 
          onChange={setSelectedDate} 
          value={selectedDate}
          tileContent={tileContent}
          className="w-full border-none bg-transparent font-outfit"
        />
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-border-color shadow-lg bg-secondary min-h-[400px]">
          <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center">
            <span className="w-3 h-8 bg-primary-500 rounded-full mr-3"></span>
            {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          
          <div className="space-y-4">
            {dayTasks.length === 0 ? (
              <div className="py-12 text-center text-text-secondary opacity-50 italic">
                No tasks due on this date
              </div>
            ) : (
              dayTasks.map(task => (
                <div 
                  key={task._id}
                  onClick={() => setSelectedTask(task)}
                  className="p-4 rounded-2xl border border-border-color bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                      task.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-text-secondary font-bold uppercase">{task.status}</span>
                  </div>
                  <h4 className="font-bold text-text-primary group-hover:text-primary-600 transition-colors">{task.title}</h4>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-1">{task.description.replace(/<[^>]*>/g, '')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Custom styles for the calendar to match our theme */}
      <style>{`
        .react-calendar {
          background: transparent;
          color: var(--text-primary);
          font-family: inherit;
        }
        .react-calendar__navigation button {
          color: var(--text-primary);
          font-weight: bold;
          font-size: 1.1rem;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: var(--primary-500);
          color: white;
          border-radius: 12px;
        }
        .react-calendar__month-view__weekdays__weekday {
          color: var(--text-secondary);
          font-weight: bold;
          text-decoration: none;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        .react-calendar__tile {
          padding: 1.5em 0.5em;
          color: var(--text-primary);
          border-radius: 16px;
          transition: all 0.2s;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: var(--primary-50);
          color: var(--primary-700);
        }
        .dark .react-calendar__tile:enabled:hover {
          background-color: var(--primary-900/30);
          color: var(--primary-400);
        }
        .react-calendar__tile--now {
          background: var(--primary-100) !important;
          color: var(--primary-700) !important;
          font-weight: bold;
        }
        .dark .react-calendar__tile--now {
          background: var(--primary-900/40) !important;
          color: var(--primary-400) !important;
        }
        .react-calendar__tile--active {
          background: var(--primary-600) !important;
          color: white !important;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
        }
        .react-calendar__month-view__days__day--neighboringMonth {
          opacity: 0.2;
        }
      `}</style>

      {selectedTask && (
        <Modal onClose={() => setSelectedTask(null)}>
          <TaskDetails taskId={selectedTask._id} onClose={() => setSelectedTask(null)} />
        </Modal>
      )}
    </div>
  );
};

export default CalendarView;
