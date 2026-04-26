import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import StarRating from '../ui/StarRating';
import ActivityTimeline from './ActivityTimeline';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, CheckCircle2, Users } from 'lucide-react';

const TaskDetails = ({ taskId, onClose }) => {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments');
  const [viewers, setViewers] = useState([]);
  const { socket } = useSocket();
  const { user } = useAuth();

  const fetchTaskData = async () => {
    try {
      const [taskRes, commentRes, activityRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
        api.get(`/tasks/${taskId}/activity`)
      ]);
      setTask(taskRes.data);
      setComments(commentRes.data);
      setActivities(activityRes.data);
    } catch (error) {
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskData();
    
    if (socket) {
      socket.emit('join-task', { taskId, user: { name: user.name, role: user.role, _id: user._id } });
      socket.on('task-viewers', (currentViewers) => {
        setViewers(currentViewers);
      });

      return () => {
        socket.emit('leave-task', { taskId });
        socket.off('task-viewers');
      };
    }
  }, [taskId, socket]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { content: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleToggleChecklist = async (index) => {
    try {
      const updatedChecklists = [...task.checklists];
      updatedChecklists[index].completed = !updatedChecklists[index].completed;
      
      await api.put(`/tasks/${taskId}/checklist`, { checklists: updatedChecklists });
      setTask({ ...task, checklists: updatedChecklists });
    } catch (error) {
      toast.error('Failed to update checklist');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!task) return <div className="text-center p-12 text-text-secondary">Task not found</div>;

  return (
    <div className="bg-secondary rounded-2xl border border-border-color shadow-2xl overflow-hidden max-w-4xl w-full mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-primary-600 dark:bg-primary-800 p-6 text-white">
        <div className="flex justify-between items-start">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
              <div className="flex items-center gap-4 text-sm opacity-90">
                <span className="flex items-center"><User size={14} className="mr-1" /> {task.assignedTo?.name}</span>
                <span className="flex items-center"><Clock size={14} className="mr-1" /> Due {format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
              </div>
            </div>

            {viewers.length > 1 && (
              <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10">
                <div className="flex -space-x-2 mr-3">
                  {viewers.filter(v => v._id !== user._id).map((viewer, idx) => (
                    <div 
                      key={idx} 
                      title={`${viewer.name} (${viewer.role}) is viewing this task`}
                      className="w-8 h-8 rounded-full bg-white text-primary-600 border-2 border-primary-600 flex items-center justify-center text-[10px] font-bold"
                    >
                      {viewer.name.charAt(0)}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-bold flex flex-col leading-tight">
                  <span className="text-green-300">LIVE VIEWERS</span>
                  <span className="opacity-80 uppercase">{viewers.length - 1} others</span>
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Left Column: Discussion & Activity */}
        <div className="col-span-2 border-r border-border-color">
          <div className="flex border-b border-border-color">
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'comments' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-text-secondary hover:bg-primary/5'}`}
            >
              <MessageSquare size={16} /> Discussion ({comments.length})
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'activity' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-text-secondary hover:bg-primary/5'}`}
            >
              <History size={16} /> Activity Log
            </button>
          </div>

          <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar bg-primary/5">
            {activeTab === 'comments' ? (
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12 text-text-secondary opacity-50">No comments yet. Start the conversation!</div>
                ) : (
                  comments.map(comment => (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-xs uppercase">
                        {comment.user.name.charAt(0)}
                      </div>
                      <div className="flex-1 bg-secondary p-3 rounded-2xl border border-border-color shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-text-primary">{comment.user.name}</span>
                          <span className="text-[10px] text-text-secondary opacity-60">{format(new Date(comment.createdAt), 'MMM dd, HH:mm')}</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <ActivityTimeline taskId={taskId} />
            )}
          </div>

          {activeTab === 'comments' && (
            <form onSubmit={handleAddComment} className="p-4 border-t border-border-color bg-secondary flex gap-2">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type a comment..." 
                className="flex-1 px-4 py-2 bg-background border border-border-color rounded-xl text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button type="submit" className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20">
                <Send size={18} />
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Info */}
        <div className="p-6 bg-primary/10">
          <h3 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">Task Info</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase">Status</label>
              <div className="mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                {task.status.replace(/-/g, ' ')}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase">Assigned By</label>
              <div className="mt-1 text-sm text-text-primary font-medium">{task.assignedBy?.name}</div>
            </div>
            {task.reviewedAt && (
              <div className="pt-4 border-t border-border-color">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Review Results</label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary">Rating</span>
                    <StarRating rating={task.rating} readOnly />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-secondary">Score</span>
                    <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{task.marks}/100</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Checklists Section */}
            <div className="pt-6 border-t border-border-color mt-6">
              <label className="text-[10px] font-bold text-text-secondary uppercase mb-3 block">Task Checklist</label>
              <div className="space-y-3">
                {task.checklists?.map((item, index) => (
                  <div key={index} className="flex items-center group">
                    <button 
                      onClick={() => handleToggleChecklist(index)}
                      className={`mr-3 transition-colors ${item.completed ? 'text-green-500' : 'text-text-secondary opacity-30 hover:opacity-100'}`}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <span className={`text-sm flex-1 transition-all ${item.completed ? 'text-text-secondary line-through opacity-50' : 'text-text-primary'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
                {(!task.checklists || task.checklists.length === 0) && (
                  <p className="text-xs text-text-secondary opacity-50 italic">No checklist items</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
