
import React, { useState, useCallback } from 'react';
import { Customer, PaymentStatus } from '../types';
import { formatCurrency } from '../utils';
import { ShoppingCart, Hash, CreditCard, Banknote, CheckCircle2, Download, FileText, Printer, X, Check } from 'lucide-react';
import ClientSelector from './shared/ClientSelector';
import AlertBanner from './shared/AlertBanner';

interface SalesFormProps {
  customers: Customer[];
  onSave: (saleData: any) => void;
  onCustomerCreated?: (customer: Customer) => void;
}

interface TransactionData {
  client: string;
  amount: number;
  method: PaymentStatus;
  units: number;
  invoiceNumber: string;
  date: string;
  time: string;
}

const SalesForm: React.FC<SalesFormProps> = ({ customers, onSave, onCustomerCreated }) => {
  const UNIT_PRICE = 25000;
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.CASH);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<TransactionData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState<string | null>(null);

  const total = Number(quantity) * UNIT_PRICE;
  const selectedClientData = customers.find(c => c.id === customerId);
  const showCreditWarning = selectedClientData?.total_credit_due && selectedClientData.total_credit_due > 10000000 && paymentStatus === PaymentStatus.CREDIT;

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `HGT-${year}${month}${day}-${random}`;
  };

  // Generate invoice HTML content
  const generateInvoiceHTML = useCallback((transaction: TransactionData) => {
    const isCash = transaction.method === PaymentStatus.CASH;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${transaction.invoiceNumber} - HGT Ice Factory</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f1f5f9;
      min-height: 100vh;
      padding: 20px;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .invoice-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 40px;
      position: relative;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .brand-logo {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
      color: white;
      letter-spacing: -1px;
    }
    
    .brand-info h1 {
      font-size: 24px;
      font-weight: 800;
      color: white;
      letter-spacing: -0.5px;
    }
    
    .brand-info p {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }
    
    .invoice-meta {
      text-align: right;
    }
    
    .invoice-badge {
      background: ${isCash ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'};
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      display: inline-block;
      margin-bottom: 12px;
    }
    
    .invoice-number {
      font-size: 13px;
      font-weight: 700;
      color: white;
      margin-bottom: 4px;
    }
    
    .invoice-date {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .invoice-body {
      padding: 40px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .info-section h3 {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }
    
    .info-section .name {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }
    
    .info-section .detail {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    
    .items-table {
      width: 100%;
      margin-bottom: 30px;
    }
    
    .items-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 16px;
      padding: 14px 20px;
      background: #f8fafc;
      border-radius: 10px;
      margin-bottom: 8px;
    }
    
    .items-header span {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .items-header span:last-child {
      text-align: right;
    }
    
    .item-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 16px;
      padding: 18px 20px;
      border-bottom: 1px solid #f1f5f9;
      align-items: center;
    }
    
    .item-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 14px;
    }
    
    .item-desc {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
    }
    
    .item-row span {
      font-size: 14px;
      color: #475569;
      font-weight: 500;
    }
    
    .item-row span:last-child {
      text-align: right;
      font-weight: 700;
      color: #1e293b;
    }
    
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    
    .totals-box {
      width: 280px;
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }
    
    .total-row span:first-child {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }
    
    .total-row span:last-child {
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
    }
    
    .total-row.grand {
      border-top: 2px solid #1e293b;
      margin-top: 10px;
      padding-top: 14px;
    }
    
    .total-row.grand span:first-child {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .total-row.grand span:last-child {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
    }
    
    .payment-status {
      text-align: center;
      padding: 20px;
      background: ${isCash ? '#ecfdf5' : '#f5f3ff'};
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: ${isCash ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'};
      color: white;
      border-radius: 24px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .payment-status p {
      margin-top: 10px;
      font-size: 12px;
      color: #64748b;
    }
    
    .invoice-footer {
      background: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-message {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 6px;
    }
    
    .footer-contact {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 16px;
    }
    
    .footer-brand {
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .print-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 24px;
      padding: 20px;
    }
    
    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    
    .print-btn.primary {
      background: #0f172a;
      color: white;
    }
    
    .print-btn.primary:hover {
      background: #1e293b;
    }
    
    .print-btn.secondary {
      background: white;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    
    .print-btn.secondary:hover {
      background: #f8fafc;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .invoice-wrapper {
        max-width: 100%;
      }
      
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }
      
      .print-actions {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="header-content">
          <div class="brand">
            <div class="brand-logo">HG</div>
            <div class="brand-info">
              <h1>HGT Ice Factory</h1>
              <p>Premium Ice Manufacturing</p>
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-badge">${isCash ? 'Paid' : 'Credit'}</div>
            <div class="invoice-number">${transaction.invoiceNumber}</div>
            <div class="invoice-date">${transaction.date} at ${transaction.time}</div>
          </div>
        </div>
      </div>
      
      <div class="invoice-body">
        <div class="info-grid">
          <div class="info-section">
            <h3>Bill To</h3>
            <div class="name">${transaction.client}</div>
            <div class="detail">Customer Account<br>HGT Ice Factory</div>
          </div>
          <div class="info-section" style="text-align: right;">
            <h3>From</h3>
            <div class="name">HGT Ice Factory</div>
            <div class="detail">Industrial Zone<br>South Sudan</div>
          </div>
        </div>
        
        <div class="items-table">
          <div class="items-header">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span>Amount</span>
          </div>
          <div class="item-row">
            <div>
              <div class="item-name">Premium Ice Blocks</div>
              <div class="item-desc">Commercial grade ice blocks</div>
            </div>
            <span>${transaction.units}</span>
            <span>${formatCurrency(UNIT_PRICE)}</span>
            <span>${formatCurrency(transaction.amount)}</span>
          </div>
        </div>
        
        <div class="totals-section">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatCurrency(transaction.amount)}</span>
            </div>
            <div class="total-row">
              <span>Tax (0%)</span>
              <span>0 SSP</span>
            </div>
            <div class="total-row grand">
              <span>Total</span>
              <span>${formatCurrency(transaction.amount)}</span>
            </div>
          </div>
        </div>
        
        <div class="payment-status">
          <div class="status-badge">
            ${isCash ? 'Paid in Full' : 'Credit - Added to Ledger'}
          </div>
          <p>${isCash ? 'Payment received in cash at time of sale' : 'Amount added to customer credit balance'}</p>
        </div>
      </div>
      
      <div class="invoice-footer">
        <div class="footer-message">Thank you for your business!</div>
        <div class="footer-contact">For questions, please contact our sales team</div>
        <div class="footer-brand">HGT Ice Factory OS</div>
      </div>
    </div>
    
    <div class="print-actions">
      <button class="print-btn primary" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print / Save as PDF
      </button>
      <button class="print-btn secondary" onclick="window.close()">
        Close
      </button>
    </div>
  </div>
  
  <script>
    // Auto-focus print dialog after a short delay
    setTimeout(function() {
      // Check if user wants to auto-print
      if (window.location.hash === '#print') {
        window.print();
      }
    }, 300);
  </script>
</body>
</html>`;
  }, [UNIT_PRICE]);

  // Download invoice as HTML file
  const handleDownloadInvoice = useCallback(async () => {
    if (!lastTransaction) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const invoiceHTML = generateInvoiceHTML(lastTransaction);
      
      // Create blob and download
      const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${lastTransaction.invoiceNumber}.html`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [lastTransaction, generateInvoiceHTML]);

  // Quick print - opens invoice in new window for printing
  const handleQuickPrint = useCallback(async () => {
    if (!lastTransaction) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const invoiceHTML = generateInvoiceHTML(lastTransaction);
      
      // Create blob and open
      const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // Fallback: create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${lastTransaction.invoiceNumber}.html`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('Invoice downloaded! Open the file and use your browser\'s Print function to save as PDF.');
      }
      
      // Clean up URL after delay
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [lastTransaction, generateInvoiceHTML]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !quantity) return;
    
    const transactionData = {
      customer_id: customerId,
      quantity_blocks: Number(quantity),
      unit_price: UNIT_PRICE,
      total_amount: total,
      payment_status: paymentStatus
    };
    
    onSave(transactionData);
    
    const invoiceNumber = generateInvoiceNumber();
    const now = new Date();
    
    setLastTransaction({
      client: selectedClientData?.name || 'Walk-in Customer',
      amount: total,
      method: paymentStatus,
      units: Number(quantity),
      invoiceNumber,
      date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    
    setShowConfirmation(true);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setCustomerId('');
    setQuantity('');
    setPaymentStatus(PaymentStatus.CASH);
    setLastTransaction(null);
  };

  const handleCreateCustomer = async () => {
    setCreateCustomerError(null);
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      setCreateCustomerError('Name and phone number are required.');
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const created = await apiClient.customers.create({
        name: newCustomerName.trim(),
        phone_number: newCustomerPhone.trim(),
        credit_limit: 0
      });

      if (!created?.id) {
        throw new Error('Customer creation failed.');
      }

      onCustomerCreated?.(created as Customer);
      setCustomerId(created.id);
      setShowAddCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (err: any) {
      console.error('Failed to create customer:', err);
      setCreateCustomerError(err.message || 'Failed to create customer.');
    } finally {
      setIsCreatingCustomer(false);
    }
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
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">Terminal Active</p>
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
              <ClientSelector
                clients={customers}
                selectedClient={customerId}
                onChange={setCustomerId}
                onAddNew={() => setShowAddCustomer(true)}
              />
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
                  min="1"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-xl font-black text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all monospaced placeholder:text-slate-300 hover:bg-slate-100"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (parseFloat(value) >= 0 && !value.includes('-'))) {
                      setQuantity(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Blocks</span>
              </div>
            </div>
          </div>

          {/* Credit Warning */}
          {showCreditWarning && (
            <AlertBanner
              type="warning"
              message={`This client already owes ${selectedClientData?.total_credit_due.toLocaleString()} SSP. Consider requesting payment before extending more credit.`}
            />
          )}

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

      {/* Custom Confirmation Modal with Invoice Actions */}
      {showConfirmation && lastTransaction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Success Header */}
            <div className="bg-emerald-500 p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-black text-white">Sale Recorded!</h2>
                <p className="text-emerald-100 text-sm mt-1">{lastTransaction.invoiceNumber}</p>
              </div>
            </div>
            
            {/* Transaction Details */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</span>
                  <span className="text-sm font-bold text-slate-900">{lastTransaction.client}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</span>
                  <span className="text-sm font-bold text-slate-900">{lastTransaction.units} Blocks</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                  <span className="text-sm font-black text-slate-900 monospaced">{formatCurrency(lastTransaction.amount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    lastTransaction.method === PaymentStatus.CASH 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {lastTransaction.method === PaymentStatus.CASH ? 'Cash Received' : 'Added to Ledger'}
                  </span>
                </div>
              </div>
              
              {/* Invoice Actions */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Invoice Options</p>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickPrint();
                  }}
                  disabled={isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white font-bold text-sm py-4 rounded-xl transition-all disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {isGeneratingPDF ? 'Opening...' : 'Open Invoice (Print/PDF)'}
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownloadInvoice();
                  }}
                  disabled={isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm py-4 rounded-xl border border-slate-200 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPDF ? 'Downloading...' : 'Download Invoice File'}
                </button>
              </div>
            </div>
            
            {/* Close Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCloseConfirmation();
                }}
                className="w-full py-3 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
              >
                Done - New Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Add New Client</h2>
                <p className="text-xs text-slate-300 font-medium mt-1">Create a customer and select for this sale.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors"
                disabled={isCreatingCustomer}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {createCustomerError && (
                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-800">{createCustomerError}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  disabled={isCreatingCustomer}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-bold text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  disabled={isCreatingCustomer}
                  placeholder="e.g. +211 9xx xxx xxx"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                disabled={isCreatingCustomer}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={isCreatingCustomer}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isCreatingCustomer ? 'Creating...' : 'Create & Select'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesForm;
