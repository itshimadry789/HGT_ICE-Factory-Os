
import React, { useState, useEffect, useRef } from 'react';
import { Sale, Expense, FuelLog, Customer, ExpenseCategory, ProductionLog, FixedCost, FixedCostCategory } from '../types';
import { formatCurrency } from '../utils';
import { 
  AreaChart, Area, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Activity, ArrowUpRight, Target, Zap, TrendingDown, Download, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api-client';

interface ReportsProps {
  sales: Sale[];
  expenses: Expense[];
  fixedCosts: FixedCost[];
  fuelLogs: FuelLog[];
  customers: Customer[];
  productionLogs?: ProductionLog[];
}

// Extended metrics interface matching backend response
interface IntelligenceMetrics {
  net_profit: number;
  total_revenue: number;
  total_burn: number;
  yield_efficiency: number;
  cost_per_unit: number;
  production_count: number;
  cash_revenue: number;
  credit_revenue: number;
  cash_percentage: number;
  credit_percentage: number;
  comparison: {
    net_profit: number;
    total_revenue: number;
    total_burn: number;
    production_count: number;
    revenue_trend: number;
    profit_trend: number;
    burn_trend: number;
    production_trend: number;
  };
  period: {
    start_date: string;
    end_date: string;
    comparison_start_date: string;
    comparison_end_date: string;
    days_in_period: number;
  };
}

// --- Premium Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px]">
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-3 border-b border-white/10 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: entry.color || entry.fill, color: entry.color || entry.fill }}></div>
              <span className="text-white/90 text-xs font-bold">{entry.name}</span>
            </div>
            <span className="text-white font-black monospaced text-sm tracking-tight">
              {typeof entry.value === 'number' && entry.name !== 'Blocks' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

type PeriodOption = '24days' | '7days' | '30days' | '1year';

const Reports: React.FC<ReportsProps> = ({ sales, expenses, fixedCosts, fuelLogs, productionLogs = [] }) => {
  const [isLiveView, setIsLiveView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('7days');
  const [intelligenceMetrics, setIntelligenceMetrics] = useState<IntelligenceMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const reportsRef = useRef<HTMLDivElement>(null);

  // Calculate date range based on selected period
  const getDateRange = (period: PeriodOption) => {
    const now = new Date();
    let startDate: Date;
    
    if (period === '24days') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 24);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '7days') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === '30days') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // 1 year
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
    }
    
    return { start: startDate, end: now };
  };

  // Fetch intelligence metrics from API when period changes
  useEffect(() => {
    const fetchIntelligenceMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const { start, end } = getDateRange(selectedPeriod);
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];
        
        const response = await apiClient.reports.getDashboard(startDateStr, endDateStr);
        if (response?.success && response.data) {
          setIntelligenceMetrics(response.data);
        } else {
          setIntelligenceMetrics(null);
        }
      } catch (error) {
        console.error('Failed to fetch intelligence metrics:', error);
        setIntelligenceMetrics(null);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchIntelligenceMetrics();
  }, [selectedPeriod]);

  // --- Data Processing (filtered by selected period) ---
  const getFilteredData = () => {
    const { start, end } = getDateRange(selectedPeriod);
    
    const filteredSales = sales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate >= start && saleDate <= end;
    });
    
    const filteredExpenses = expenses.filter(e => {
      const expenseDate = new Date((e as any).expense_date || e.created_at);
      return expenseDate >= start && expenseDate <= end;
    });

    const filteredFixedCosts = fixedCosts.filter(fc => {
      const costDate = new Date((fc as any).cost_date || fc.created_at);
      return costDate >= start && costDate <= end;
    });
    
    const filteredFuelLogs = fuelLogs.filter(f => {
      const fuelDate = new Date((f as any).fuel_date || f.created_at);
      return fuelDate >= start && fuelDate <= end;
    });
    
    return { filteredSales, filteredExpenses, filteredFixedCosts, filteredFuelLogs };
  };
  
  const { filteredSales, filteredExpenses, filteredFixedCosts, filteredFuelLogs } = getFilteredData();
  
  // Use API metrics if available, otherwise calculate from client data
  const totalRevenue = intelligenceMetrics?.total_revenue ?? filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = intelligenceMetrics
    ? (intelligenceMetrics.total_burn - (intelligenceMetrics.total_burn - (filteredExpenses.reduce((sum, e) => sum + e.amount, 0) + filteredFixedCosts.reduce((sum, c) => sum + c.amount, 0)) - filteredFuelLogs.reduce((sum, f) => sum + f.total_cost, 0)))
    : (filteredExpenses.reduce((sum, e) => sum + e.amount, 0) + filteredFixedCosts.reduce((sum, c) => sum + c.amount, 0));
  const totalFuel = intelligenceMetrics
    ? (intelligenceMetrics.total_burn - totalExpenses)
    : filteredFuelLogs.reduce((sum, f) => sum + f.total_cost, 0);
  
  // CRITICAL: Use API values for accurate calculations
  const totalBurn = intelligenceMetrics?.total_burn ?? (
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0) +
    filteredFixedCosts.reduce((sum, c) => sum + c.amount, 0) +
    filteredFuelLogs.reduce((sum, f) => sum + f.total_cost, 0)
  );
  const netProfit = intelligenceMetrics?.net_profit ?? (totalRevenue - totalBurn);
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const yieldEfficiency = intelligenceMetrics?.yield_efficiency ?? 0;
  
  // Trend data from API
  const revenueTrend = intelligenceMetrics?.comparison?.revenue_trend ?? 0;
  const profitTrend = intelligenceMetrics?.comparison?.profit_trend ?? 0;
  const burnTrend = intelligenceMetrics?.comparison?.burn_trend ?? 0;

  // Generate financial trend data based on selected period
  const generateFinancialTrendData = (period: PeriodOption) => {
    const now = new Date();
    let dateRange: string[] = [];
    let dateFormatter: (date: Date) => string;

    if (period === '24days') {
      // Last 24 days - daily breakdown
      dateRange = Array.from({ length: 24 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (23 - i));
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      });
      dateFormatter = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
    } else if (period === '7days') {
      // Last 7 days - daily breakdown
      dateRange = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      });
      dateFormatter = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      };
    } else if (period === '30days') {
      // Last 30 days - daily breakdown
      dateRange = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      });
      dateFormatter = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
    } else {
      // 1 year - monthly breakdown
      dateRange = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now);
        d.setMonth(now.getMonth() - (11 - i));
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().split('T')[0];
      });
      dateFormatter = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short' });
      };
    }

    return dateRange.map(dateStr => {
      const date = new Date(dateStr + 'T00:00:00');
      const dayLabel = dateFormatter(date);
      
      let revenue = 0;
      let cost = 0;
      let blocks = 0;

      if (period === '1year') {
        // Filter by month
        const monthStart = new Date(date);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setHours(0, 0, 0, 0);
        
        revenue = sales
          .filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate >= monthStart && saleDate < monthEnd;
          })
          .reduce((sum, s) => sum + s.total_amount, 0);
        
        cost = expenses
          .filter(e => {
            const expenseDate = new Date((e as any).expense_date || e.created_at);
            return expenseDate >= monthStart && expenseDate < monthEnd;
          })
          .reduce((sum, e) => sum + e.amount, 0)
          + fixedCosts
          .filter(fc => {
            const costDate = new Date((fc as any).cost_date || fc.created_at);
            return costDate >= monthStart && costDate < monthEnd;
          })
          .reduce((sum, fc) => sum + fc.amount, 0)
          + fuelLogs
          .filter(f => {
            const fuelDate = new Date((f as any).fuel_date || f.created_at);
            return fuelDate >= monthStart && fuelDate < monthEnd;
          })
          .reduce((sum, f) => sum + f.total_cost, 0);

        // Use production logs for blocks, fallback to sales if no production data
        if (productionLogs && productionLogs.length > 0) {
          blocks = productionLogs
            .filter(p => {
              const prodDate = new Date(p.production_date || p.created_at);
              return prodDate >= monthStart && prodDate < monthEnd;
            })
            .reduce((sum, p) => sum + (p.quantity_produced || 0), 0);
        } else {
          blocks = sales
            .filter(s => {
              const saleDate = new Date(s.created_at);
              return saleDate >= monthStart && saleDate < monthEnd;
            })
            .reduce((sum, s) => sum + s.quantity_blocks, 0);
        }
      } else {
        // Filter by date (for 24days, 7days, 30days)
        const dateOnly = dateStr.split('T')[0];
        
        revenue = sales
          .filter(s => s.created_at.startsWith(dateOnly))
          .reduce((sum, s) => sum + s.total_amount, 0);
        
        cost = expenses
          .filter(e => {
            const expenseDate = (e as any).expense_date || e.created_at;
            return expenseDate.startsWith(dateOnly);
          })
          .reduce((sum, e) => sum + e.amount, 0) 
          + fixedCosts
          .filter(fc => {
            const costDate = (fc as any).cost_date || fc.created_at;
            return costDate.startsWith(dateOnly);
          })
          .reduce((sum, fc) => sum + fc.amount, 0)
          + fuelLogs
          .filter(f => {
            const fuelDate = (f as any).fuel_date || f.created_at;
            return fuelDate.startsWith(dateOnly);
          })
          .reduce((sum, f) => sum + f.total_cost, 0);

        // Use production logs for blocks, fallback to sales if no production data
        if (productionLogs && productionLogs.length > 0) {
          blocks = productionLogs
            .filter(p => {
              const prodDate = p.production_date || p.created_at;
              return prodDate.startsWith(dateOnly);
            })
            .reduce((sum, p) => sum + (p.quantity_produced || 0), 0);
        } else {
          blocks = sales
            .filter(s => s.created_at.startsWith(dateOnly))
            .reduce((sum, s) => sum + s.quantity_blocks, 0);
        }
      }

      return {
        date: dayLabel,
        revenue,
        cost,
        blocks,
        profit: revenue - cost
      };
    });
  };

  const financialTrendData = generateFinancialTrendData(selectedPeriod);

  // Calculate cost distribution from client data
  const costDistribution = [
    { name: 'Generator Fuel', value: filteredFuelLogs.reduce((sum, f) => sum + f.total_cost, 0), color: '#F59E0B' }, // Amber
    ...Object.values(ExpenseCategory).map((cat, idx) => ({
      name: cat.charAt(0) + cat.slice(1).toLowerCase(),
      value: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
      color: [ '#8B5CF6', '#EC4899', '#10B981', '#3B82F6'][idx] || '#64748B'
    })).filter(e => e.value > 0),
    ...Object.values(FixedCostCategory).map((cat, idx) => ({
      name: `Fixed ${cat.charAt(0) + cat.slice(1).toLowerCase()}`,
      value: filteredFixedCosts.filter(fc => fc.category === cat).reduce((sum, fc) => sum + fc.amount, 0),
      color: [ '#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F'][idx] || '#A16207'
    })).filter(e => e.value > 0)
  ];

  // Get period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case '24days': return 'Last 24 Days';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '1year': return 'Last 1 Year';
    }
  };

  // Export PDF functionality
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Create a printable version of the reports
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        setIsExporting(false);
        return;
      }

      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Business Intelligence Report - ${reportDate}</title>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 20px;
                color: #1e293b;
                background: white;
              }
              .header {
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              h1 { font-size: 28px; font-weight: 900; margin: 0 0 5px 0; color: #0f172a; }
              .subtitle { color: #64748b; font-size: 14px; margin: 0; }
              .date { color: #64748b; font-size: 12px; margin-top: 10px; }
              .kpi-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
              }
              .kpi-card {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                background: #f8fafc;
              }
              .kpi-label {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #64748b;
                margin-bottom: 10px;
              }
              .kpi-value {
                font-size: 24px;
                font-weight: 900;
                color: #0f172a;
                margin-bottom: 5px;
              }
              .kpi-detail {
                font-size: 12px;
                color: #64748b;
              }
              .section {
                margin-bottom: 40px;
                page-break-inside: avoid;
              }
              .section-title {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 15px;
                color: #0f172a;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e2e8f0;
              }
              th {
                background: #f1f5f9;
                font-weight: 700;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #475569;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #64748b;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Business Intelligence Report</h1>
              <p class="subtitle">Financial velocity and operational analytics</p>
              <p class="date">Generated on ${reportDate} - Period: ${getPeriodLabel()}</p>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">Net Profit</div>
                <div class="kpi-value">${formatCurrency(netProfit)}</div>
                <div class="kpi-detail">${profitMargin.toFixed(1)}% Profit Margin</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Total Revenue</div>
                <div class="kpi-value">${formatCurrency(totalRevenue)}</div>
                <div class="kpi-detail">Gross income before deductions</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Total Burn (OpEx + Fuel)</div>
                <div class="kpi-value">${formatCurrency(totalBurn)}</div>
                <div class="kpi-detail">All operational expenses combined</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Yield Efficiency</div>
                <div class="kpi-value">${yieldEfficiency.toFixed(1)}%</div>
                <div class="kpi-detail">Production vs Capacity</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Financial Trend (${getPeriodLabel()})</div>
              <table>
                <thead>
                  <tr>
                    <th>${selectedPeriod === '1year' ? 'Month' : 'Date'}</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Blocks</th>
                  </tr>
                </thead>
                <tbody>
                  ${financialTrendData.map(day => `
                    <tr>
                      <td>${day.date}</td>
                      <td>${formatCurrency(day.revenue)}</td>
                      <td>${formatCurrency(day.cost)}</td>
                      <td>${formatCurrency(day.profit)}</td>
                      <td>${day.blocks}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Cost Distribution</div>
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${costDistribution.map(item => {
                    const percentage = totalBurn > 0 
                      ? ((item.value / totalBurn) * 100).toFixed(1) 
                      : '0.0';
                    return `
                      <tr>
                        <td>${item.name}</td>
                        <td>${formatCurrency(item.value)}</td>
                        <td>${percentage}%</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>HGT Ice Factory OS - Business Intelligence Report</p>
              <p>This report contains confidential business information</p>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  // Live View - Auto refresh functionality
  useEffect(() => {
    if (isLiveView) {
      const interval = setInterval(() => {
        // Trigger a page refresh to get latest data
        window.location.reload();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isLiveView]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Financial velocity and operational analytics.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <button 
             onClick={handleExportPDF}
             disabled={isExporting}
             className="bg-white border border-slate-200 text-slate-600 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active-tap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-1 sm:flex-none"
           >
             <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-spin' : ''}`} />
             {isExporting ? 'Exporting...' : 'Export PDF'}
           </button>
           <button 
             onClick={() => setIsLiveView(!isLiveView)}
             className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active-tap flex items-center justify-center gap-2 flex-1 sm:flex-none ${
               isLiveView 
                 ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20' 
                 : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'
             }`}
           >
             <RefreshCw className={`w-3.5 h-3.5 ${isLiveView ? 'animate-spin' : ''}`} />
             {isLiveView ? 'Live On' : 'Live View'}
           </button>
        </div>
      </div>

      {/* Live View Indicator */}
      {isLiveView && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <p className="text-sm font-bold text-emerald-700 flex-1">
            Live View Active - Auto-refreshing every 30 seconds
          </p>
          <button
            onClick={() => setIsLiveView(false)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            Stop
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loadingMetrics && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-blue-700">Loading metrics...</p>
        </div>
      )}

      {/* KPI Cards - High Fidelity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="nexus-card p-6 bg-slate-900 text-white border-none shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-purple-500/20 transition-all duration-500"></div>
           <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Net Profit</span>
               <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                 <Activity className="w-4 h-4 text-emerald-400" />
               </div>
             </div>
             <p className="text-3xl font-black monospaced tracking-tight">{formatCurrency(netProfit)}</p>
             <div className="flex items-center gap-2 mt-2">
               <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                 profitMargin >= 0 
                   ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20' 
                   : 'bg-rose-500/20 text-rose-300 border-rose-500/20'
               }`}>
                 {profitMargin.toFixed(1)}% Margin
               </span>
               {profitTrend !== 0 && (
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                   profitTrend >= 0 
                     ? 'bg-emerald-500/20 text-emerald-300' 
                     : 'bg-rose-500/20 text-rose-300'
                 }`}>
                   {profitTrend >= 0 ? '+' : ''}{profitTrend.toFixed(1)}% vs prev
                 </span>
               )}
             </div>
           </div>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:border-purple-200 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Revenue</span>
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
               <ArrowUpRight className="w-4 h-4" />
             </div>
           </div>
           <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">{formatCurrency(totalRevenue)}</p>
           <div className="flex items-center gap-2 mt-2">
             <p className="text-xs text-slate-400 font-medium">Gross income before deductions</p>
             {revenueTrend !== 0 && (
               <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                 revenueTrend >= 0 
                   ? 'bg-emerald-50 text-emerald-700' 
                   : 'bg-rose-50 text-rose-700'
               }`}>
                 {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
               </span>
             )}
           </div>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:border-rose-200 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Burn</span>
             <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
               <TrendingDown className="w-4 h-4" />
             </div>
           </div>
           <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">{formatCurrency(totalBurn)}</p>
           <div className="flex items-center gap-2 mt-2">
             <p className="text-xs text-slate-400 font-medium">OpEx + Fuel Costs</p>
             {burnTrend !== 0 && (
               <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                 burnTrend <= 0 
                   ? 'bg-emerald-50 text-emerald-700' 
                   : 'bg-rose-50 text-rose-700'
               }`}>
                 {burnTrend >= 0 ? '+' : ''}{burnTrend.toFixed(1)}%
               </span>
             )}
           </div>
        </div>

        <div className="nexus-card p-6 relative overflow-hidden group hover:border-amber-200 transition-all duration-300">
           <div className="flex justify-between items-start mb-4">
             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Yield Efficiency</span>
             <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
               <Zap className="w-4 h-4" />
             </div>
           </div>
           <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">{yieldEfficiency.toFixed(1)}%</p>
           <p className="text-xs text-slate-400 font-medium mt-2">Production vs Capacity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Financial Trend Chart */}
        <div className="nexus-card p-8 xl:col-span-2 shadow-lg shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-base font-bold text-slate-900">Financial Velocity</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenue vs Cost Analysis</p>
              </div>
            </div>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as PeriodOption)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-100 cursor-pointer transition-all hover:bg-white hover:border-slate-300"
            >
              <option value="24days">Last 24 Days</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="1year">Last 1 Year</option>
            </select>
          </div>
          
          <div className="h-[400px] w-full">
            {financialTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrendData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={selectedPeriod === '1year' ? 9 : 10} 
                    fontWeight={600} 
                    stroke="#94A3B8" 
                    tick={{dy: 10}}
                    angle={selectedPeriod === '30days' || selectedPeriod === '24days' ? -45 : 0}
                    textAnchor={selectedPeriod === '30days' || selectedPeriod === '24days' ? 'end' : 'middle'}
                    height={selectedPeriod === '30days' || selectedPeriod === '24days' ? 60 : 30}
                    minTickGap={selectedPeriod === '30days' || selectedPeriod === '24days' ? 30 : 10}
                    interval={selectedPeriod === '30days' ? 2 : selectedPeriod === '24days' ? 1 : 'preserveStartEnd'}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={11} 
                    fontWeight={600} 
                    stroke="#94A3B8"
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val.toString();
                    }}
                    width={selectedPeriod === '1year' ? 50 : 60}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748B', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area 
                    name="Revenue"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    fill="url(#colorRev)" 
                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#4F46E5' }}
                    animationDuration={1500}
                  />
                  <Area 
                    name="Cost"
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#F43F5E" 
                    strokeWidth={3} 
                    fill="url(#colorCost)"
                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#F43F5E' }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-bold">No data available for selected period</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost Structure Donut */}
        <div className="nexus-card p-8 shadow-lg shadow-slate-200/50 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-base font-bold text-slate-900">Cost Structure</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expense Breakdown</p>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={costDistribution} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={80} 
                  outerRadius={100} 
                  paddingAngle={8} 
                  dataKey="value" 
                  stroke="none"
                  cornerRadius={6}
                >
                  {costDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color as string} 
                      className="outline-none cursor-pointer hover:opacity-80 transition-opacity duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconType="circle"
                  layout="vertical"
                  iconSize={8}
                  wrapperStyle={{ bottom: 0, fontSize: '11px', fontWeight: 600, color: '#475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Burn</span>
              <span className="text-lg font-black text-slate-900 monospaced">{formatCurrency(totalBurn)}</span>
            </div>
          </div>
        </div>

        {/* Production vs Efficiency Chart */}
        <div className="nexus-card p-8 xl:col-span-3 shadow-lg shadow-slate-200/50">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-base font-bold text-slate-900">Operational Yield</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Volume Produced vs Profit</p>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {financialTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financialTrendData} margin={{ top: 20, right: 20, left: 0, bottom: selectedPeriod === '30days' || selectedPeriod === '24days' || selectedPeriod === '1year' ? 50 : 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={selectedPeriod === '1year' ? 9 : 10} 
                    fontWeight={600} 
                    stroke="#94A3B8"
                    angle={selectedPeriod === '30days' || selectedPeriod === '24days' ? -45 : 0}
                    textAnchor={selectedPeriod === '30days' || selectedPeriod === '24days' ? 'end' : 'middle'}
                    height={selectedPeriod === '30days' || selectedPeriod === '24days' ? 60 : 30}
                    minTickGap={selectedPeriod === '30days' || selectedPeriod === '24days' ? 30 : 10}
                    interval={selectedPeriod === '30days' ? 2 : selectedPeriod === '24days' ? 1 : 'preserveStartEnd'}
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={11} 
                    fontWeight={600} 
                    stroke="#94A3B8"
                    label={{ value: 'Blocks', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 600, fill: '#94A3B8' } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={11} 
                    fontWeight={600} 
                    stroke="#94A3B8"
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                      return val.toString();
                    }}
                    label={{ value: 'Profit', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 600, fill: '#94A3B8' } }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
                  <Bar yAxisId="left" dataKey="blocks" name="Blocks" barSize={selectedPeriod === '1year' ? 20 : selectedPeriod === '30days' || selectedPeriod === '24days' ? 10 : 32} radius={[6, 6, 6, 6]} fill="#E2E8F0" />
                  <Line yAxisId="right" type="monotone" dataKey="profit" name="Net Profit" stroke="#10B981" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff', stroke:'#10B981'}} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-bold">No data available for selected period</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
