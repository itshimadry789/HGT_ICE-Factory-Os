
import React, { useState } from 'react';
import { Customer } from '../types';
import { formatCurrency } from '../utils';
import { ShieldCheck, Search, Filter, Phone, AlertCircle, CheckCircle2, MoreVertical, FileText, User } from 'lucide-react';

interface CustomerLedgerProps {
  customers: Customer[];
}

const CustomerLedger: React.FC<CustomerLedgerProps> = ({ customers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebtors, setFilterDebtors] = useState(false);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterDebtors ? c.total_credit_due > 0 : true;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => b.total_credit_due - a.total_credit_due);

  const totalOutstanding = customers.reduce((sum, c) => sum + c.total_credit_due, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Ledger</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Directory and credit risk management.</p>
        </div>
        
        <div className="nexus-card px-6 py-4 flex items-center gap-5 bg-slate-900 text-white border-none shadow-xl shadow-slate-900/10">
           <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
             <AlertCircle className="w-6 h-6 text-rose-400" />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Total Outstanding</p>
             <p className="text-2xl font-black monospaced tracking-tight">{formatCurrency(totalOutstanding)}</p>
           </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search client directory..." 
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setFilterDebtors(!filterDebtors)}
          className={`px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all flex items-center gap-2 shadow-sm active-tap ${
            filterDebtors 
              ? 'bg-purple-600 border-purple-600 text-white shadow-purple-200' 
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
          }`}
        >
          <Filter className="w-4 h-4" />
          {filterDebtors ? 'Filter: Debtors Only' : 'Filter: All Clients'}
        </button>
      </div>

      {/* Ledger Table */}
      <div className="nexus-card overflow-hidden shadow-lg shadow-slate-200/40 border border-slate-200">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-5">Client Profile</th>
                <th className="px-6 py-5 hidden sm:table-cell">Contact Info</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Balance Due</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredCustomers.map(debtor => (
                <tr key={debtor.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                        debtor.total_credit_due > 0 
                          ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {debtor.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{debtor.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wide flex items-center gap-1">
                          <User className="w-3 h-3" /> ID: {debtor.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                      <Phone className="w-3 h-3" />
                      <span className="monospaced text-xs font-bold">{debtor.phone_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {debtor.total_credit_due > 0 ? (
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                         debtor.total_credit_due > 200000 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                         <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                         Outstanding
                       </span>
                    ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                         <CheckCircle2 className="w-3 h-3" />
                         Settled
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-black text-sm monospaced ${debtor.total_credit_due > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                      {formatCurrency(debtor.total_credit_due)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-all active-tap">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                       <div className="p-4 bg-slate-50 rounded-full">
                          <Search className="w-8 h-8 opacity-20" />
                       </div>
                       <p className="text-xs font-bold uppercase tracking-widest">No profiles found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;
