import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardStats from '../components/dashboard/DashboardStats';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import UserList from '../components/users/UserList';
import PerformanceSummary from '../components/performance/PerformanceSummary';
import CalendarView from '../components/tasks/CalendarView';
import Leaderboard from '../components/dashboard/Leaderboard';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';
import RiskAlerts from '../components/dashboard/RiskAlerts';
import { Plus } from 'lucide-react';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'tasks';
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [refreshTasks, setRefreshTasks] = useState(0);

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    setRefreshTasks(prev => prev + 1);
  };

  const handleProjectCreated = () => {
    setShowProjectForm(false);
    setRefreshTasks(prev => prev + 1); // Refresh tasks list as well just in case
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Admin Portal</h1>
          <p className="text-text-secondary mt-1">Manage users, oversee tasks, and monitor performance.</p>
        </div>
        {tab === 'tasks' && !showTaskForm && (
          <button 
            onClick={() => setShowTaskForm(true)}
            className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-5 py-2.5 rounded-xl flex items-center font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} className="mr-2" /> Assign Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DashboardStats />
        </div>
        <div>
          <Leaderboard />
        </div>
      </div>

      <RiskAlerts />

      {tab === 'tasks' && (
        <>
          {showTaskForm && <TaskForm onTaskCreated={handleTaskCreated} onCancel={() => setShowTaskForm(false)} />}
          <TaskList forceRefresh={refreshTasks} />
        </>
      )}

      {tab === 'projects' && (
        <>
          {showProjectForm && <ProjectForm onProjectCreated={handleProjectCreated} onCancel={() => setShowProjectForm(false)} />}
          <ProjectList onShowForm={() => setShowProjectForm(true)} onSelectProject={(id) => console.log('Selected Project:', id)} />
        </>
      )}

      {tab === 'users' && <UserList />}
      {tab === 'performance' && <PerformanceSummary />}
      {tab === 'calendar' && <CalendarView />}
    </div>
  );
};

export default AdminDashboard;
