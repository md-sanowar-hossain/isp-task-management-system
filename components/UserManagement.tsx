
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Role } from '../types';
import { Plus, X, Trash2, UserCheck, ShieldCheck } from 'lucide-react';

interface ExtendedUser extends User {
  fullName?: string;
  status?: 'Active' | 'Disabled';
  createdAt?: string;
  password?: string;
}

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  // REQUIREMENT 3: Lazy initialization for User registry
  const [users, setUsers] = useState<ExtendedUser[]>(() => {
    const stored = localStorage.getItem('dklink_users');
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      // Ensure IDs exist for robust deletion
      return parsed.map((u: any) => ({
        ...u,
        id: u.id || Math.random().toString(36).substring(2, 11),
        fullName: u.fullName || u.username || 'System User',
        role: (u.role && u.role.toLowerCase() === 'admin') ? 'Admin' : 'User',
        status: u.status || 'Active'
      }));
    } catch (e) {
      return [];
    }
  });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ 
    username: '', 
    fullName: '', 
    password: '', 
    role: 'User' as Role 
  });

  // REQUIREMENT 1: Immediate persistence for user deletion
  const deleteUser = (userId: string) => {
    // prevent removing your own session
    if (userId === currentUser.id) {
      alert("Security: You cannot remove your own administrative session.");
      return;
    }

    // identify the main admin (first registered admin) and prevent other admins deleting them
    const mainAdmin = users.find(u => u.role === 'Admin');
    if (mainAdmin && userId === mainAdmin.id && currentUser.id !== mainAdmin.id) {
      alert("Action blocked: The primary administrator cannot be deleted by other admins.");
      return;
    }

    // perform immediate deletion (confirmation is provided by inline popover)
    setUsers(prev => {
      const nextUsers = prev.filter(u => u.id !== userId);
      localStorage.setItem('dklink_users', JSON.stringify(nextUsers));
      return nextUsers;
    });
  };

  const updateRole = (userId: string, newRole: Role) => {
    // prevent changing your own role
    if (userId === currentUser.id) return;

    // prevent other admins from modifying the primary admin's role
    const mainAdmin = users.find(u => u.role === 'Admin');
    if (mainAdmin && userId === mainAdmin.id && currentUser.id !== mainAdmin.id) {
      alert('Action blocked: The primary administrator role cannot be changed by other admins.');
      return;
    }

    setUsers(prev => {
      const nextUsers = prev.map(u => u.id === userId ? { ...u, role: newRole } : u);
      localStorage.setItem('dklink_users', JSON.stringify(nextUsers));
      return nextUsers;
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.password) return;

    if (users.some(u => u.username.toLowerCase() === newUserData.username.toLowerCase())) {
      alert("Conflict: Username already registered.");
      return;
    }

    const newUser: ExtendedUser = {
      id: Math.random().toString(36).substring(2, 11),
      username: newUserData.username.toLowerCase(),
      fullName: newUserData.fullName || newUserData.username,
      password: newUserData.password,
      role: newUserData.role,
      status: 'Active',
      createdAt: new Date().toLocaleDateString()
    };

    setUsers(prev => {
      const nextUsers = [...prev, newUser];
      localStorage.setItem('dklink_users', JSON.stringify(nextUsers));
      return nextUsers;
    });
    setIsAddingUser(false);
    setNewUserData({ username: '', fullName: '', password: '', role: 'User' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Access Control</h3>
          <p className="text-sm text-slate-500 font-medium">Manage team hierarchy and system permissions</p>
        </div>
        <button
          onClick={() => setIsAddingUser(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#e11d48] text-white rounded-2xl hover:bg-[#be123c] transition-all font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-200"
        >
          <Plus size={18} strokeWidth={3} />
          Register Member
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Member</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">ID/Username</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Clearance</th>
              <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isMe = user.id === currentUser.id;
              const displayName = user.fullName || user.username;
              return (
                <tr key={user.id} className={`group transition-colors ${isMe ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border-2 ${isMe ? 'bg-rose-600 text-white border-rose-500' : 'bg-white text-slate-400 border-slate-100'}`}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-base flex items-center gap-2">
                            {displayName}
                            {isMe && <span className="flex items-center gap-1 text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest"><UserCheck size={10} /> You</span>}
                            {(!isMe && users.find(u => u.role === 'Admin')?.id === user.id) && (
                              <span className="flex items-center gap-1 text-[9px] font-black bg-slate-800 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Main Admin</span>
                            )}
                          </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{user.username}</span>
                  </td>
                  <td className="px-8 py-6">
                    {isMe ? (
                      <div className="flex items-center gap-2 text-[#e11d48] font-black text-sm uppercase tracking-wider">
                        <ShieldCheck size={16} strokeWidth={3} />
                        {user.role}
                      </div>
                    ) : (
                      <div className="relative inline-block w-48">
                        {(() => {
                          const mainAdminId = users.find(u => u.role === 'Admin')?.id;
                          const isMainAdmin = mainAdminId === user.id;
                          const disableSelect = isMainAdmin && currentUser.id !== mainAdminId;
                          return (
                            <>
                              <select 
                                value={user.role} 
                                onChange={(e) => updateRole(user.id, e.target.value as Role)} 
                                disabled={disableSelect}
                                className={`w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 outline-none focus:border-rose-500 transition-all cursor-pointer appearance-none ${disableSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <option value="User" className="text-slate-900 font-bold">Standard User</option>
                                <option value="Admin" className="text-slate-900 font-bold">Administrator</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {!isMe ? (
                      (() => {
                        const mainAdminId = users.find(u => u.role === 'Admin')?.id;
                        const isMainAdmin = mainAdminId === user.id;
                        // hide delete for primary admin when current user is not primary admin
                        if (isMainAdmin && currentUser.id !== mainAdminId) {
                          return (
                            <span className="inline-flex items-center gap-2 px-3 py-2 text-[11px] font-black bg-slate-100 text-slate-500 rounded-full">Protected</span>
                          );
                        }
                        return (
                          <DeleteWithConfirm onConfirm={() => deleteUser(user.id)}>
                            <Trash2 size={20} />
                          </DeleteWithConfirm>
                        );
                      })()
                    ) : <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-3">Owner</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">New Registration</h3>
              <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              <input type="text" required placeholder="Full Name" className="w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl font-bold text-slate-900" value={newUserData.fullName} onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })} />
              <input type="text" required placeholder="Username" className="w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl font-bold text-slate-900" value={newUserData.username} onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })} />
              <input type="password" required placeholder="Password" className="w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl font-bold text-slate-900" value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} />
              <select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as Role })} className="w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl font-bold text-slate-900">
                <option value="User">Standard Operator</option>
                <option value="Admin">System Administrator</option>
              </select>
              <button type="submit" className="w-full py-5 bg-[#e11d48] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-rose-900/20">Register Member</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

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
      <button ref={btnRef} onClick={toggle} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
        {children}
      </button>
      {open && coords && createPortal(
        <div style={{ position: 'fixed', top: coords.top, left: coords.left, transform: 'translateX(-50%)' }}>
          <div className="w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50">
            <div className="text-sm font-black text-slate-900 mb-2">CRITICAL: Permanently delete this user?</div>
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
