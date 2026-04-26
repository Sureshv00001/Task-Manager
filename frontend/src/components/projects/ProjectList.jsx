import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Layout, Calendar, CheckCircle2, MoreVertical, Plus, Users, Briefcase, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ProjectList = ({ onSelectProject, onShowForm }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(null);
  const [summaries, setSummaries] = useState({});
  const { user } = useAuth();

  const handleSummarize = async (e, projectId) => {
    e.stopPropagation();
    setSummaryLoading(projectId);
    try {
      const res = await api.get(`/ai/summarize-project/${projectId}`);
      setSummaries(prev => ({ ...prev, [projectId]: res.data.summary }));
      toast.success('AI summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setSummaryLoading(null);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading projects...</div>;

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project._id} 
            onClick={() => onSelectProject(project._id)}
            className="glass-panel p-6 rounded-3xl border border-border-color bg-secondary shadow-lg hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical size={18} className="text-text-secondary" />
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 shadow-inner">
                <Briefcase size={24} />
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                ${project.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                  project.status === 'planning' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                {project.status}
              </div>
            </div>

            <h3 className="text-lg font-bold text-text-primary mb-2 truncate group-hover:text-primary-600 transition-colors">{project.name}</h3>
            <p className="text-sm text-text-secondary mb-6 line-clamp-2 opacity-80">{project.description}</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-text-secondary">Progress</span>
                  <span className="text-primary-600">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500 ease-out"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-color/50">
                <div className="flex -space-x-2">
                  {project.members.slice(0, 3).map((member, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-secondary bg-primary-500 flex items-center justify-center text-[10px] font-bold text-white" title={member.name}>
                      {member.name.charAt(0)}
                    </div>
                  ))}
                  {project.members.length > 3 && (
                    <div className="w-7 h-7 rounded-full border-2 border-secondary bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-text-secondary">
                      +{project.members.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button
                      onClick={(e) => handleSummarize(e, project._id)}
                      disabled={summaryLoading === project._id}
                      className={`flex items-center px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
                        summaryLoading === project._id
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-400 cursor-wait'
                          : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm hover:shadow-md'
                      }`}
                    >
                      <Sparkles size={10} className={`mr-1 ${summaryLoading === project._id ? 'animate-spin' : ''}`} />
                      {summaryLoading === project._id ? '...' : 'AI Summary'}
                    </button>
                  )}
                  <div className="flex items-center text-[10px] font-bold text-text-secondary uppercase">
                    <CheckCircle2 size={14} className="mr-1 text-green-500" />
                    {project.completedCount}/{project.taskCount} Tasks
                  </div>
                </div>
              </div>

              {summaries[project._id] && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center mb-1">
                    <Sparkles size={12} className="text-purple-500 mr-1" />
                    <span className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">AI Summary</span>
                  </div>
                  <p className="text-xs text-text-primary leading-relaxed">{summaries[project._id]}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        <div 
          onClick={onShowForm}
          className="border-2 border-dashed border-border-color rounded-3xl p-6 flex flex-col items-center justify-center text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-all cursor-pointer group bg-primary/5"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="font-bold">Create New Project</span>
        </div>
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-20 bg-secondary/50 rounded-3xl border border-border-color mt-6">
          <Layout size={48} className="mx-auto text-text-secondary opacity-20 mb-4" />
          <p className="text-text-secondary font-medium">No projects found. Create your first project to get started!</p>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
