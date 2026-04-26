import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { X, Calendar, Briefcase, Users } from 'lucide-react';

const ProjectForm = ({ onProjectCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    members: []
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/users/employees');
        setEmployees(res.data);
      } catch (error) {
        toast.error('Failed to load employees');
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/projects', formData);
      toast.success('Project created successfully');
      onProjectCreated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id) => {
    const current = [...formData.members];
    if (current.includes(id)) {
      setFormData({ ...formData, members: current.filter(m => m !== id) });
    } else {
      setFormData({ ...formData, members: [...current, id] });
    }
  };

  return (
    <div className="bg-secondary p-8 rounded-3xl mb-8 animate-fade-in border border-border-color shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6">
        <button onClick={onCancel} className="text-text-secondary hover:text-red-500 transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex items-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center mr-4 shadow-lg shadow-primary-500/30">
          <Briefcase size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-text-primary">Create New Project</h3>
          <p className="text-sm text-text-secondary">Set up a high-level goal for your team.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">Project Name</label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                className="w-full px-5 py-3 bg-background border border-border-color rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-text-primary transition-all" 
                placeholder="e.g., Marketing Campaign Q4" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                <input 
                  required 
                  type="date" 
                  value={formData.deadline} 
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})} 
                  className="w-full pl-12 pr-5 py-3 bg-background border border-border-color rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-text-primary transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">Description</label>
              <textarea 
                required 
                rows="4"
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="w-full px-5 py-3 bg-background border border-border-color rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-text-primary transition-all resize-none" 
                placeholder="Describe the goals and scope of this project..."
              ></textarea>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider flex items-center">
              <Users size={16} className="mr-2" /> Select Team Members
            </label>
            <div className="bg-background border border-border-color rounded-2xl p-4 h-[310px] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {employees.map(emp => (
                  <div 
                    key={emp._id} 
                    onClick={() => toggleMember(emp._id)}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                      formData.members.includes(emp._id) 
                        ? 'bg-primary-500 text-white shadow-md' 
                        : 'hover:bg-primary/5 text-text-primary'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 font-bold text-xs ${
                      formData.members.includes(emp._id) ? 'bg-white/20' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    }`}>
                      {emp.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold flex-1">{emp.name}</span>
                    {formData.members.includes(emp._id) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                ))}
                {employees.length === 0 && <p className="text-center text-text-secondary text-sm py-10 opacity-50">No employees found</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-border-color/50">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-8 py-3 border border-border-color rounded-2xl text-text-secondary font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-10 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
