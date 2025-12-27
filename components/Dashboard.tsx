
import React from 'react';
import { Sale, Expense, FuelLog, Customer, PaymentStatus, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils';
import { 
  TrendingUp, TrendingDown, MoreHorizontal, 
  Info, ShoppingBag, Zap, Wallet, Calendar, ArrowRight, Droplets, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales, expenses, fuelLogs, customers }) => {
  // --- Core Calculations ---
  const cashSales = sales
    .filter(s => s.payment_status === PaymentStatus.CASH)
    .reduce((sum, s) => sum + s.total_amount, 0);
  
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.total_cost, 0);
  const totalLiters = fuelLogs.reduce((sum, f) => sum + f.liters_added, 0);
  
  const liquidity = cashSales - totalExpenses - totalFuelCost;
  const blocksSold = sales.reduce((sum, s) => sum + s.quantity_blocks, 0);
  
  const productionCost = totalFuelCost + totalExpenses;
  const costPerBlock = blocksSold > 0 ? productionCost / blocksSold : 0;

  // --- Chart Data ---
  const revenueChartData = [
    { name: 'Mon', value: totalRevenue * 0.15 },
    { name: 'Tue', value: totalRevenue * 0.22 },
    { name: 'Wed', value: totalRevenue * 0.18 },
    { name: 'Thu', value: totalRevenue * 0.25 },
    { name: 'Fri', value: totalRevenue * 0.20 },
  ];

  const paymentData = [
    { name: 'Cash', value: cashSales, fill: '#10B981' }, 
    { name: 'Credit', value: totalRevenue - cashSales, fill: '#8B5CF6' }, 
  ];

  const recentActivity = [
    ...sales.map(s => ({ 
      id: s.id,
      type: 'SALE', 
      label: 'Ice Block Sale', 
      sub: `${s.quantity_blocks} Blocks`, 
      amount: s.total_amount, 
      color: 'bg-emerald-100 text-emerald-600',
      icon: ShoppingBag,
      time: 'Just now'
    })),
    ...expenses.map(e => ({ 
      id: e.id,
      type: 'EXPENSE', 
      label: e.category, 
      sub: e.description, 
      amount: e.amount, 
      color: 'bg-rose-100 text-rose-600',
      icon: Wallet,
      time: '2h ago'
    })),
    ...fuelLogs.map(f => ({ 
      id: f.id,
      type: 'FUEL', 
      label: 'Generator Refuel', 
      sub: `${f.liters_added} Liters`, 
      amount: f.total_cost, 
      color: 'bg-amber-100 text-amber-600',
      icon: Droplets,
      time: '5h ago'
    }))
  ].sort((a, b) => 0.5 - Math.random()).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time factory overview.</p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-slate-900 bg-slate-100 rounded-xl shadow-sm transition-all">Today</button>
          <button className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all">Weekly</button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- METRIC CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LIQUIDITY */}
        <div className="nexus-card p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Net Liquidity</span>
              </div>
              <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-3xl font-black text-slate-900 monospaced tracking-tight mb-2">{formatCurrency(liquidity)}</h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3" /> +12.5%
              </span>
              <span className="text-[10px] text-slate-400 font-bold">vs last week</span>
            </div>
          </div>
        </div>

        {/* PRODUCTION */}
        <div className="nexus-card p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Yield</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 monospaced tracking-tight mb-2">{blocksSold}</h3>
            <div className="flex items-center gap-2">
               <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-purple-600 w-3/4"></div>
               </div>
               <span className="text-[10px] text-purple-600 font-bold">On Target</span>
            </div>
          </div>
        </div>

        {/* EFFICIENCY */}
        <div className="nexus-card p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50"></div>
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Efficiency</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 monospaced tracking-tight mb-2">
               {costPerBlock > 0 ? Math.round(costPerBlock) : 0} <span className="text-sm text-slate-400 font-bold">SSP</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">Cost per unit produced</p>
          </div>
        </div>
      </div>

      {/* --- CONTENT ROW --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* REVENUE CHART */}
        <div className="nexus-card p-8 xl:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
               <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
               <h4 className="text-sm font-bold text-slate-900">Weekly Revenue</h4>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94a3b8" />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 'bold'
                  }} 
                />
                <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                   {revenueChartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 4 ? '#4F46E5' : '#E2E8F0'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PAYMENT DISTRIBUTION */}
        <div className="nexus-card p-8 flex flex-col justify-center">
           <h4 className="text-sm font-bold text-slate-900 mb-6 text-center">Payment Channels</h4>
           <div className="h-[180px] w-full relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={paymentData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                    cornerRadius={8}
                 >
                   {paymentData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900">{Math.round((cashSales / totalRevenue) * 100)}%</span>
             </div>
           </div>
           <div className="flex justify-center gap-6 mt-6">
              {paymentData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }}></div>
                   <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* --- FEED --- */}
      <div className="nexus-card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
               <Clock className="w-4 h-4" />
             </div>
             <h4 className="text-sm font-bold text-slate-900">Master Ledger Log</h4>
           </div>
           <button className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors">
             View All History
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Transaction Type</th>
                <th className="py-4 px-6 hidden sm:table-cell">Description</th>
                <th className="py-4 px-6 hidden sm:table-cell">Time</th>
                <th className="py-4 px-6 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.map((item, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/80 transition-all cursor-default">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${item.color}`}>
                         <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{item.label}</p>
                         <p className="text-[11px] text-slate-400 font-bold sm:hidden">{item.sub}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 hidden sm:table-cell">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{item.sub}</span>
                  </td>
                   <td className="py-4 px-6 hidden sm:table-cell">
                    <span className="text-xs font-bold text-slate-400">{item.time}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                     <span className={`text-sm font-black monospaced ${item.type === 'SALE' ? 'text-emerald-600' : 'text-slate-900'}`}>
                       {item.type === 'SALE' ? '+' : '-'}{formatCurrency(item.amount)}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
