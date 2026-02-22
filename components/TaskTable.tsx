
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, Status, User } from '../types';
import { Trash2, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  currentUser: User;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Status) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({ tasks, currentUser, onDelete, onUpdateStatus }) => {
  // Normalize role check for robust permission handling
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">Created By</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">Completed By</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">Task Type</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">Area</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">Remarks</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-5 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-slate-400 font-bold">
                  No tasks recorded in the registry.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-all duration-300 animate-in fade-in slide-in-from-left-2 group">
                  <td className="px-6 py-5 text-sm font-bold text-slate-900">{task.serialNo}</td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-medium">{task.date}</td>
                  <td className="px-6 py-5 text-sm text-slate-900 font-black">{task.userId}</td>
                  <td className="px-6 py-5 text-sm text-slate-700 font-medium">{task.createdBy}</td>
                  <td className="px-6 py-5 text-sm text-slate-700 font-medium">{(task as any).completedBy || '—'}</td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-bold">{task.taskType}</td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-bold">{task.area}</td>
                  <td className="px-6 py-5 text-sm">
                    {task.remarks ? (
                      <div className="flex items-start gap-2 max-w-[200px]" title={task.remarks}>
                        <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="text-slate-500 text-xs italic font-medium truncate">{task.remarks}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[10px] uppercase font-bold tracking-widest">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      task.status === 'Complete' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700 shadow-sm'
                    }`}>
                      {task.status === 'Complete' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 relative">
                      {/* Inline confirmation popover state */}
                      {/** using local state to track which task is pending deletion */}
                      
                      {/* Ownership Check Fix: verify against username as recorded in App.tsx addTask */}
                      {(isAdmin || task.createdBy === currentUser.username) && (
                        <button
                          onClick={() => onUpdateStatus(task.id, task.status === 'Complete' ? 'Pending' : 'Complete')}
                          className="p-2 text-slate-400 hover:text-emerald-600 transition-all bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md active:scale-90"
                          title="Toggle Status"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      
                      {(isAdmin || task.createdBy === currentUser.username) && (
                        <DeleteWithConfirm onConfirm={() => onDelete(task.id)}>
                          <Trash2 size={18} />
                        </DeleteWithConfirm>
                      )}

                      {!(isAdmin || task.createdBy === currentUser.username) && (
                        <div title="Restricted access" className="p-2 text-slate-200">
                          <AlertCircle size={18} />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;

// Small inline delete confirmation component used by tables
function DeleteWithConfirm({ children, onConfirm }: { children: React.ReactNode; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
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
      <button ref={btnRef} onClick={toggle} className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 transition-all bg-white rounded-xl border border-rose-100 hover:border-rose-600 shadow-sm active:scale-90">
        {children}
      </button>
              {open && coords && createPortal(
        <div style={{ position: 'fixed', top: coords.top, left: coords.left, transform: 'translateX(-50%)' }}>
          <div className="w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50">
            <div className="text-sm font-black text-slate-900 mb-2">Confirm deletion?</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
              <button
  onClick={async () => {
    try {
      await onConfirm();
    } finally {
      setOpen(false);
    }
  }}
  className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black"
>
  Delete
</button>
            </div>
          </div>
        </div>, document.body)
      }
    </>
  );
}
