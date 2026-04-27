import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { format } from 'date-fns';
import { FileText, User as UserIcon, Calendar, Check, ExternalLink, Paperclip, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');

const ReportList = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/reports/${id}/read`);
      setReports(reports.map(r => r._id === id ? { ...r, status: 'read' } : r));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      setReports(reports.filter(r => r._id !== id));
      toast.success('Report deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete report');
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <FileText className="text-primary-600" /> Daily Reports
        </h2>
      </div>

      {reports.length === 0 ? (
        <div className="glass-panel p-12 text-center text-text-secondary opacity-50 rounded-2xl border border-border-color">
          No reports found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(report => (
            <div key={report._id} className={`glass-panel p-5 rounded-2xl border transition-all ${report.status === 'submitted' ? 'border-primary-500/30 bg-primary-500/5' : 'border-border-color bg-secondary/30'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center border border-border-color text-primary-600 font-bold">
                    {report.employee.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">{report.employee.name}</h4>
                    <p className="text-[10px] text-text-secondary flex items-center gap-1 uppercase tracking-wider">
                      <Calendar size={10} /> {format(new Date(report.createdAt), 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(user._id === report.employee._id || user.role === 'admin') && (
                    <button 
                      onClick={() => handleDelete(report._id)}
                      className="p-1.5 text-text-secondary hover:text-red-500 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {report.status === 'submitted' ? (
                    <button 
                      onClick={() => handleMarkAsRead(report._id)}
                      className="text-[10px] font-bold bg-primary-600 text-white px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-primary-700 transition-colors"
                    >
                      <Check size={12} /> Mark Read
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Check size={12} /> Read
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-background/50 p-3 rounded-xl border border-border-color/50 mb-3">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap italic">
                  "{report.content}"
                </p>
              </div>

              {/* Attachments Section */}
              {report.attachments && report.attachments.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Paperclip size={10} /> Attachments ({report.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {report.attachments.map((file, idx) => (
                      <a
                        key={idx}
                        href={`${API_BASE_URL}${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border-color px-2.5 py-1.5 rounded-lg text-[10px] text-text-primary transition-all group"
                        title={file.name}
                      >
                        <FileText size={12} className="text-primary-500" />
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        <Download size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-text-secondary font-medium">
                <span>Tagged Manager: {report.manager.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportList;
