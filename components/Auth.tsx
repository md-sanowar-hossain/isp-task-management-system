import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLogin: (user: any) => void;
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

    try {
      if (isLogin) {
        // 🔹 LOGIN
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (error || !data) {
          setError('Invalid login credentials.');
        } else {
          // pass the full user row (includes workspace_id)
          onLogin(data);
        }

      } else {
        // 🔹 REGISTER
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (existing) {
          setError('Username already exists.');
          setIsProcessing(false);
          return;
        }

        // Create user, then initialize a new workspace for them by setting workspace_id to their id
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              fullName: username,
              username,
              password,
              role: 'Admin' // new registrant becomes workspace owner/admin
            }
          ])
          .select()
          .single();

        if (error || !data) {
          setError('Registration failed.');
        } else {
          try {
            // create a workspace record (use the new user's id as workspace id)
            try {
              await supabase.from('workspaces').insert([{ id: data.id, name: username }]);
            } catch (wErr) {
              // if workspaces table doesn't exist or insert fails, continue
              console.warn('Could not create workspace row:', wErr);
            }

            // set workspace_id to the newly created user's id (isolated workspace)
            await supabase.from('users').update({ workspace_id: data.id }).eq('id', data.id);
            const { data: fresh } = await supabase.from('users').select('*').eq('id', data.id).single();
            setSuccess('Account created successfully!');
            setTimeout(() => {
              onLogin(fresh);
            }, 800);
          } catch (e) {
            setError('Registration post-setup failed.');
          }
        }
      }
    } catch (err) {
      setError('System connection error.');
    }

    setIsProcessing(false);
  };

  const authInputClass =
    "w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl focus:border-[#e11d48] focus:ring-4 focus:ring-rose-500/10 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400 shadow-sm disabled:bg-slate-50 disabled:text-slate-400";

  const authLabelClass =
    "text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">

      <div className="max-w-4xl w-full bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200">

        {/* Left Side */}
        <div className="md:w-5/12 bg-slate-50 p-10 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-6xl font-black text-[#e11d48] tracking-tighter">dk</span>
            <span className="text-6xl font-black text-[#0f172a] tracking-tighter">Link</span>
          </div>
          <div className="mt-6">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
              Operations Hub [SANY]
            </h2>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex-1 p-10 md:p-14">

          <div className="mb-10">
            <h3 className="text-4xl font-black text-[#0f172a] tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Access'}
            </h3>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">
              ISP Management Protocol
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl">
                <AlertCircle size={18} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 size={18} />
                <p className="text-sm font-bold">{success}</p>
              </div>
            )}

            <div>
              <label className={authLabelClass}>Member ID</label>
              <input
                type="text"
                disabled={isProcessing}
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
                disabled={isProcessing}
                className={authInputClass}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-5 bg-[#e11d48] text-white rounded-3xl font-black hover:bg-[#be123c] transition-all shadow-2xl mt-6 flex items-center justify-center gap-3 text-lg uppercase tracking-widest"
            >
              {isProcessing
                ? <Loader2 size={24} className="animate-spin" />
                : isLogin
                  ? 'Initiate Session'
                  : 'Request Access'}
            </button>

            <div className="text-center pt-6">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setIsLogin(!isLogin)}
                className="text-[11px] font-black text-slate-400 hover:text-[#e11d48] transition-colors uppercase tracking-[0.25em]"
              >
                {isLogin
                  ? 'New Member Registration'
                  : 'Return to Login Terminal'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;