
import React, { useState, useEffect } from 'react';
import { Fuel, Droplets, Clock, DollarSign, ArrowRight, Zap } from 'lucide-react';
import { formatCurrency } from '../utils';
import AlertBanner from './shared/AlertBanner';
import Tooltip from './shared/Tooltip';

interface FuelFormProps {
  onSave: (fuelData: any) => void;
}

const FuelForm: React.FC<FuelFormProps> = ({ onSave }) => {
  const [liters, setLiters] = useState<string>('');
  const [costPerLiter, setCostPerLiter] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [boxesProduced, setBoxesProduced] = useState<string>('');
  const [efficiency, setEfficiency] = useState(0);

  const totalCost = Number(liters) * Number(costPerLiter);
  const normalEfficiency = 1.1;

  useEffect(() => {
    if (Number(boxesProduced) > 0 && Number(liters) > 0) {
      setEfficiency(Number(liters) / Number(boxesProduced));
    } else {
      setEfficiency(0);
    }
  }, [boxesProduced, liters]);

  const efficiencyVariance = efficiency > 0 ? ((efficiency - normalEfficiency) / normalEfficiency * 100) : 0;
  const isAbnormal = efficiency > 1.2;
  const isNormal = efficiency > 0 && efficiency <= 1.1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liters || !costPerLiter || !hours) return;
    onSave({
      liters_added: Number(liters),
      cost_per_liter: Number(costPerLiter),
      generator_hours_run: Number(hours),
      total_cost: totalCost,
      boxes_produced: Number(boxesProduced) || 0,
      efficiency: efficiency > 0 ? efficiency.toFixed(3) : 0,
      efficiency_variance: efficiencyVariance.toFixed(1),
      alert_level: isAbnormal ? 'CRITICAL' : isNormal ? 'NORMAL' : 'WARNING'
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      <div className="nexus-card overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-2xl font-black text-white tracking-tight">Fuel Log</h2>
              <div className="flex items-center gap-2 mt-1.5 opacity-70">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Generator Maintenance</p>
              </div>
           </div>
           <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10 border border-white/20 shadow-lg">
              <Fuel className="w-7 h-7 text-white" />
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-amber-600 transition-colors">
                <Droplets className="w-3.5 h-3.5" /> Volume Added
              </label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100"
                  value={liters}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || parseFloat(value) >= 0) {
                      setLiters(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    if (pastedText.includes('-')) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Liters</span>
              </div>
            </div>

            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-amber-600 transition-colors">
                <DollarSign className="w-3.5 h-3.5" /> Unit Cost
              </label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100"
                  value={costPerLiter}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || parseFloat(value) >= 0) {
                      setCostPerLiter(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const pastedText = e.clipboardData.getData('text');
                    if (pastedText.includes('-')) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">SSP/L</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-amber-600 transition-colors">
              <span>Boxes Produced Today</span>
              <Tooltip content="How many ice blocks were manufactured using this fuel? This helps track efficiency.">
                <span className="text-slate-400 hover:text-amber-600 cursor-help transition-colors">?</span>
              </Tooltip>
            </label>
            <div className="relative">
              <input 
                type="number"
                inputMode="numeric"
                min="0"
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100"
                value={boxesProduced}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    setBoxesProduced(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText.includes('-')) {
                    e.preventDefault();
                  }
                }}
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Blocks</span>
            </div>
          </div>

          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-amber-600 transition-colors">
              <Clock className="w-3.5 h-3.5" /> Runtime Duration
            </label>
            <div className="relative">
              <input 
                type="number"
                inputMode="numeric"
                min="0"
                step="0.5"
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100"
                value={hours}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    setHours(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText.includes('-')) {
                    e.preventDefault();
                  }
                }}
                placeholder="0.0"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Hours</span>
            </div>
          </div>

          {/* Efficiency Indicator */}
          {Number(boxesProduced) > 0 && Number(liters) > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Fuel Efficiency</span>
                <span className="text-slate-900 text-2xl font-black monospaced">{efficiency.toFixed(2)} <span className="text-sm text-slate-400 font-bold">L/block</span></span>
              </div>

              <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Normal Efficiency:</span>
                <span className="text-emerald-600 font-black">{normalEfficiency} L/block</span>
              </div>

              {/* Alert Banner */}
              {isAbnormal && (
                <AlertBanner
                  type="warning"
                  message={`⚠️ Fuel usage is ${efficiencyVariance.toFixed(0)}% higher than normal! Expected: ${(Number(boxesProduced) * normalEfficiency).toFixed(0)}L | Actual: ${liters}L | Waste: ${(Number(liters) - Number(boxesProduced) * normalEfficiency).toFixed(0)}L`}
                  actionLabel="Check for theft or leaks"
                />
              )}

              {isNormal && (
                <AlertBanner
                  type="success"
                  message="✅ Fuel efficiency is normal - Operating within expected range"
                />
              )}
            </div>
          )}

          {/* Cost Summary */}
          <div className="bg-gradient-to-br from-slate-50 via-amber-50/30 to-white p-6 rounded-2xl flex justify-between items-center border border-dashed border-slate-300 relative overflow-hidden">
             <div className="absolute inset-0 opacity-5">
               <div className="absolute inset-0" style={{
                 backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                 backgroundSize: '16px 16px'
               }}></div>
             </div>
             <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expense</p>
                <p className="text-4xl font-black text-slate-900 monospaced tracking-tighter">{formatCurrency(totalCost)}</p>
             </div>
             <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 rounded-xl flex items-center justify-center shadow-sm relative z-10">
                <Zap className="w-6 h-6" />
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-5 rounded-xl shadow-xl shadow-slate-900/10 transition-all active-tap uppercase tracking-widest flex items-center justify-center gap-3 group"
          >
            <span>Record Entry</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default FuelForm;
