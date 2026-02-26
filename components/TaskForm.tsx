
import React, { useState, useRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Status } from '../types';
import { STATUSES } from '../constants';
import { format } from 'date-fns';
import { Calendar, AlignLeft } from 'lucide-react';

interface TaskFormProps {
  taskTypes: string[];
  areas: string[];
  onSave: (task: { date: string; userId: string; taskType: string; area: string; status: Status; remarks?: string }) => void;
  onCancel?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ taskTypes, areas, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    userId: '',
    taskType: '',
    area: '',
    status: 'Pending' as Status,
    remarks: '',
  });

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      // Preferred: showPicker() when supported (Chrome/Edge)
      (el as any).showPicker?.();
    } catch (e) {
      // ignore
    }
    try {
      el.focus();
      el.click();
    } catch (e) {}
  };

  // react-datepicker state
  const [dateObj, setDateObj] = useState<Date>(new Date());

  const DateInput = React.forwardRef<HTMLButtonElement, any>(({ value, onClick }, ref) => (
    <button type="button" onClick={onClick} ref={ref} className={`${inputClassBase} text-left`}> 
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-900">{value || format(new Date(), 'MM/dd/yyyy')}</div>
        <div className="text-slate-400">
          <Calendar size={18} strokeWidth={3} />
        </div>
      </div>
    </button>
  ));
  DateInput.displayName = 'DateInput';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskType || !formData.area || !formData.status) {
      alert("Please fill all required fields.");
      return;
    }
    // ensure date from dateObj is sent in ISO format expected by parent
    const payload = { ...formData, date: format(dateObj, 'yyyy-MM-dd') } as { date: string; userId: string; taskType: string; area: string; status: Status; remarks?: string };
    onSave(payload);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      userId: '',
      taskType: '',
      area: '',
      status: 'Pending',
      remarks: '',
    });
    setDateObj(new Date());
  };

  const inputClassBase = "w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-500 shadow-sm";
  const selectClass = `${inputClassBase} appearance-none`;
  const labelClass = "block text-[12px] font-black text-slate-600 uppercase tracking-widest mb-2 ml-1";

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Date Field */}
        <div className="lg:col-span-1">
          <label className={labelClass}>Date</label>
          <div className="relative group">
            <ReactDatePicker
              selected={dateObj}
              onChange={(d: Date | null) => { if (d) setDateObj(d); }}
              customInput={<DateInput />}
              dateFormat="MM/dd/yyyy"
              popperPlacement="bottom-start"
              required
            />
          </div>
        </div>

        {/* User ID Field */}
        <div className="lg:col-span-1">
          <label className={labelClass}>User ID</label>
          <input
            type="text"
            placeholder="e.g. dk123"
            className={inputClassBase}
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          />
        </div>

        {/* Task Type Field */}
        <div className="lg:col-span-1">
          <label className={labelClass}>Task Type</label>
          <div className="relative">
            <select
              required
              className={`${selectClass} ${!formData.taskType ? 'text-slate-500' : 'text-slate-900'}`}
              value={formData.taskType}
              onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
            >
              <option value="" disabled>Select Type</option>
              {taskTypes.map(type => <option key={type} value={type} className="text-slate-900">{type}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Area Field */}
        <div className="lg:col-span-1">
          <label className={labelClass}>Area</label>
          <div className="relative">
            <select
              required
              className={`${selectClass} ${!formData.area ? 'text-slate-500' : 'text-slate-900'}`}
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            >
              <option value="" disabled>Select Area</option>
              {areas.map(area => <option key={area} value={area} className="text-slate-900">{area}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Status Field */}
        <div className="lg:col-span-1">
          <label className={labelClass}>Status</label>
          <div className="relative">
            <select
              required
              className={`${selectClass} ${!formData.status ? 'text-slate-500' : 'text-slate-900'}`}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
            >
              <option value="" disabled>Select Status</option>
              {STATUSES.map(status => <option key={status} value={status} className="text-slate-900">{status}</option>)}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks Field - Extra Option */}
      <div className="w-full">
        <label className={labelClass}>Remarks / Note</label>
        <div className="relative group">
          <input
            type="text"
            placeholder="Add any additional details or observations here..."
            className={inputClassBase}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
            <AlignLeft size={18} strokeWidth={3} />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-12 py-4 bg-[#e11d48] text-white font-black rounded-2xl hover:bg-[#be123c] transition-all shadow-xl shadow-rose-200 active:scale-95 text-base uppercase tracking-wider"
        >
          Commit Task
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
