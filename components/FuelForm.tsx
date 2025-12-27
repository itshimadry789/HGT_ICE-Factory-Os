
import React, { useState } from 'react';
import { Fuel, Droplets, Clock, DollarSign, ArrowRight, Zap } from 'lucide-react';
import { formatCurrency } from '../utils';

interface FuelFormProps {
  onSave: (fuelData: any) => void;
}

const FuelForm: React.FC<FuelFormProps> = ({ onSave }) => {
  const [liters, setLiters] = useState<string>('');
  const [costPerLiter, setCostPerLiter] = useState<string>('');
  const [hours, setHours] = useState<string>('');

  const totalCost = Number(liters) * Number(costPerLiter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liters || !costPerLiter || !hours) return;
    onSave({
      liters_added: Number(liters),
      cost_per_liter: Number(costPerLiter),
      generator_hours_run: Number(hours),
      total_cost: totalCost
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      <div className="nexus-card overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Fuel Log</h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Generator Maintenance</p>
           </div>
           <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center relative z-10 shadow-lg shadow-amber-900/20">
              <Fuel className="w-5 h-5 text-white" />
           </div>
           {/* Decorative Background Blur */}
           <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500 opacity-10 -mr-6 -mt-6 rounded-full blur-2xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5" /> Volume Added
              </label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="numeric"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-4 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none transition-all"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  placeholder="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">Liters</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Unit Cost
              </label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="numeric"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none transition-all"
                  value={costPerLiter}
                  onChange={(e) => setCostPerLiter(e.target.value)}
                  placeholder="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">SSP/L</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Runtime Duration
            </label>
            <div className="relative">
              <input 
                type="number"
                inputMode="numeric"
                step="0.5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none transition-all"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0.0"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">Hours</span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center border border-slate-100">
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Expense</p>
                <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">{formatCurrency(totalCost)}</p>
             </div>
             <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5" />
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-5 rounded-xl shadow-lg transition-all active-tap uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Record Entry <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FuelForm;
