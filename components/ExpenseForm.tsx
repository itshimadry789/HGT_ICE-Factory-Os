
import React, { useState } from 'react';
import { Receipt, Tag, FileText, Banknote, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ExpenseCategory } from '../types';

interface ExpenseFormProps {
  onSave: (expenseData: any) => Promise<void> | void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSave }) => {
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FOOD);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const resetForm = () => {
    setCategory(ExpenseCategory.FOOD);
    setAmount('');
    setDescription('');
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    
    if (!amount || !description.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setSubmitError('Please enter a valid positive amount');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave({
        category,
        amount: amountValue,
        description: description.trim(),
        currency: 'SSP'
      });
      
      setSubmitSuccess(true);
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting expense:', error);
      setSubmitError(error.message || 'Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8">
      <div className="nexus-card overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center relative overflow-hidden">
           <div className="relative z-10">
              <h2 className="text-2xl font-black text-white tracking-tight">Expense Registry</h2>
              <div className="flex items-center gap-2 mt-1.5 opacity-70">
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Operational Costs</p>
              </div>
           </div>
           <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10 border border-white/20 shadow-lg">
              <Receipt className="w-7 h-7 text-white" />
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Success Message */}
          {submitSuccess && (
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800">Expense saved successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4">
              <p className="text-sm font-medium text-red-800">{submitError}</p>
            </div>
          )}
          
          {/* Category Selector */}
          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-rose-600 transition-colors">
              <Tag className="w-3.5 h-3.5" /> Cost Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.values(ExpenseCategory).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={isSubmitting}
                  className={`p-4 rounded-xl text-[10px] font-black uppercase transition-all active-tap border-2 ${
                    category === cat 
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-lg shadow-rose-100' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-rose-600 transition-colors">
              <Banknote className="w-3.5 h-3.5" /> Amount (SSP)
            </label>
            <div className="relative">
              <input 
                type="number"
                inputMode="numeric"
                min="0"
                disabled={isSubmitting}
                className={`w-full bg-slate-50 border-none rounded-xl p-4 text-3xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                value={amount}
                onChange={(e) => {
                  // Block negative values - only allow positive numbers
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    setAmount(value);
                    setSubmitError(null);
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent minus sign from being typed
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  // Prevent pasting negative numbers
                  const pastedText = e.clipboardData.getData('text');
                  if (pastedText.includes('-')) {
                    e.preventDefault();
                  }
                }}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-3 group">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-rose-600 transition-colors">
              <FileText className="w-3.5 h-3.5" /> Description / Notes
            </label>
            <textarea 
              disabled={isSubmitting}
              className={`w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-rose-500 outline-none transition-all h-24 resize-none placeholder:text-slate-300 hover:bg-slate-100 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setSubmitError(null);
              }}
              placeholder="Enter details about this transaction..."
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-5 rounded-xl shadow-xl shadow-slate-900/10 transition-all active-tap uppercase tracking-widest flex items-center justify-center gap-3 group ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Authorize Expense</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
