
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area as AreaComp 
} from 'recharts';
import { Task, Area } from '../types';
import { AREAS, MONTHS, COLORS as BRAND_COLORS } from '../constants';

interface DashboardProps {
  tasks: Task[];
  areas?: string[]; // optional workspace-specific areas
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, areas }) => {
  const stats = {
    total: tasks.length,
    complete: tasks.filter(t => t.status === 'Complete').length,
    pending: tasks.filter(t => t.status === 'Pending').length,
  };

  // prefer workspace-specific areas when provided; fall back to global AREAS
  const areaList = (areas && areas.length > 0) ? areas : AREAS;
  const areaData = areaList.map(area => ({
    name: area,
    value: tasks.filter(t => t.area === area).length
  }));

  // remove zero-count areas so the chart and legend reflect workspace data only
  const filteredAreaData = areaData.filter(a => a.value > 0);

  const monthData = MONTHS.map(month => ({
    name: month.substring(0, 3),
    count: tasks.filter(t => t.month === month).length
  })).filter(m => m.count > 0);

  const typeData = Array.from(new Set(tasks.map(t => t.taskType))).map(type => ({
    name: type,
    count: tasks.filter(t => t.taskType === type).length
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Tickets</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-slate-900">{stats.total}</p>
            <div className="w-10 h-10 bg-slate-50 text-rose-600 rounded-lg flex items-center justify-center font-bold">#</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resolved</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-emerald-600">{stats.complete}</p>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              {stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Awaiting Action</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-rose-600">{stats.pending}</p>
            <div className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Area Distribution */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            Regional Distribution
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                    data={filteredAreaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                    {filteredAreaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS.chart[index % BRAND_COLORS.chart.length]} />
                    ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Trend */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Service Load Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <AreaComp type="monotone" dataKey="count" stroke={BRAND_COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Issues */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Critical Incident Types</h3>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-tighter">Frequency View</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={160} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#1e293b', fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill={BRAND_COLORS.primary} 
                  radius={[0, 8, 8, 0]} 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
