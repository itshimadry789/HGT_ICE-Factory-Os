
import React from 'react';
import { User, AlertTriangle, CheckCircle } from 'lucide-react';
import { Customer } from '../../types';

interface ClientSelectorProps {
  clients: Customer[];
  selectedClient: string;
  onChange: (clientId: string) => void;
  onAddNew?: () => void;
}

export default function ClientSelector({ clients = [], selectedClient, onChange, onAddNew }: ClientSelectorProps) {
  // Remove duplicates by ID first, then by name if ID is missing
  const uniqueClients = clients.filter((client, index, self) =>
    index === self.findIndex((c) => 
      (c.id && client.id && c.id === client.id) || 
      (!c.id && !client.id && c.name === client.name && c.phone_number === client.phone_number)
    )
  );

  const getBalanceColor = (balance: number) => {
    if (balance === 0) return 'text-green-400';
    if (balance > 10000000) return 'text-red-400';
    if (balance > 5000000) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getBalanceIcon = (balance: number) => {
    if (balance === 0) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (balance > 10000000) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    return null;
  };

  const selectedClientData = uniqueClients.find(c => c.id === selectedClient);

  return (
    <div className="space-y-3 group">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-purple-600 transition-colors">
        <User className="w-3.5 h-3.5" /> Client Profile
      </label>
      
      <div className="relative">
        <select
          value={selectedClient}
          onChange={(e) => {
            if (e.target.value === 'add_new') {
              onAddNew?.();
            } else {
              onChange(e.target.value);
            }
          }}
          className="w-full bg-slate-50 border-none rounded-xl p-4 pr-12 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-100 shadow-sm"
        >
          <option value="">Select Buyer...</option>
          
          {uniqueClients.map((client) => (
            <option key={client.id || client.name} value={client.id} className="py-2">
              {client.name} - {
                client.total_credit_due === 0 
                  ? '✓ Paid Up' 
                  : `Owes: ${client.total_credit_due.toLocaleString()} SSP`
              }
            </option>
          ))}
          
          {onAddNew && (
            <option value="add_new" className="font-semibold">
              + Add New Client
            </option>
          )}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Client Info Display */}
      {selectedClientData && (
        <div className="mt-3 bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 border border-slate-200/60 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                  selectedClientData.total_credit_due === 0
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                    : selectedClientData.total_credit_due > 10000000
                    ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                    : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                }`}>
                  {selectedClientData.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-900 font-bold text-sm block truncate">{selectedClientData.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {getBalanceIcon(selectedClientData.total_credit_due)}
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">ID: {selectedClientData.id?.substring(0, 8)}...</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500 bg-slate-100/50 w-fit px-3 py-1.5 rounded-lg border border-slate-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="monospaced text-xs font-bold">{selectedClientData.phone_number}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Balance</div>
              <div className={`text-xl font-black monospaced ${getBalanceColor(selectedClientData.total_credit_due)}`}>
                {selectedClientData.total_credit_due === 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span>Paid Up</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </span>
                ) : (
                  `${selectedClientData.total_credit_due.toLocaleString()} SSP`
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

