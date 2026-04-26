import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import TaskCard from './TaskCard';
import TaskBoard from './TaskBoard';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { TaskCardSkeleton } from '../ui/Skeleton';

const TaskList = ({ forceRefresh }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks', {
        params: { page, limit: 10, status, search }
      });
      setTasks(res.data.tasks);
      setTotalPages(res.data.pages);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, status, forceRefresh]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-secondary p-4 rounded-xl border border-border-color shadow-sm">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-text-primary"
          />
          <Search className="absolute left-3 top-2.5 text-text-secondary opacity-50" size={18} />
          <button type="submit" className="hidden">Search</button>
        </form>

        <div className="flex items-center space-x-2">
          <div className="flex bg-background border border-border-color rounded-lg p-1 mr-2 hidden sm:flex">
            <button
              onClick={(e) => { e.preventDefault(); setViewMode('list'); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-secondary'}`}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setViewMode('board'); }}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'board' ? 'bg-primary-500 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-secondary'}`}
              title="Board View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <Filter className="text-text-secondary opacity-50" size={18} />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-background border border-border-color rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-text-primary"
          >
            <option value="" className="bg-secondary">All Status</option>
            <option value="pending" className="bg-secondary">Pending</option>
            <option value="in-progress" className="bg-secondary">In Progress</option>
            <option value="completed" className="bg-secondary">Completed</option>
            <option value="reviewed" className="bg-secondary">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col bg-secondary border border-border-color rounded-xl min-h-[500px] p-2">
                <TaskCardSkeleton />
                <TaskCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <TaskCardSkeleton key={i} />)}
          </div>
        )
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-secondary rounded-xl border border-dashed border-border-color">
          <div className="text-text-secondary opacity-20 mb-2 text-4xl">📋</div>
          <p className="text-text-secondary font-medium">No tasks found</p>
        </div>
      ) : viewMode === 'board' ? (
        <TaskBoard tasks={tasks} onUpdate={fetchTasks} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} onUpdate={fetchTasks} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && viewMode === 'list' && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-border-color rounded-lg disabled:opacity-50 bg-secondary text-sm font-medium text-text-primary hover:bg-secondary/80 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm font-medium text-text-secondary flex items-center">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-border-color rounded-lg disabled:opacity-50 bg-secondary text-sm font-medium text-text-primary hover:bg-secondary/80 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
