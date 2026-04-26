import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  PlusCircle, Edit, CheckCircle, MessageSquare, 
  Upload, FileText, Star, AlertCircle 
} from 'lucide-react';
import api from '../../utils/api';

const actionIcons = {
  task_created: { icon: <PlusCircle size={16} />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  task_updated: { icon: <Edit size={16} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  status_changed: { icon: <CheckCircle size={16} />, color: 'text-green-500', bg: 'bg-green-500/10' },
  comment_added: { icon: <MessageSquare size={16} />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  file_uploaded: { icon: <Upload size={16} />, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  task_submitted: { icon: <FileText size={16} />, color: 'text-blue-600', bg: 'bg-blue-600/10' },
  task_reviewed: { icon: <Star size={16} />, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  default: { icon: <AlertCircle size={16} />, color: 'text-gray-500', bg: 'bg-gray-500/10' }
};

const ActivityTimeline = ({ taskId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/tasks/${taskId}/activity`);
        setLogs(res.data);
      } catch (error) {
        console.error('Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [taskId]);

  if (loading) return <div className="p-6 animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-secondary/50 rounded-xl"></div>)}
  </div>;

  if (logs.length === 0) return (
    <div className="p-10 text-center text-text-secondary opacity-50">
      <AlertCircle size={32} className="mx-auto mb-2" />
      <p>No activity recorded yet</p>
    </div>
  );

  return (
    <div className="p-6 relative">
      {/* Vertical Line */}
      <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-border-color/30"></div>

      <div className="space-y-8">
        {logs.map((log, idx) => {
          const config = actionIcons[log.action] || actionIcons.default;
          return (
            <div key={log._id} className="relative flex items-start group">
              {/* Icon Circle */}
              <div className={`relative z-10 w-8 h-8 rounded-full ${config.bg} ${config.color} flex items-center justify-center border border-border-color/50 shadow-sm transition-transform group-hover:scale-110`}>
                {config.icon}
              </div>

              {/* Content */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-text-primary">
                    {log.user?.name || 'System'}
                  </p>
                  <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                    {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                  {log.details}
                </p>
                {log.metadata && log.metadata.size > 0 && (
                  <div className="mt-2 text-[10px] bg-secondary/50 p-2 rounded-lg border border-border-color/30 text-text-secondary italic">
                    {JSON.stringify(Object.fromEntries(log.metadata))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
