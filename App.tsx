import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, ListTodo, FileText, BrainCircuit, X, Download, LogOut, Settings, Users, Plus, Menu, Printer, TrendingUp, CheckCircle2, Clock, Send, Bot, User as UserIcon, Search, Filter } from 'lucide-react';
import { Task, Status, User } from './types';
import { MONTHS, TASK_TYPES as INITIAL_TYPES, AREAS as INITIAL_AREAS } from './constants';
import Dashboard from './components/Dashboard';
import TaskTable from './components/TaskTable';
import TaskForm from './components/TaskForm';
import Auth from './components/Auth';
import WorkspaceManagement from './components/WorkspaceManagement';
import UserManagement from './components/UserManagement';
import AnalyticsReport from './components/AnalyticsReport';
import { getAIAnalysis, startAIChat } from './services/geminiService';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dklink_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'analytics' | 'ai' | 'workspace' | 'users'>('tasks');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Lazy initialization with ID sanitization for legacy data
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('dklink_tasks_v4');
    if (!saved) return [];
    try {
      const parsed: Task[] = JSON.parse(saved);
      // Ensure every task has an ID for robust deletion
      return parsed.map(t => ({
        ...t,
        id: t.id || Math.random().toString(36).substring(2, 11)
      }));
    } catch (e) {
      return [];
    }
  });

  const [taskTypes, setTaskTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('dklink_task_types');
    return saved ? JSON.parse(saved) : INITIAL_TYPES;
  });

  const [areas, setAreas] = useState<string[]>(() => {
    const saved = localStorage.getItem('dklink_areas');
    return saved ? JSON.parse(saved) : INITIAL_AREAS;
  });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Complete' | 'Pending'>('All');

  const [maxSerialSeen, setMaxSerialSeen] = useState(() => {
    const saved = localStorage.getItem('dklink_tasks_v4');
    if (!saved) return 0;
    try {
      const parsed: Task[] = JSON.parse(saved);
      return parsed.reduce((max: number, task: Task) => Math.max(max, task.serialNo), 0);
    } catch (e) {
      return 0;
    }
  });

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    if (currentUser) localStorage.setItem('dklink_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('dklink_current_user');
  }, [currentUser]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatting]);

  const addTask = (data: Omit<Task, 'id' | 'serialNo' | 'month' | 'createdBy'>) => {
    if (!currentUser) return;
    const dateObj = new Date(data.date);
    const newSn = maxSerialSeen + 1;
    setMaxSerialSeen(newSn);
    
    setTasks(prev => {
      const nt: Task = {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
        serialNo: newSn,
        month: MONTHS[dateObj.getMonth()],
        createdBy: currentUser.username
      };
      const nextTasks = [nt, ...prev];
      localStorage.setItem('dklink_tasks_v4', JSON.stringify(nextTasks));
      return nextTasks;
    });
  };

  const deleteTask = (id: string) => {
    // Allow deletion if the current user is an admin (trimmed) or the creator of the task
    const isAdmin = !!currentUser?.role && currentUser.role.toLowerCase().trim() === 'admin';
    const taskToDelete = tasks.find(t => t.id === id);
    const isCreator = !!taskToDelete && currentUser?.username === taskToDelete.createdBy;

    if (!isAdmin && !isCreator) {
      alert("Action denied: only administrators or the task creator can delete this record.");
      return;
    }

    // Immediate functional update with persistence
    setTasks(prev => {
      const nextTasks = prev.filter(t => t.id !== id);
      localStorage.setItem('dklink_tasks_v4', JSON.stringify(nextTasks));
      return nextTasks;
    });
  };

  const updateStatus = (id: string, status: Status) => {
    if (!currentUser) return;
    setTasks(prev => {
      const nextTasks = prev.map(t => {
        if (t.id !== id) return t;
        // When marking complete, set `completedBy`; when reverting to pending, clear it
        if (status === 'Complete') return { ...t, status, completedBy: currentUser.username };
        return { ...t, status, completedBy: undefined };
      });
      localStorage.setItem('dklink_tasks_v4', JSON.stringify(nextTasks));
      return nextTasks;
    });
  };

  const updateTaskTypes = (updater: (prev: string[]) => string[]) => {
    setTaskTypes(prev => {
      const next = updater(prev);
      localStorage.setItem('dklink_task_types', JSON.stringify(next));
      return next;
    });
  };

  const updateAreas = (updater: (prev: string[]) => string[]) => {
    setAreas(prev => {
      const next = updater(prev);
      localStorage.setItem('dklink_areas', JSON.stringify(next));
      return next;
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.taskType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.remarks && task.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const runAnalysis = async () => {
    if (tasks.length === 0) {
      alert("Registry empty: No data for analysis.");
      return;
    }
    setActiveTab('ai');
    setIsAnalyzing(true);
    setAiInsight(null);
    setChatMessages([]);
    try {
      const res = await getAIAnalysis(tasks);
      setAiInsight(res);
      chatSessionRef.current = startAIChat(tasks);
    } catch (err) {
      setAiInsight("Critical failure in reasoning engine.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isChatting) return;
    const userText = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsChatting(true);
    try {
      if (!chatSessionRef.current) chatSessionRef.current = startAIChat(tasks);
      const response = await chatSessionRef.current.sendMessage({ message: userText });
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Protocol error: Connection lost." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const exportExcel = () => {
    if (tasks.length === 0) {
      alert("No data to export.");
      return;
    }
    const sortedTasks = [...tasks].sort((a, b) => b.serialNo - a.serialNo);
    const taskEntryData = sortedTasks.map(t => ({
      'Serial No': t.serialNo,
      'Date': t.date,
      'User ID': t.userId,
      'Task Type': t.taskType,
      'Area': t.area,
      'Status': t.status,
      'Created By': t.createdBy,
      'Completed By': (t as any).completedBy || '',
      'Month': t.month,
      'Remarks': t.remarks || ''
    }));
    const ws1 = XLSX.utils.json_to_sheet(taskEntryData);

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Complete').length;
    const pending = total - completed;
    const dashboardSummary = [
      ['Metric', 'Value'],
      ['Total Tickets', total],
      ['Resolved', completed],
      ['Pending', pending],
      ['Success Rate', total > 0 ? `${Math.round((completed / total) * 100)}%` : '0%'],
      [],
      ['Report Generated By', currentUser?.username || 'System'],
      ['Export Date', new Date().toLocaleString()]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(dashboardSummary);

    const monthlySummary = MONTHS.map(m => {
      const monthTasks = tasks.filter(t => t.month === m);
      return {
        'Month': m,
        'Total Tickets': monthTasks.length,
        'Completed': monthTasks.filter(t => t.status === 'Complete').length,
        'Pending': monthTasks.filter(t => t.status === 'Pending').length
      };
    }).filter(row => row['Total Tickets'] > 0);
    const ws3 = XLSX.utils.json_to_sheet(monthlySummary);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Task Entry");
    XLSX.utils.book_append_sheet(wb, ws2, "Dashboard");
    XLSX.utils.book_append_sheet(wb, ws3, "Monthly Report");

    XLSX.writeFile(wb, "ISP_Task_System.xlsx");
  };

  if (!currentUser) return <Auth onLogin={setCurrentUser} />;

  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'tasks': return 'OPERATIONAL HUB';
      case 'dashboard': return 'DASHBOARD';
      case 'analytics': return 'ANALYTICS REPORT';
      case 'ai': return 'AI STRATEGY HUB';
      case 'workspace': return 'SYSTEM SETTINGS';
      case 'users': return 'TEAM MANAGEMENT';
      default: return activeTab.toUpperCase();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] font-['Inter'] text-slate-900">
      <aside className={`fixed md:relative z-50 h-full w-72 bg-[#0f172a] text-slate-300 flex flex-col transition-transform duration-500 ease-in-out shadow-2xl print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#0c1221]">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-[#e11d48] tracking-tighter">dk</span>
            <span className="text-3xl font-black text-white tracking-tighter">Link</span>
          </div>
          <button className="md:hidden p-2 hover:bg-slate-800 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {[
            { id: 'tasks', label: 'Service Hub', icon: ListTodo },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'analytics', label: 'Analytics', icon: FileText },
            { id: 'ai', label: 'AI Strategy', icon: BrainCircuit },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === item.id ? 'bg-[#e11d48] text-white shadow-xl shadow-rose-900/30 translate-x-1' : 'hover:bg-slate-800/50'}`}>
                <Icon size={20} strokeWidth={activeTab === item.id ? 3 : 2} /> {item.label}
              </button>
            );
          })}
          {currentUser.role?.toLowerCase() === 'admin' && (
            <div className="pt-6 border-t border-slate-800 mt-6 space-y-2">
              <div className="px-6 mb-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Management</div>
              <button onClick={() => { setActiveTab('workspace'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'workspace' ? 'bg-white/10 text-[#e11d48] border border-white/5' : 'hover:bg-slate-800/50'}`}>
                <Settings size={20} /> Settings
              </button>
              <button onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${activeTab === 'users' ? 'bg-white/10 text-[#e11d48] border border-white/5' : 'hover:bg-slate-800/50'}`}>
                <Users size={20} /> Team Users
              </button>
            </div>
          )}
        </nav>
        <div className="p-8 border-t border-slate-800 bg-[#0c1221]">
          <button onClick={() => { setCurrentUser(null); localStorage.removeItem('dklink_current_user'); }} className="w-full flex items-center gap-4 px-6 py-4 font-black text-xs text-slate-500 hover:text-[#e11d48] transition-colors uppercase tracking-widest">
            <LogOut size={20} strokeWidth={3} /> Terminate
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-auto relative">
        <header className="bg-white border-b border-slate-200 px-4 py-4 md:px-10 md:py-8 flex justify-between items-center sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90 print:hidden">
          <div className="flex items-center gap-3 md:gap-6">
            <button className="md:hidden p-2 -ml-2 text-slate-900" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24} strokeWidth={3} /></button>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">{getHeaderTitle()}</h1>
              <div className="flex items-center gap-2 mt-1 md:mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">ONLINE: {currentUser.username}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4">
            <button onClick={exportExcel} className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-slate-900 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={16} strokeWidth={3} /> Export
            </button>
            <button onClick={runAnalysis} className="flex items-center gap-2 p-3 md:px-8 md:py-4 bg-[#0f172a] text-white rounded-2xl md:rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 group">
              <BrainCircuit size={18} className="text-rose-500 group-hover:scale-110 transition-transform" strokeWidth={3} /> 
              <span className="hidden md:inline">DEEP THINK</span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-12 pb-32 print:p-0">
          {activeTab === 'tasks' && (
            <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <section className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1.5 md:w-2 h-6 md:h-8 bg-[#e11d48] rounded-full"></div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">New Entry</h2>
                </div>
                <TaskForm taskTypes={taskTypes} areas={areas} onSave={addTask} />
              </section>

              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 md:w-2 h-6 md:h-8 bg-slate-900 rounded-full"></div>
                    <h2 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tighter">Registry Logs</h2>
                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full uppercase tracking-widest">{filteredTasks.length} Results</span>
                  </div>
                  
                  {/* Search and Filter UI */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">
                    <div className="relative group min-w-[200px]">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Search records..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-900 focus:border-rose-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="relative group">
                      <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-900 focus:border-rose-500 outline-none transition-all appearance-none shadow-sm"
                      >
                        <option value="All">All Status</option>
                        <option value="Complete">Complete</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>
                <TaskTable tasks={filteredTasks} currentUser={currentUser!} onDelete={deleteTask} onUpdateStatus={updateStatus} />
              </section>
            </div>
          )}
          
          {activeTab === 'dashboard' && <Dashboard tasks={tasks} />}
          {activeTab === 'analytics' && <AnalyticsReport tasks={tasks} />}
          {activeTab === 'users' && <UserManagement currentUser={currentUser!} />}
          {activeTab === 'workspace' && <WorkspaceManagement taskTypes={taskTypes} setTaskTypes={updateTaskTypes} areas={areas} setAreas={updateAreas} />}
          
          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in zoom-in-95 duration-500">
              <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col h-[600px] md:h-[700px]">
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mb-4">Intelligence</h3>
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                  {isAnalyzing ? (
                    "Generating Audit..."
                  ) : aiInsight ? (
                    <AIInsightView text={aiInsight} />
                  ) : (
                    "Run analysis to generate strategy."
                  )}
                </div>
              </div>

              <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col h-[600px] md:h-[700px]">
                <h3 className="text-lg md:text-xl font-black text-slate-900 mb-4">Gemini Chat</h3>
                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 space-y-4">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-xl ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendChatMessage} className="relative mt-4">
                  <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ask Gemini..." className="w-full px-4 py-3 border rounded-xl" />
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

// Small presentational component to render AI analysis with bold labels
const AIInsightView: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const elements: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If this is the Actions label, collect following numbered lines into an ordered list
    if (/^Actions:?$/i.test(line)) {
      // push the label
      elements.push(
        <div key={`label-${i}`}>
          <strong className="font-black">Actions:</strong>
        </div>
      );
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length && (/^\d+\.|^[-*]\s+/.test(lines[j]) || /^[0-9]+\)/.test(lines[j]))) {
        items.push(lines[j]);
        j++;
      }
      if (items.length === 0) {
        elements.push(<div key={`empty-${i}`} className="font-medium">No specific actions suggested.</div>);
      } else {
        elements.push(
          <ol key={`ol-${i}`} className="list-decimal list-inside ml-4 space-y-1">
            {items.map((it, k) => {
              // strip leading numbering or bullets
              const text = it.replace(/^\s*(?:\d+\.|\d+\)|[-*+]\s+)\s*/, '').trim();
              return <li key={k} className="font-medium">{text}</li>;
            })}
          </ol>
        );
      }
      i = j - 1; // advance outer loop
      continue;
    }

    // Bullet style lines
    if (/^[-*]\s+/.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2">
          <div className="w-3">•</div>
          <div className="flex-1">{renderLabelValue(line.replace(/^[-*]\s+/, ''))}</div>
        </div>
      );
      continue;
    }

    // Numbered lines not under Actions: render as plain lines
    if (/^\d+\.|^[0-9]+\)/.test(line)) {
      const text = line.replace(/^\s*(?:\d+\.|\d+\)|[-*+]\s+)\s*/, '').trim();
      elements.push(<div key={i} className="font-medium">{text}</div>);
      continue;
    }

    elements.push(<div key={i}>{renderLabelValue(line)}</div>);
  }

  return (
    <div className="prose text-sm text-slate-800 leading-6">
      {elements}
    </div>
  );
};

function renderLabelValue(line: string) {
  const m = line.match(/^([^:]{1,40}):\s*(.*)$/);
  if (m) {
    const label = m[1];
    const rest = m[2];
    return (
      <span>
        <strong className="font-black">{label}:</strong> <span className="font-medium">{rest}</span>
      </span>
    );
  }
  return <span className="font-medium">{line}</span>;
}
