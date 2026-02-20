
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Tag, MapPin } from 'lucide-react';

interface WorkspaceManagementProps {
  taskTypes: string[];
  setTaskTypes: (updater: (prev: string[]) => string[]) => void;
  areas: string[];
  setAreas: (updater: (prev: string[]) => string[]) => void;
}

const WorkspaceManagement: React.FC<WorkspaceManagementProps> = ({ taskTypes, setTaskTypes, areas, setAreas }) => {
  const [newType, setNewType] = useState('');
  const [newArea, setNewArea] = useState('');

  const addItem = (setList: (updater: (prev: string[]) => string[]) => void, item: string, setItem: (s: string) => void) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setList(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setItem('');
  };

  const removeItem = (setList: (updater: (prev: string[]) => string[]) => void, item: string) => {
    setList(prev => {
      if (prev.length <= 1) {
        alert("Integrity Error: You must have at least one valid option.");
        return prev;
      }
      return prev.filter(i => i !== item);
    });
  };

  const cardClass = "bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8 transition-all hover:shadow-2xl";
  const inputClass = "flex-1 px-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-rose-100 outline-none font-bold text-sm text-slate-900 placeholder:text-slate-300 transition-all";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
      {/* Task Types Management */}
      <div className={cardClass}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Tag size={24} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Task Categories</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define Service Types</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            className={inputClass} 
            placeholder="New Category..." 
            value={newType} 
            onChange={(e) => setNewType(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem(setTaskTypes, newType, setNewType)}
          />
          <button onClick={() => addItem(setTaskTypes, newType, setNewType)} className="p-3.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 shadow-lg transition-all active:scale-95"><Plus size={24} /></button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {taskTypes.map(type => (
            <div key={type} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
              <span className="font-bold text-slate-700">{type}</span>
              <DeleteWithConfirm onConfirm={() => removeItem(setTaskTypes, type)}>
                <Trash2 size={20} />
              </DeleteWithConfirm>
            </div>
          ))}
        </div>
      </div>

      {/* Areas Management */}
      <div className={cardClass}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><MapPin size={24} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Service Regions</h3>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-0.5">Coverage Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            className={inputClass} 
            placeholder="New Region..." 
            value={newArea} 
            onChange={(e) => setNewArea(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem(setAreas, newArea, setNewArea)}
          />
          <button onClick={() => addItem(setAreas, newArea, setNewArea)} className="p-3.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 shadow-lg transition-all active:scale-95"><Plus size={24} /></button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {areas.map(area => (
            <div key={area} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
              <span className="font-bold text-slate-700">{area}</span>
              <DeleteWithConfirm onConfirm={() => removeItem(setAreas, area)}>
                <Trash2 size={20} />
              </DeleteWithConfirm>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceManagement;

function DeleteWithConfirm({ children, onConfirm }: { children: React.ReactNode; onConfirm: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const toggle = () => {
    if (!btnRef.current) return setOpen(s => !s);
    const rect = btnRef.current.getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    const top = rect.top + rect.height + 8;
    setCoords({ top, left });
    setOpen(s => !s);
  };

  return (
    <>
      <button ref={btnRef} onClick={toggle} className="p-2 text-slate-300 hover:text-rose-600 transition-all rounded-lg hover:bg-rose-50">
        {children}
      </button>
      {open && coords && createPortal(
        <div style={{ position: 'fixed', top: coords.top, left: coords.left, transform: 'translateX(-50%)' }}>
          <div className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50">
            <div className="text-sm font-black text-slate-900 mb-2">Confirm deletion?</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
              <button onClick={() => { onConfirm(); setOpen(false); }} className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black">Delete</button>
            </div>
          </div>
        </div>, document.body)
      }
    </>
  );
}
