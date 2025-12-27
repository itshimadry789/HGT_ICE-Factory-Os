
import React from 'react';
import { Sale, Expense, FuelLog, Customer, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils';
import { 
  AreaChart, Area, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, ArrowUpRight, Target, Zap, TrendingDown } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  customers: Customer[];
}

// --- Premium Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px]">
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-3 border-b border-white/10 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: entry.color || entry.fill, color: entry.color || entry.fill }}></div>
              <span className="text-white/90 text-xs font-bold">{entry.name}</span>
            </div>
            <span className="text-white font-black monospaced text-sm tracking-tight">
              {typeof entry.value === 'number' && entry.name !== 'Blocks' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports: React.FC<ReportsProps> = ({ sales, expenses, fuelLogs }) => {
  // --- Data Processing ---
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFuel = fuelLogs.reduce((sum, f) => sum + f.total_cost, 0);
  const netProfit = totalRevenue - (totalExpenses + totalFuel);
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Generate 7-day trailing data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const financialTrendData = last7Days.map(date => {
    const dayDate = new Date(date);
    const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    
    const revenue = sales
      .filter(s => s.created_at.startsWith(date))
      .reduce((sum, s) => sum + s.total_amount, 0);
    
    const cost = expenses
      .filter(e => e.created_at.startsWith(date))
      .reduce((sum, e) => sum + e.amount, 0) 
      + fuelLogs
      .filter(f => f.created_at.startsWith(date))
      .reduce((sum, f) => sum + f.total_cost, 0);

    const blocks = sales
      .filter(s => s.created_at.startsWith(date))
      .reduce((sum, s) => sum + s.quantity_blocks, 0);

    return {
      date: dayLabel,
      revenue,
      cost,
      blocks,
      profit: revenue - cost
    };
  });

  const costDistribution = [
    { name: 'Generator Fuel', value: totalFuel, color: '#F59E0B' }, // Amber
    ...Object.values(ExpenseCategory).map((cat, idx) => ({
      name: cat.charAt(0) + cat.slice(1).toLowerCase(),
      value: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
      color: [ '#8B5CF6', '#EC4899', '#10B981', '#3B82F6'][idx] || '#64748B'
    })).filter(e => e.value > 0)
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Financial velocity and operational analytics.</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active-tap">
              Export PDF
           </button>
           <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/20 active-tap">
              Live View
           </button>
        </div>
      </div>

      {/* KPI Cards - High Fidelity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="nexus-card p-6 bg-slate-900 text-white border-none shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all duration-500"></div>
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Profit</span>
               <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                 <Activity className="w-4 h-4 text-emerald-400" />
               </div>
             </div>
             <p className="text-3xl font-black monospaced tracking-tight">{formatCurrency(netProfit)}</p>
             <div className="flex items-center gap-2 mt-2">
               <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/20">
                 {profitMargin.toFixed(1)}% Margin
               </span>
             </div>
           </div>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:border-purple-200 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Revenue</span>
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
               <ArrowUpRight className="w-4 h-4" />
             </div>
           </div>
           <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">{formatCurrency(totalRevenue)}</p>
           <p className="text-xs text-slate-400 font-medium mt-2">Gross income before deductions</p>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:border-rose-200 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Burn</span>
             <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
               <TrendingDown className="w-4 h-4" />
             </div>
           </div>
           <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">{formatCurrency(totalExpenses + totalFuel)}</p>
           <p className="text-xs text-slate-400 font-medium mt-2">OpEx + Fuel Costs</p>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:border-amber-200 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Yield Efficiency</span>
             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
               <Zap className="w-4 h-4" />
             </div>
           </div>
           <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">94.2%</p>
           <p className="text-xs text-slate-400 font-medium mt-2">Production vs Capacity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Financial Trend Chart */}
        <div className="nexus-card p-8 xl:col-span-2 shadow-lg shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-base font-bold text-slate-900">Financial Velocity</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenue vs Cost Analysis</p>
              </div>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-100 cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialTrendData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  fontWeight={600} 
                  stroke="#94A3B8" 
                  tick={{dy: 10}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={11} 
                  fontWeight={600} 
                  stroke="#94A3B8"
                  tickFormatter={(val) => `${val / 1000}k`} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748B', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  name="Revenue"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4F46E5" 
                  strokeWidth={3} 
                  fill="url(#colorRev)" 
                  activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#4F46E5' }}
                  animationDuration={1500}
                />
                <Area 
                  name="Cost"
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#F43F5E" 
                  strokeWidth={3} 
                  fill="url(#colorCost)"
                  activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#F43F5E' }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Structure Donut */}
        <div className="nexus-card p-8 shadow-lg shadow-slate-200/50 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-base font-bold text-slate-900">Cost Structure</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expense Breakdown</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={costDistribution} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={80} 
                  outerRadius={100} 
                  paddingAngle={8} 
                  dataKey="value" 
                  stroke="none"
                  cornerRadius={6}
                >
                  {costDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color as string} 
                      className="outline-none cursor-pointer hover:opacity-80 transition-opacity duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconType="circle"
                  layout="vertical"
                  iconSize={8}
                  wrapperStyle={{ bottom: 0, fontSize: '11px', fontWeight: 600, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Out</span>
              <span className="text-lg font-black text-slate-900 monospaced">{formatCurrency(totalExpenses + totalFuel)}</span>
            </div>
          </div>
        </div>

        {/* Production vs Efficiency Chart */}
        <div className="nexus-card p-8 xl:col-span-3 shadow-lg shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-base font-bold text-slate-900">Operational Yield</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volume Produced vs Profit</p>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financialTrendData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={11} fontWeight={600} stroke="#94A3B8" />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} fontSize={11} fontWeight={600} stroke="#94A3B8" />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} fontSize={11} fontWeight={600} stroke="#94A3B8" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                  <Bar yAxisId="left" dataKey="blocks" name="Blocks" barSize={32} radius={[6, 6, 6, 6]} fill="#E2E8F0" />
                  <Line yAxisId="right" type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke:'#10B981'}} />
                </ComposedChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
