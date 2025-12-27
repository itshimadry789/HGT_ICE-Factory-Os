
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
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Production Log</h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Factory Output Registry</p>
           </div>
           <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center relative z-10 shadow-lg shadow-sky-900/20">
              <Snowflake className="w-5 h-5 text-white" />
           </div>
           {/* Decorative Background Blur */}
           <div className="absolute right-0 top-0 w-32 h-32 bg-sky-500 opacity-10 -mr-6 -mt-6 rounded-full blur-2xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Quantity */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Factory className="w-3.5 h-3.5" /> Total Output
            </label>
            <div className="relative">
              <input 
                type="number"
                inputMode="numeric"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-4 text-3xl font-black text-slate-900 focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none transition-all placeholder:text-slate-300"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300 uppercase">Blocks</span>
            </div>
          </div>

          {/* Shift Selection */}
          <div className="space-y-3">
             <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <ClipboardList className="w-3.5 h-3.5" /> Shift Assignment
             </label>
             <div className="flex gap-4">
                {['Morning', 'Afternoon', 'Night'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                      shift === s 
                        ? 'border-sky-500 bg-sky-50 text-sky-700' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Operational Notes
            </label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-sky-200 focus:border-sky-500 outline-none transition-all h-24 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any issues with machines or staff during this shift?"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-5 rounded-xl shadow-lg transition-all active-tap uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Log Production Entry <CheckCircle2 className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductionForm;
