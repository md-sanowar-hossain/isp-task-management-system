
import React from 'react';
import { Task } from '../types';
import { FileText, Printer, TrendingUp, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface AnalyticsReportProps {
  tasks: Task[];
}

const AnalyticsReport: React.FC<AnalyticsReportProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Complete').length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const printReport = () => window.print();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto print:m-0 print:p-0">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-12 print:shadow-none print:border-none relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0 print:hidden"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3">Management Audit Report</h2>
            <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs">
              <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <FileText size={14} className="text-rose-600" /> 
                System ID: DK-X900
              </span>
              <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                <TrendingUp size={14} className="text-emerald-600" />
                Date: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
          <button onClick={printReport} className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 print:hidden">
            <Printer size={18} strokeWidth={3} /> Print Audit
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Service Volume</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900">{total}</p>
              <span className="text-xs font-bold text-slate-400">Tickets</span>
            </div>
          </div>
          <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 shadow-sm">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Total Resolved</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-emerald-600">{completed}</p>
              <CheckCircle2 size={20} className="text-emerald-400" />
            </div>
          </div>
          <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 shadow-sm">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Pending Queue</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-amber-600">{pending}</p>
              <Clock size={20} className="text-amber-400" />
            </div>
          </div>
          <div className="p-8 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4">Efficiency Rate</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-rose-600">{rate}%</p>
              <TrendingUp size={20} className="text-rose-400" />
            </div>
          </div>
        </div>

        <div className="relative z-10 p-8 md:p-10 bg-slate-900 rounded-[2rem] text-white">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-amber-400" size={24} />
            <h4 className="text-lg font-black uppercase tracking-tight">Executive Insight</h4>
          </div>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
            Service operations currently showing a <span className="text-white font-black">{rate}% resolution efficiency</span>. 
            {rate < 70 ? " Warning: High latency in pending tickets may impact regional service stability. Immediate technician reallocation suggested." : " Stable operational flow detected. Maintain current response protocols for optimal performance."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReport;
