import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Role } from '../types';
import { Plus, X, Trash2, UserCheck, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ExtendedUser extends User {
  fullName?: string;
  password?: string;
  created_at?: string;
}

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {

  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'User' as Role
  });

  // ✅ LOAD USERS FROM SUPABASE
  const fetchUsers = async () => {
    // only load users from the current workspace
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('workspace_id', currentUser.workspace_id)
      .order('created_at', { ascending: false });

    setUsers(data || []);
  };

  useEffect(() => {
    let channel: any | null = null;

    const setup = async () => {
      await fetchUsers();

      try {
        channel = supabase
          .channel(`users_ws_${currentUser.workspace_id}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `workspace_id=eq.${currentUser.workspace_id}` }, (payload) => {
            console.log('realtime users event', payload);
            fetchUsers();
          })
          .subscribe();
      } catch (err) {
        console.warn('Could not open realtime channel for users', err);
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

  // ✅ DELETE USER
const deleteUser = async (userId: string) => {
  if (userId === currentUser.id) {
    alert("You cannot delete your own account.");
    return;
  }

  await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  fetchUsers();
};
  // ✅ UPDATE ROLE
  const updateRole = async (userId: string, newRole: Role) => {

    if (userId === currentUser.id) return;

    await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    fetchUsers();
  };

  // ✅ CREATE USER
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserData.username || !newUserData.password) return;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', newUserData.username)
      .maybeSingle();

    if (existing) {
      alert("Username already exists.");
      return;
    }

    await supabase.from('users').insert([
      {
        fullName: newUserData.fullName || newUserData.username,
        username: newUserData.username,
        password: newUserData.password,
        role: newUserData.role,
        workspace_id: currentUser.workspace_id // ensure new user joins current workspace
      }
    ]);

    setIsAddingUser(false);
    setNewUserData({ username: '', fullName: '', password: '', role: 'User' });

    fetchUsers();
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
          className="flex items-center gap-2 px-6 py-3 bg-[#e11d48] text-white rounded-2xl hover:bg-[#be123c] font-black text-sm uppercase tracking-widest"
        >
          <Plus size={18} />
          Register Member
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Team Member</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Username</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase">Role</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const isMe = user.id === currentUser.id;

              return (
                <tr key={user.id} className="border-b">
                  <td className="px-8 py-6 font-bold">{user.fullName}</td>
                  <td className="px-8 py-6">{user.username}</td>
                  <td className="px-8 py-6">
                    {isMe ? (
                      <span className="text-rose-600 font-black">{user.role}</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value as Role)}
                        className="border rounded px-3 py-2"
                      >
                        <option value="User">Standard User</option>
                        <option value="Admin">Administrator</option>
                      </select>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    {!isMe && (
                      <DeleteWithConfirm onConfirm={() => deleteUser(user.id)}>
  <Trash2 size={20} />
</DeleteWithConfirm>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-8 rounded-3xl w-96">
            <h3 className="text-xl font-black mb-6">New Registration</h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full border p-3 rounded-xl"
                value={newUserData.fullName}
                onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Username"
                className="w-full border p-3 rounded-xl"
                value={newUserData.username}
                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border p-3 rounded-xl"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
              />
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as Role })}
                className="w-full border p-3 rounded-xl"
              >
                <option value="User">Standard Operator</option>
                <option value="Admin">System Administrator</option>
              </select>

              <button
                type="submit"
                className="w-full bg-rose-600 text-white py-3 rounded-2xl font-black"
              >
                Register Member
              </button>
            </form>

            <button
              onClick={() => setIsAddingUser(false)}
              className="absolute top-4 right-4"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

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