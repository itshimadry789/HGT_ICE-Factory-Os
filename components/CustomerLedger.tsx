
import React, { useMemo, useState } from 'react';
import { Customer } from '../types';
import { formatCurrency } from '../utils';
import apiClient from '../lib/api-client';
import AlertBanner from './shared/AlertBanner';
import { Search, Filter, Phone, CheckCircle2, User, MessageCircle, DollarSign, TrendingUp, AlertTriangle, X } from 'lucide-react';

interface CustomerLedgerProps {
  customers: Customer[];
  onRefreshCustomers?: () => Promise<void> | void;
}

const CustomerLedger: React.FC<CustomerLedgerProps> = ({ customers, onRefreshCustomers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebtors, setFilterDebtors] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Remove duplicates by ID first, then by name if ID is missing
  const uniqueCustomers = customers.filter((customer, index, self) =>
    index === self.findIndex((c) => 
      (c.id && customer.id && c.id === customer.id) || 
      (!c.id && !customer.id && c.name === customer.name && c.phone_number === customer.phone_number)
    )
  );

  const filteredCustomers = useMemo(() => {
    return uniqueCustomers
      .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterDebtors ? c.total_credit_due > 0 : true;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => b.total_credit_due - a.total_credit_due);
  }, [uniqueCustomers, searchTerm, filterDebtors]);

  const totalOutstanding = uniqueCustomers.reduce((sum, c) => sum + c.total_credit_due, 0);
  const overdueClients = uniqueCustomers.filter(c => c.total_credit_due > 0);
  const avgDelay = 35; // This would be calculated from actual payment dates in a real system

  // Calculate days overdue based on oldest credit date (when credit was first taken)
  const getDaysOverdue = (customer: Customer): number => {
    if (customer.total_credit_due <= 0) return 0;
    
    // Use oldest_credit_date if available (most accurate - when credit was first taken)
    if (customer.oldest_credit_date) {
      const creditDate = new Date(customer.oldest_credit_date);
      const today = new Date();
      const diffTime = today.getTime() - creditDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    // Fallback to last_payment_date if oldest_credit_date not available
    if (customer.last_payment_date) {
      const lastPayment = new Date(customer.last_payment_date);
      const today = new Date();
      const diffTime = today.getTime() - lastPayment.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    // Final fallback
    return customer.days_overdue || 0;
  };

  // Format date and time for display
  const formatCreditDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const openPaymentModal = (customer: Customer) => {
    setPaymentError(null);
    setPaymentSuccess(null);
    setPaymentCustomer(customer);
    setPaymentAmount(String(customer.total_credit_due || 0));
    setPaymentMethod('CASH');
    setPaymentNotes('');
  };

  const closePaymentModal = () => {
    setPaymentCustomer(null);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentError(null);
  };

  const submitPayment = async () => {
    if (!paymentCustomer) return;

    setPaymentError(null);
    setPaymentSuccess(null);

    const amountValue = Number(paymentAmount);
    if (!paymentAmount || isNaN(amountValue) || amountValue <= 0) {
      setPaymentError('Enter a valid positive payment amount.');
      return;
    }

    if (amountValue > (paymentCustomer.total_credit_due || 0)) {
      setPaymentError('Payment cannot exceed the current balance due.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await apiClient.payments.create({
        customer_id: paymentCustomer.id,
        amount: amountValue,
        payment_method: paymentMethod,
        notes: paymentNotes?.trim() ? paymentNotes.trim() : undefined,
      });

      setPaymentSuccess(`Payment recorded for ${paymentCustomer.name}.`);

      // Refresh customers so balances update from backend
      await onRefreshCustomers?.();

      // Close modal after short delay so user sees success
      setTimeout(() => {
        closePaymentModal();
        setPaymentSuccess(null);
      }, 800);
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      setPaymentError(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {paymentSuccess && (
        <AlertBanner type="success" message={paymentSuccess} onDismiss={() => setPaymentSuccess(null)} />
      )}
      {paymentError && (
        <AlertBanner type="warning" message={paymentError} onDismiss={() => setPaymentError(null)} />
      )}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Ledger</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Directory and credit risk management.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="nexus-card p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-rose-50/30"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Overdue Clients</span>
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <div className="text-4xl font-black text-slate-900 monospaced tracking-tight">
              {overdueClients.length}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-red-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((overdueClients.length / uniqueCustomers.length) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{Math.round((overdueClients.length / uniqueCustomers.length) * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-amber-50/30"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Outstanding</span>
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="text-4xl font-black text-slate-900 monospaced tracking-tight">
              {formatCurrency(totalOutstanding)}
            </div>
            <div className="mt-3">
              <span className="text-[10px] text-slate-400 font-bold">Across {overdueClients.length} accounts</span>
            </div>
          </div>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-blue-50/30"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Avg Payment Delay</span>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tight">
              {avgDelay} <span className="text-lg text-slate-400 font-bold">days</span>
            </div>
            <div className="mt-3">
              <span className="text-[10px] text-slate-400 font-bold">Payment cycle average</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-purple-600 transition-colors z-10" />
          <input 
            type="text" 
            placeholder="Search client directory..." 
            className="w-full bg-white border-none rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-sm placeholder:text-slate-400 ring-1 ring-slate-200 hover:ring-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setFilterDebtors(!filterDebtors)}
          className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all flex items-center gap-2 shadow-sm active-tap ${
            filterDebtors 
              ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' 
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          {filterDebtors ? 'Debtors Only' : 'All Clients'}
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
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          debtor.total_credit_due > 200000 
                            ? 'bg-rose-50 text-rose-600 border-rose-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                          Outstanding
                        </span>
                        {(() => {
                          const daysOverdue = getDaysOverdue(debtor);
                          return (
                            <div className="flex flex-col gap-1">
                              {daysOverdue > 0 && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                  daysOverdue > 60 ? 'bg-red-500/20 text-red-400' :
                                  daysOverdue > 30 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-green-500/20 text-green-400'
                                }`}>
                                  {daysOverdue} days overdue
                                </span>
                              )}
                              {debtor.oldest_credit_date && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  Credit taken: {formatCreditDate(debtor.oldest_credit_date)}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <a
                        href={`tel:${debtor.phone_number.replace(/\s/g, '')}`}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        title="Call Client"
                      >
                        <Phone className="w-4 h-4 text-white" />
                      </a>
                      <a
                        href={`https://wa.me/${debtor.phone_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                      </a>
                      {debtor.total_credit_due > 0 && (
                        <button
                          onClick={() => {
                            openPaymentModal(debtor);
                          }}
                          className="p-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                          title="Record Payment"
                        >
                          <DollarSign className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
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

      {/* Record Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Record Payment</h2>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  {paymentCustomer.name} — Due: {formatCurrency(paymentCustomer.total_credit_due)}
                </p>
              </div>
              <button
                onClick={closePaymentModal}
                className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                disabled={isSubmittingPayment}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (SSP)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all monospaced"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  disabled={isSubmittingPayment}
                />
                <p className="text-[10px] text-slate-500 font-medium">
                  Max: {formatCurrency(paymentCustomer.total_credit_due)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                <select
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  disabled={isSubmittingPayment}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes (optional)</label>
                <textarea
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all h-20 resize-none"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  disabled={isSubmittingPayment}
                  placeholder="Reference, who paid, etc."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={isSubmittingPayment}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPayment}
                disabled={isSubmittingPayment}
                className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSubmittingPayment ? 'Saving...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLedger;
