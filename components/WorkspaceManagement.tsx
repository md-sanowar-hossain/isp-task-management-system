
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Tag, MapPin } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';

interface WorkspaceManagementProps {
  taskTypes: string[];
  setTaskTypes: (updater: (prev: string[]) => string[]) => void;
  areas: string[];
  setAreas: (updater: (prev: string[]) => string[]) => void;
  currentUser: User | null;
}

const WorkspaceManagement: React.FC<WorkspaceManagementProps> = ({ taskTypes, setTaskTypes, areas, setAreas, currentUser }) => {
  const [newType, setNewType] = useState('');
  const [newArea, setNewArea] = useState('');

  // load categories & regions from Supabase for this workspace and subscribe to realtime updates
  useEffect(() => {
    let channel: any | null = null;

    const load = async () => {
      if (!currentUser || !currentUser.workspace_id) return;
      try {
        const { data: cats } = await supabase
          .from('task_categories')
          .select('*')
          .eq('workspace_id', currentUser.workspace_id);
        if (cats && Array.isArray(cats)) setTaskTypes(() => cats.map((c: any) => c.name));

        const { data: regs } = await supabase
          .from('service_regions')
          .select('*')
          .eq('workspace_id', currentUser.workspace_id);
        if (regs && Array.isArray(regs)) setAreas(() => regs.map((r: any) => r.name));
      } catch (err) {
        console.warn('Could not load workspace lists, falling back to local state.', err);
      }
    };

    const setup = async () => {
      await load();

      try {
        channel = supabase
          .channel(`lists_ws_${currentUser?.workspace_id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'task_categories', filter: `workspace_id=eq.${currentUser?.workspace_id}` }, (payload) => {
            console.log('realtime task_categories event', payload);
            load();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'service_regions', filter: `workspace_id=eq.${currentUser?.workspace_id}` }, (payload) => {
            console.log('realtime service_regions event', payload);
            load();
          })
          .subscribe();
      } catch (err) {
        console.warn('Could not open realtime channel for workspace lists', err);
      }
    };

    setup();

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        try { channel.unsubscribe(); } catch (e) { /* ignore */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const addItem = async (setList: (updater: (prev: string[]) => string[]) => void, item: string, setItem: (s: string) => void, table: 'task_categories' | 'service_regions') => {
    const trimmed = item.trim();
    if (!trimmed) return;
    // try to persist to Supabase when possible
    if (currentUser && currentUser.workspace_id) {
      try {
        await supabase.from(table).insert([{ name: trimmed, workspace_id: currentUser.workspace_id }]);
      } catch (err) {
        console.warn('Could not insert into', table, err);
      }
    }
    setList(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setItem('');
  };

  const removeItem = async (setList: (updater: (prev: string[]) => string[]) => void, item: string, table?: 'task_categories' | 'service_regions') => {
    // attempt DB delete if workspace available
    if (currentUser && currentUser.workspace_id && table) {
      try {
        await supabase.from(table).delete().eq('name', item).eq('workspace_id', currentUser.workspace_id);
      } catch (err) {
        console.warn('Could not delete from', table, err);
      }
    }

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
            onKeyPress={(e) => e.key === 'Enter' && addItem(setTaskTypes, newType, setNewType, 'task_categories')}
          />
          <button onClick={() => addItem(setTaskTypes, newType, setNewType, 'task_categories')} className="p-3.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 shadow-lg transition-all active:scale-95"><Plus size={24} /></button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {taskTypes.map(type => (
            <div key={type} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
              <span className="font-bold text-slate-700">{type}</span>
              <DeleteWithConfirm onConfirm={() => removeItem(setTaskTypes, type, 'task_categories')}>
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
            onKeyPress={(e) => e.key === 'Enter' && addItem(setAreas, newArea, setNewArea, 'service_regions')}
          />
          <button onClick={() => addItem(setAreas, newArea, setNewArea, 'service_regions')} className="p-3.5 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 shadow-lg transition-all active:scale-95"><Plus size={24} /></button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {areas.map(area => (
            <div key={area} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
              <span className="font-bold text-slate-700">{area}</span>
              <DeleteWithConfirm onConfirm={() => removeItem(setAreas, area, 'service_regions')}>
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

// Reuse TaskTable's inline DeleteWithConfirm to keep delete UX consistent
function DeleteWithConfirm({ children, onConfirm }: { children: React.ReactNode; onConfirm: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  const handleClick = () => {
    if (!btnRef.current) return;

    const rect = btnRef.current.getBoundingClientRect();

    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.left - 8,
    });

    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 transition-all bg-white rounded-xl border border-rose-100 hover:border-rose-600 shadow-sm active:scale-90"
      >
        {children}
      </button>

      {open && position &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              transform: 'translate(-100%, -50%)',
              zIndex: 9999,
            }}
          >
            <div className="w-60 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-sm font-bold text-slate-800 mb-3">Confirm deletion?</div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    onConfirm();
                    setOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
