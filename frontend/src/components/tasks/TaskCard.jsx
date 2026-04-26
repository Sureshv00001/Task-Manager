import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Paperclip, MessageSquare, CheckCircle, Clock, PlayCircle, Star, Trash2 } from 'lucide-react';
import StarRating from '../ui/StarRating';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import TaskDetails from './TaskDetails';

const TaskCard = ({ task, onUpdate }) => {
  const { user } = useAuth();
  const [isReviewing, setIsReviewing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [rating, setRating] = useState(task.rating || 0);
  const [marks, setMarks] = useState(task.marks || 0);
  const [feedback, setFeedback] = useState(task.feedback || '');
  const [isUploading, setIsUploading] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const timerRef = useRef(null);

  // Helper to format seconds to HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (task.isTimerRunning && task.timerStartedAt) {
      const start = new Date(task.timerStartedAt).getTime();
      const tick = () => {
        const now = new Date().getTime();
        setActiveSeconds(Math.floor((now - start) / 1000));
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(timerRef.current);
      setActiveSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [task.isTimerRunning, task.timerStartedAt]);

  const handleStartTimer = async () => {
    try {
      await api.put(`/tasks/${task._id}/timer/start`);
      toast.success('Timer started');
      onUpdate();
    } catch (error) {
      toast.error('Failed to start timer');
    }
  };

  const handleStopTimer = async () => {
    try {
      await api.put(`/tasks/${task._id}/timer/stop`);
      toast.success('Timer stopped');
      onUpdate();
    } catch (error) {
      toast.error('Failed to stop timer');
    }
  };

  const statusColors = {
    'pending': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'completed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
    'reviewed': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800'
  };

  const priorityColors = {
    'low': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    'medium': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'high': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  };

  const statusIcons = {
    'pending': <Clock size={14} className="mr-1" />,
    'in-progress': <PlayCircle size={14} className="mr-1" />,
    'completed': <CheckCircle size={14} className="mr-1" />,
    'reviewed': <Star size={14} className="mr-1" />
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/tasks/${task._id}/status`, { status: newStatus });
      toast.success('Task status updated');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await api.post(`/tasks/${task._id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('File uploaded successfully');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitTask = async () => {
    try {
      await api.put(`/tasks/${task._id}/submit`);
      toast.success('Task submitted for review');
      onUpdate();
    } catch (error) {
      toast.error('Failed to submit task');
    }
  };

  const handleReviewSubmit = async () => {
    if (rating === 0) return toast.error('Please provide a rating');
    try {
      await api.put(`/tasks/${task._id}/review`, { rating, marks, feedback });
      toast.success('Review submitted successfully');
      setIsReviewing(false);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleDownload = async (index = 0) => {
    try {
      const response = await api.get(`/tasks/${task._id}/download?index=${index}`, {
        responseType: 'blob'
      });
      
      const attachment = task.attachments[index];
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment?.name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to download file';
      toast.error(errorMsg);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success('Task deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <div className="bg-secondary p-5 rounded-2xl transition-all duration-300 hover:shadow-xl border border-border-color mb-4 group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
      
      <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 
              className="text-lg font-bold text-text-primary cursor-pointer hover:text-primary-600 transition-colors"
              onClick={() => setShowDetails(true)}
            >
              {task.title}
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          <p className="text-xs text-text-secondary opacity-70">
            Assigned to <span className="font-semibold text-text-primary">{task.assignedTo?.name}</span> by <span className="font-semibold text-text-primary">{task.assignedBy?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDetails(true)}
            className="text-text-secondary hover:text-primary-600 p-1 rounded transition-colors relative" 
            title="Task Discussion & Activity"
          >
            <MessageSquare size={18} />
          </button>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center border uppercase tracking-wider ${statusColors[task.status]}`}>
            {statusIcons[task.status]}
            {task.status.replace('-', ' ')}
          </div>
          {task.totalTimeSpent > 0 && !task.isTimerRunning && (
            <div className="flex items-center text-[10px] font-bold text-text-secondary bg-secondary px-2 py-1 rounded-full border border-border-color">
              <Clock size={12} className="mr-1" />
              {formatTime(task.totalTimeSpent)}
            </div>
          )}
          {(user.role === 'admin' || user.role === 'manager') && (
            <button onClick={handleDeleteTask} className="text-text-secondary hover:text-red-600 p-1 rounded transition-colors" title="Delete Task">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="pl-2">
        <div 
          className="text-sm text-text-secondary mb-4 line-clamp-3 leading-relaxed cursor-pointer hover:opacity-80 prose prose-sm dark:prose-invert max-w-none"
          onClick={() => setShowDetails(true)}
          dangerouslySetInnerHTML={{ __html: task.description }}
        />

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {task.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-secondary border border-border-color text-text-secondary rounded text-[10px] font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-text-secondary mb-4 pb-4 border-b border-border-color">
          <div className="flex items-center text-red-500 font-semibold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
            <Clock size={14} className="mr-1" />
            Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}
          </div>
          
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {task.attachments.map((attachment, index) => (
                <button 
                  key={index}
                  onClick={() => handleDownload(index)}
                  className="flex items-center bg-background border border-border-color text-text-primary hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
                >
                  <Paperclip size={14} className="mr-2 text-primary-500" />
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate max-w-[140px]">{attachment.name}</span>
                      {attachment.uploadedByRole === 'employee' || (!attachment.uploadedByRole && index > 0) ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 whitespace-nowrap">Result File</span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800 whitespace-nowrap">Task File</span>
                      )}
                    </div>
                    {attachment.uploadedByName && (
                      <span className="text-[10px] text-text-secondary opacity-70 mt-0.5">
                        Uploaded by {attachment.uploadedByName}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employee Actions */}
        {user.role === 'employee' && task.status !== 'reviewed' && (
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            {task.isTimerRunning ? (
              <button 
                onClick={handleStopTimer} 
                className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/20 flex items-center group animate-pulse"
              >
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                Stop Timer ({formatTime(activeSeconds)})
              </button>
            ) : (
              (task.status === 'pending' || task.status === 'in-progress') && (
                <button 
                  onClick={handleStartTimer} 
                  className="bg-primary-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 flex items-center active:scale-95"
                >
                  <PlayCircle size={16} className="mr-2" />
                  Start Timer
                </button>
              )
            )}
            
            {(task.status === 'in-progress' || task.status === 'pending') && !task.isTimerRunning && (
              <div className="relative overflow-hidden inline-block">
                <button disabled={isUploading} className="bg-secondary border border-border-color text-text-primary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center shadow-sm disabled:opacity-50">
                  <Paperclip size={16} className="mr-2" />
                  {isUploading ? 'Uploading...' : ((task.attachments && task.attachments.length > 0) ? 'Add Another File' : 'Upload File')}
                </button>
                <input type="file" onChange={handleFileUpload} className="absolute top-0 left-0 opacity-0 w-full h-full cursor-pointer" />
              </div>
            )}

            {task.status === 'in-progress' && task.attachments && task.attachments.length > 0 && !task.isTimerRunning && (
              <button onClick={handleSubmitTask} className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-all shadow-md shadow-green-500/20 flex items-center active:scale-95">
                <CheckCircle size={16} className="mr-2" />
                Submit for Review
              </button>
            )}
          </div>
        )}

        {/* Admin/Manager Review Section */}
        {(user.role === 'admin' || user.role === 'manager') && task.status === 'completed' && !isReviewing && (
          <button onClick={() => setIsReviewing(true)} className="mt-2 bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all shadow-md shadow-purple-500/20 active:scale-95">
            Review Task
          </button>
        )}

        {isReviewing && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-xl border border-border-color animate-fade-in">
            <h4 className="text-sm font-bold text-text-primary mb-3">Review Submission</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Rating (1-5)</label>
                <StarRating rating={rating} setRating={setRating} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Marks (0-100)</label>
                <input type="number" min="0" max="100" value={marks} onChange={(e) => setMarks(e.target.value)} className="w-full px-3 py-2 bg-background border border-border-color rounded-lg text-sm text-text-primary focus:ring-primary-500 outline-none" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Feedback</label>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows="2" className="w-full px-3 py-2 bg-background border border-border-color rounded-lg text-sm text-text-primary focus:ring-primary-500 outline-none resize-none" placeholder="Provide constructive feedback..."></textarea>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReviewSubmit} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all shadow-md active:scale-95">Submit Review</button>
              <button onClick={() => setIsReviewing(false)} className="flex-1 bg-secondary border border-border-color text-text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-secondary/80 dark:hover:bg-gray-800 transition-all">Cancel</button>
            </div>
          </div>
        )}

        {/* Reviewed Information */}
        {task.status === 'reviewed' && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="text-sm font-semibold text-text-secondary mr-2">Rating:</span>
                <StarRating rating={task.rating} readOnly />
              </div>
              <div className="text-sm font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md">
                Score: {task.marks}/100
              </div>
            </div>
            {task.feedback && (
              <div className="mt-2 text-sm text-text-secondary flex items-start">
                <MessageSquare size={16} className="mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="italic">"{task.feedback}"</p>
              </div>
            )}
          </div>
        )}

        <Modal isOpen={showDetails} onClose={() => setShowDetails(false)}>
          <TaskDetails taskId={task._id} onClose={() => setShowDetails(false)} />
        </Modal>
      </div>
    </div>
  );
};

export default TaskCard;
