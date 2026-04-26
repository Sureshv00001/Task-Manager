import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { AlertTriangle, Shield, ShieldAlert, RefreshCw, Sparkles } from 'lucide-react';

const RiskAlerts = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/risk-alerts');
      setRisks(res.data);
      setLastFetched(new Date());
    } catch (error) {
      console.error('Failed to load risk alerts');
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    high: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      icon: <ShieldAlert size={18} className="text-red-500" />
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      icon: <AlertTriangle size={18} className="text-amber-500" />
    },
    low: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
      icon: <Shield size={18} className="text-blue-500" />
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-border-color shadow-xl bg-secondary mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold text-text-primary flex items-center">
          <Sparkles className="mr-3 text-purple-500" size={24} />
          AI Risk Alerts
        </h3>
        <button
          onClick={fetchRisks}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            loading
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-400 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:-translate-y-0.5'
          }`}
        >
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Scan Now'}
        </button>
      </div>

      {lastFetched && (
        <p className="text-[10px] text-text-secondary mb-4 uppercase tracking-wider font-bold">
          Last scanned: {lastFetched.toLocaleTimeString()}
        </p>
      )}

      {!lastFetched && !loading && (
        <div className="text-center py-10 rounded-2xl border border-dashed border-border-color bg-primary/5">
          <Sparkles size={32} className="mx-auto text-purple-400 mb-3 opacity-50" />
          <p className="text-sm text-text-secondary font-medium">Click "Scan Now" to run AI risk analysis</p>
          <p className="text-[10px] text-text-secondary opacity-50 mt-1">Powered by Google Gemini</p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-primary/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      )}

      {lastFetched && !loading && risks.length === 0 && (
        <div className="text-center py-10 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800">
          <Shield size={32} className="mx-auto text-green-500 mb-3" />
          <p className="text-sm font-bold text-green-700 dark:text-green-400">All Clear!</p>
          <p className="text-[10px] text-text-secondary mt-1">No tasks are currently at risk of missing their deadline.</p>
        </div>
      )}

      {!loading && risks.length > 0 && (
        <div className="space-y-3">
          {risks.map((risk, i) => {
            const colors = riskColors[risk.riskLevel] || riskColors.low;
            return (
              <div key={i} className={`p-4 rounded-2xl border ${colors.bg} ${colors.border} transition-all hover:-translate-y-0.5`}>
                <div className="flex items-start gap-3">
                  {colors.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-text-primary truncate">{risk.taskTitle}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${colors.badge}`}>
                        {risk.riskLevel}
                      </span>
                    </div>
                    <p className={`text-xs ${colors.text} mb-1`}>{risk.reason}</p>
                    <p className="text-[10px] text-text-secondary italic">💡 {risk.suggestion}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiskAlerts;
