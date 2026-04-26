import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StarRating from '../ui/StarRating';
import PerformanceCharts from './PerformanceCharts';
import WeeklyTimesheet from '../dashboard/WeeklyTimesheet';
import { Download, FileText, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PerformanceSummary = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await api.get('/users/performance');
        setPerformance(res.data);
      } catch (error) {
        console.error('Failed to load performance');
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Employee Performance Report', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Name", "Email", "Total Tasks", "Completed", "Avg Marks", "Avg Rating"];
    const tableRows = performance.map(emp => [
      emp.name,
      emp.email,
      emp.totalTasks,
      emp.completedTasks,
      `${emp.avgMarks}/100`,
      emp.avgRating
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillStyle: 'fill', fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    doc.save('performance_report.pdf');
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Total Tasks", "Completed", "Avg Marks", "Avg Rating"];
    const rows = performance.map(emp => [
      emp.name,
      emp.email,
      emp.totalTasks,
      emp.completedTasks,
      emp.avgMarks,
      emp.avgRating
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "performance_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center py-10">Loading performance data...</div>;

  return (
    <div className="space-y-8">
      <PerformanceCharts />
      
      <WeeklyTimesheet />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">Enterprise Analytics</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={exportCSV}
            className="flex items-center px-4 py-2 bg-secondary border border-border-color rounded-xl text-text-primary text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
          >
            <Table size={16} className="mr-2 text-green-600" />
            Export CSV
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
          >
            <Download size={16} className="mr-2" />
            Download PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {performance.map((emp) => (
        <div key={emp._id} className="glass-panel p-6 rounded-2xl border border-border-color hover-scale">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {emp.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-lg">{emp.name}</h3>
              <p className="text-sm text-text-secondary">{emp.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-500/10 dark:bg-blue-500/10 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50 text-center">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Completed</p>
              <p className="text-2xl font-bold text-text-primary">{emp.completedTasks} <span className="text-sm font-normal text-text-secondary">/ {emp.totalTasks}</span></p>
            </div>
            
            <div className="bg-purple-500/10 dark:bg-purple-500/10 rounded-xl p-3 border border-purple-100 dark:border-purple-800/50 text-center">
              <p className="text-xs text-purple-600 uppercase tracking-wider font-semibold mb-1">Avg Score</p>
              <p className="text-2xl font-bold text-purple-700">{emp.avgMarks || 0}<span className="text-sm font-normal text-purple-400">/100</span></p>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center bg-yellow-500/10 rounded-xl p-3 border border-yellow-100 dark:border-yellow-900/30">
            <p className="text-xs text-yellow-600 uppercase tracking-wider font-semibold mb-1">Avg Rating</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-yellow-600">{emp.avgRating || 0}</span>
              <StarRating rating={Math.round(emp.avgRating || 0)} readOnly />
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default PerformanceSummary;
