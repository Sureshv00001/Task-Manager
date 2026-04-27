import React from 'react';
import DashboardStats from '../components/dashboard/DashboardStats';
import TaskList from '../components/tasks/TaskList';
import CalendarView from '../components/tasks/CalendarView';
import { useAuth } from '../context/AuthContext';
import ProjectList from '../components/projects/ProjectList';
import { useSearchParams } from 'react-router-dom';
import Leaderboard from '../components/dashboard/Leaderboard';
import DailyReportForm from '../components/reports/DailyReportForm';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'tasks';

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-text-secondary mt-1">Here is what you need to work on today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DashboardStats />
        </div>
        <div>
          <Leaderboard />
        </div>
      </div>

      {tab === 'tasks' && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mr-3">📋</span>
            Assigned Tasks
          </h2>
          <TaskList />
        </div>
      )}

      {tab === 'projects' && (
        <div className="mt-8">
          <ProjectList onSelectProject={(id) => console.log('Selected Project:', id)} onShowForm={() => {}} />
        </div>
      )}

      {tab === 'calendar' && (
        <div className="mt-8">
          <CalendarView />
        </div>
      )}

      {tab === 'reports' && (
        <div className="mt-8 max-w-2xl mx-auto">
          <DailyReportForm />
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
