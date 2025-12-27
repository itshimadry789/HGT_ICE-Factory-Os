
import React, { useState } from 'react';
import { Customer, PaymentStatus } from '../types';
import { formatCurrency } from '../utils';
import { ShoppingCart, User, Hash, CreditCard, Banknote, CheckCircle2, ChevronDown } from 'lucide-react';

interface SalesFormProps {
  customers: Customer[];
  onSave: (saleData: any) => void;
}

const SalesForm: React.FC<SalesFormProps> = ({ customers, onSave }) => {
  const UNIT_PRICE = 25000;
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.CASH);

  const total = Number(quantity) * UNIT_PRICE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !quantity) return;
    onSave({
      customer_id: customerId,
      quantity_blocks: Number(quantity),
      unit_price: UNIT_PRICE,
      total_amount: total,
      payment_status: paymentStatus
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="nexus-card overflow-hidden shadow-2xl shadow-slate-200/50 border-none">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tight">New Transaction</h2>
            <div className="flex items-center gap-2 mt-1 opacity-70">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <p className="text-xs font-bold uppercase tracking-widest">Terminal Active</p>
            </div>
          </div>
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10 border border-white/20">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Customer Select */}
            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-purple-600 transition-colors">
                <User className="w-3.5 h-3.5" /> Client Profile
              </label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-50 border-none rounded-xl p-4 pr-10 text-sm font-bold text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-100"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="">Select Buyer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-3 group">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-purple-600 transition-colors">
                <Hash className="w-3.5 h-3.5" /> Unit Quantity
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  inputMode="numeric"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Blocks</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" /> Settlement Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentStatus(PaymentStatus.CASH)}
                className={`p-5 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all active-tap duration-200 ${
                  paymentStatus === PaymentStatus.CASH 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-6 h-6 mb-1" />
                <span className="font-bold uppercase text-[10px] tracking-widest">Cash Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus(PaymentStatus.CREDIT)}
                className={`p-5 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all active-tap duration-200 ${
                  paymentStatus === PaymentStatus.CREDIT 
                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-lg shadow-purple-100' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-6 h-6 mb-1" />
                <span className="font-bold uppercase text-[10px] tracking-widest">Ledger Credit</span>
              </button>
            </div>
          </div>

          {/* Receipt Total */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 relative">
             <div className="flex justify-between items-end">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Total</p>
                  <p className="text-4xl font-black text-slate-900 monospaced tracking-tighter">{formatCurrency(total)}</p>
               </div>
               <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                 <p className="text-sm font-bold text-slate-600 monospaced">{formatCurrency(UNIT_PRICE)}</p>
               </div>
             </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold text-sm py-5 rounded-xl shadow-xl shadow-slate-900/10 transition-all active-tap uppercase tracking-widest flex items-center justify-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            Process Transaction
          </button>
        </form>
      </div>
    </div>
  );
};

export default SalesForm;
