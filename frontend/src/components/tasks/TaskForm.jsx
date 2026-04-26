import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TaskForm = ({ onTaskCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium',
    tags: [],
    checklists: [],
    project: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, projRes] = await Promise.all([
          api.get('/users/employees'),
          api.get('/projects')
        ]);
        setEmployees(empRes.data);
        setProjects(projRes.data);
      } catch (error) {
        toast.error('Failed to load initial data');
      }
    };
    fetchData();
  }, []);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (checklistInput.trim()) {
      setFormData({ 
        ...formData, 
        checklists: [...formData.checklists, { text: checklistInput, completed: false }] 
      });
      setChecklistInput('');
    }
  };

  const removeChecklistItem = (index) => {
    setFormData({ 
      ...formData, 
      checklists: formData.checklists.filter((_, i) => i !== index) 
    });
  };

  const [aiLoading, setAiLoading] = useState(false);

  const aiSuggest = async () => {
    if (!formData.title.trim()) {
      return toast.error('Please enter a title first');
    }
    
    setAiLoading(true);
    try {
      const res = await api.post('/ai/generate-task', { title: formData.title });
      const { description, checklists, suggestedPriority, estimatedHours } = res.data;
      
      setFormData({
        ...formData,
        description: description || formData.description,
        checklists: checklists ? checklists.map(text => ({ text, completed: false })) : formData.checklists,
        priority: suggestedPriority || formData.priority,
      });
      
      toast.success(`✨ AI generated content! Estimated ${estimatedHours || '?'}h of work.`);
    } catch (error) {
      // Fallback to local suggestions if API fails
      let suggestions = [];
      const titleLower = formData.title.toLowerCase();
      
      if (titleLower.includes('report') || titleLower.includes('document')) {
        suggestions = ['Gather data and metrics', 'Draft initial document', 'Internal peer review', 'Final formatting and submission'];
      } else if (titleLower.includes('bug') || titleLower.includes('issue') || titleLower.includes('fix')) {
        suggestions = ['Reproduce the reported issue', 'Root cause analysis', 'Implement technical fix', 'Run regression tests'];
      } else {
        suggestions = ['Initial research and planning', 'Core feature implementation', 'Code review and feedback', 'Documentation and cleanup'];
      }

      setFormData({
        ...formData,
        checklists: suggestions.map(text => ({ text, completed: false }))
      });
      toast.success('AI suggested a checklist (offline mode)');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/tasks', formData);
      const newTaskId = res.data._id;

      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        await api.post(`/tasks/${newTaskId}/upload`, fileData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success('Task created successfully');
      onTaskCreated();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary p-6 rounded-2xl mb-6 animate-fade-in border border-border-color shadow-lg shadow-primary-500/10">
      <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center">
        <span className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mr-3">📝</span>
        Create New Task
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
            <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary" placeholder="e.g., Update Q3 Report" />
          </div>
          <button 
            type="button" 
            onClick={aiSuggest}
            disabled={aiLoading}
            className={`flex items-center px-5 py-2 rounded-xl font-bold text-sm h-[42px] transition-all shadow-md ${
              aiLoading 
                ? 'bg-purple-200 dark:bg-purple-900/40 text-purple-400 cursor-wait' 
                : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:-translate-y-0.5 shadow-purple-500/30'
            }`}
            title="AI Assist: Generate description, checklist, and priority"
          >
            <Sparkles size={16} className={`mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiLoading ? 'Generating...' : '✨ AI Generate'}
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <div className="bg-background rounded-xl overflow-hidden border border-border-color">
            <ReactQuill 
              theme="snow" 
              value={formData.description} 
              onChange={(val) => setFormData({...formData, description: val})} 
              className="text-text-primary bg-background dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Project (Optional)</label>
            <select value={formData.project} onChange={(e) => setFormData({...formData, project: e.target.value})} className="w-full px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary">
              <option value="">No Project</option>
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-secondary">{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Assign To</label>
            <select required value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} className="w-full px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary">
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id} className="bg-secondary">{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Deadline</label>
            <input required type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
            <select required value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary">
              <option value="low" className="bg-secondary">Low</option>
              <option value="medium" className="bg-secondary">Medium</option>
              <option value="high" className="bg-secondary">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span key={tag} className="flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-lg">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-primary-800"><X size={12} /></button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={tagInput} 
              onChange={(e) => setTagInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
              className="flex-1 px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary" 
              placeholder="Add a tag..." 
            />
            <button type="button" onClick={handleAddTag} className="p-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Task Checklist</label>
          <div className="space-y-2 mb-2">
            {formData.checklists.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-primary/5 rounded-xl border border-border-color/50 group">
                <span className="text-sm text-text-primary flex items-center">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                  {item.text}
                </span>
                <button type="button" onClick={() => removeChecklistItem(index)} className="text-text-secondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={checklistInput} 
              onChange={(e) => setChecklistInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem(e)}
              className="flex-1 px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary" 
              placeholder="Add checklist item..." 
            />
            <button type="button" onClick={handleAddChecklistItem} className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Attachment (Optional)</label>
          <input 
            type="file" 
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full px-4 py-2 bg-background border border-border-color rounded-xl focus:ring-primary-500 focus:border-primary-500 text-text-primary text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 dark:file:bg-primary-900/30 dark:file:text-primary-400 dark:hover:file:bg-primary-900/50 transition-colors cursor-pointer"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onCancel} className="px-5 py-2 border border-border-color rounded-xl text-text-secondary font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
          <button type="submit" disabled={loading} className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-2 rounded-xl font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
