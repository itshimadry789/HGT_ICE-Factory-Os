
import React, { useState } from 'react';
import { Receipt, Tag, FileText, Banknote, ArrowRight, Wallet } from 'lucide-react';
import { ExpenseCategory } from '../types';

interface ExpenseFormProps {
  onSave: (expenseData: any) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave }) => {
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FOOD);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onSave({
      category,
      amount: Number(amount),
      description,
      currency: 'SSP'
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      <div className="nexus-card overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Expense Registry</h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Operational Costs</p>
           </div>
           <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center relative z-10 shadow-lg shadow-rose-900/20">
              <Receipt className="w-5 h-5 text-white" />
           </div>
           <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500 opacity-10 -mr-6 -mt-6 rounded-full blur-2xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Category Selector */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Cost Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.values(ExpenseCategory).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-xl text-[10px] font-bold uppercase transition-all active-tap border ${
                    category === cat 
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5" /> Amount (SSP)
            </label>
            <div className="relative">
              <input 
                type="number"
                inputMode="numeric"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-3xl font-black text-slate-900 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 outline-none transition-all placeholder:text-slate-300"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Description / Notes
            </label>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-rose-200 focus:border-rose-500 outline-none transition-all h-24 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter details about this transaction..."
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-5 rounded-xl shadow-lg transition-all active-tap uppercase tracking-widest flex items-center justify-center gap-2"
          >
            Authorize Expense <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
