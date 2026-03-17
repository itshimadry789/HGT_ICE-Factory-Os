
import React, { useState } from 'react';
import { Snowflake, CheckCircle2, Factory, ClipboardList } from 'lucide-react';

interface ProductionFormProps {
  onSave: (data: any) => void;
}

const ProductionForm: React.FC<ProductionFormProps> = ({ onSave }) => {
  const [quantity, setQuantity] = useState<string>('');
  const [shift, setShift] = useState<string>('Morning');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity) return;
    onSave({
      quantity_produced: Number(quantity),
      shift,
      notes
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      <div className="nexus-card overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-2xl font-black text-white tracking-tight">Production Log</h2>
              <div className="flex items-center gap-2 mt-1.5 opacity-70">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Factory Output Registry</p>
              </div>
           </div>
           <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10 border border-white/20 shadow-lg">
              <Snowflake className="w-7 h-7 text-white" />
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500 via-teal-500 to-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Quantity */}
          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-teal-600 transition-colors">
              <Factory className="w-3.5 h-3.5" /> Total Output
            </label>
            <div className="relative">
              <input 
                type="number"
                inputMode="numeric"
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-3xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Blocks</span>
            </div>
          </div>

          {/* Shift Selection */}
          <div className="space-y-3 group">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-teal-600 transition-colors">
               <ClipboardList className="w-3.5 h-3.5" /> Shift Assignment
             </label>
             <div className="flex gap-4">
                {['Morning', 'Afternoon', 'Night'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`flex-1 py-4 px-4 rounded-xl text-sm font-black border-2 transition-all active-tap ${
                      shift === s 
                        ? 'border-teal-500 bg-gradient-to-br from-amber-50 via-teal-50 to-blue-50 text-teal-700 shadow-lg shadow-teal-100' 
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>

          {/* Notes */}
          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-teal-600 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" /> Operational Notes
            </label>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 outline-none transition-all h-24 resize-none placeholder:text-slate-300 hover:bg-slate-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any issues with machines or staff during this shift?"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-5 rounded-xl shadow-xl shadow-slate-900/10 transition-all active-tap uppercase tracking-widest flex items-center justify-center gap-3 group"
          >
            <span>Log Production Entry</span>
            <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductionForm;
