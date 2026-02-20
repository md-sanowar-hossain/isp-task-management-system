
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { LogIn, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const storedUsers = JSON.parse(localStorage.getItem('dklink_users') || '[]');
      
      if (isLogin) {
        const user = storedUsers.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        if (user) {
          onLogin({ id: user.id, username: user.username, role: user.role });
        } else {
          setError('Invalid login credentials.');
        }
      } else {
        if (storedUsers.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
          setError('Username already exists.');
          setIsProcessing(false);
          return;
        }
        
        const assignedRole: Role = storedUsers.length === 0 ? 'Admin' : 'User';
        const newUser = { 
          id: Math.random().toString(36).substring(2, 11), 
          username, 
          fullName: username, // Default fullName to username for new registrations
          password, 
          role: assignedRole,
          createdAt: new Date().toLocaleDateString()
        };
        
        storedUsers.push(newUser);
        localStorage.setItem('dklink_users', JSON.stringify(storedUsers));
        setSuccess(`Success! Assigned as ${assignedRole}.`);
        
        setTimeout(() => {
          onLogin({ id: newUser.id, username: newUser.username, role: newUser.role });
        }, 1000);
      }
    } catch (err) {
      setError('System connection error.');
    } finally {
      if (isLogin || error) setIsProcessing(false);
    }
  };

  const authInputClass = "w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl focus:border-[#e11d48] focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400 shadow-sm disabled:bg-slate-50 disabled:text-slate-400";
  const authLabelClass = "text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-rose-900/10 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-slate-800/30 blur-[100px] rounded-full"></div>

      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-500 relative z-10 border border-slate-200">
        <div className="md:w-5/12 bg-slate-50 p-10 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <span className="text-6xl font-black text-[#e11d48] tracking-tighter">dk</span>
              <span className="text-6xl font-black text-[#0f172a] tracking-tighter">Link</span>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Operations Hub</h2>
            <div className="h-1.5 w-12 bg-[#e11d48] mx-auto rounded-full"></div>
          </div>
        </div>

        <div className="flex-1 p-10 md:p-14">
          <div className="mb-10">
            <h3 className="text-4xl font-black text-[#0f172a] tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Access'}
            </h3>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">ISP Management Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl animate-in slide-in-from-top-1">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl animate-in slide-in-from-top-1">
                <CheckCircle2 size={18} className="shrink-0" />
                <p className="text-sm font-bold">{success}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className={authLabelClass}>Member ID</label>
                <input
                  type="text"
                  disabled={isProcessing || !!success}
                  className={authInputClass}
                  placeholder="Enter Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className={authLabelClass}>Security Key</label>
                <input
                  type="password"
                  disabled={isProcessing || !!success}
                  className={authInputClass}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !!success}
              className="w-full py-5 bg-[#e11d48] text-white rounded-3xl font-black hover:bg-[#be123c] transition-all shadow-2xl shadow-rose-900/20 active:scale-[0.98] mt-6 flex items-center justify-center gap-3 disabled:opacity-70 text-lg uppercase tracking-widest"
            >
              {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <span>{isLogin ? 'Initiate Session' : 'Request Access'}</span>}
            </button>

            <div className="text-center pt-6">
              <button
                type="button"
                disabled={isProcessing || !!success}
                onClick={() => setIsLogin(!isLogin)}
                className="text-[11px] font-black text-slate-400 hover:text-[#e11d48] transition-colors uppercase tracking-[0.25em]"
              >
                {isLogin ? 'New Member Registration' : 'Return to Login Terminal'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="absolute bottom-10 text-slate-600 font-black text-[10px] uppercase tracking-[1em] opacity-40">
        ISP OPERATIONAL SYSTEM
      </div>
    </div>
  );
};

export default Auth;
