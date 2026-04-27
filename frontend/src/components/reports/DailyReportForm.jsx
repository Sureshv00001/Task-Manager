import React, { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Send, FileText, CheckCircle } from 'lucide-react';

const DailyReportForm = ({ onReportSubmitted }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await api.post('/reports', { content });
      toast.success('Daily report submitted successfully');
      setContent('');
      setSubmittedToday(true);
      if (onReportSubmitted) onReportSubmitted();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (submittedToday) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-green-500/30 bg-green-500/5 text-center animate-fade-in">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={24} />
        </div>
        <h3 className="text-lg font-bold text-text-primary">Report Submitted!</h3>
        <p className="text-sm text-text-secondary mt-1">Great job! Your daily report has been sent to your manager.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-border-color bg-secondary/30 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">Daily Report</h3>
          <p className="text-xs text-text-secondary">Summary of today's work and progress</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you work on today? Any blockers or accomplishments?"
          className="w-full px-4 py-3 bg-background border border-border-color rounded-xl text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px] transition-all resize-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <><Send size={18} /> Submit Daily Report</>
          )}
        </button>
      </form>
    </div>
  );
};

export default DailyReportForm;
