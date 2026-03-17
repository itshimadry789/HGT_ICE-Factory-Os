
import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Expense, FuelLog, Customer, PaymentStatus, ExpenseCategory, ProductionLog, FixedCost } from '../types';
import { formatCurrency } from '../utils';
import { 
  TrendingUp, TrendingDown, MoreHorizontal, 
  Info, ShoppingBag, Zap, Wallet, Calendar, ArrowRight, Droplets, Clock, Target, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import CustomTooltip from './shared/Tooltip';
import apiClient from '../lib/api-client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, LabelList, ComposedChart, Line
} from 'recharts';

interface DashboardProps {
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
  // Payment channels
  cash_revenue: number;
  credit_revenue: number;
  cash_percentage: number;
  credit_percentage: number;
  // Comparison data
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
  // Period info
  period: {
    start_date: string;
    end_date: string;
    comparison_start_date: string;
    comparison_end_date: string;
    days_in_period: number;
  };
}

type TimePeriod = 'today' | 'weekly' | 'monthly' | 'yearly';

const Dashboard: React.FC<DashboardProps> = ({ sales, expenses, fixedCosts, fuelLogs, customers, productionLogs = [] }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [intelligenceMetrics, setIntelligenceMetrics] = useState<IntelligenceMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // --- Date Filtering Functions ---
  const getDateRange = (period: TimePeriod) => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        // Last 7 days (matching Reports page logic)
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        // Last 30 days (matching Reports page "30days" logic for consistency)
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end: now };
  };

  const filterByDate = <T extends { created_at: string }>(items: T[], period: TimePeriod, dateField?: string): T[] => {
    const { start, end } = getDateRange(period);
    return items.filter(item => {
      const dateValue = dateField && (item as any)[dateField] ? (item as any)[dateField] : item.created_at;
      const itemDate = new Date(dateValue);
      return itemDate >= start && itemDate <= end;
    });
  };

  // Filter production logs by production_date
  const filterProductionByDate = (items: ProductionLog[], period: TimePeriod): ProductionLog[] => {
    const { start, end } = getDateRange(period);
    return items.filter(item => {
      const itemDate = new Date(item.production_date || item.created_at);
      return itemDate >= start && itemDate <= end;
    });
  };

  // --- Filtered Data ---
  const filteredSales = useMemo(() => filterByDate(sales, selectedPeriod), [sales, selectedPeriod]);
  const filteredExpenses = useMemo(() => filterByDate(expenses, selectedPeriod, 'expense_date'), [expenses, selectedPeriod]);
  const filteredFixedCosts = useMemo(() => filterByDate(fixedCosts, selectedPeriod, 'cost_date'), [fixedCosts, selectedPeriod]);
  const filteredFuelLogs = useMemo(() => filterByDate(fuelLogs, selectedPeriod, 'fuel_date'), [fuelLogs, selectedPeriod]);
  const filteredProductionLogs = useMemo(() => filterProductionByDate(productionLogs, selectedPeriod), [productionLogs, selectedPeriod]);

  // --- Core Calculations (using filtered data as fallback) ---
  const cashSales = filteredSales
    .filter(s => s.payment_status === PaymentStatus.CASH)
    .reduce((sum, s) => sum + s.total_amount, 0);
  
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0) + filteredFixedCosts.reduce((sum, c) => sum + c.amount, 0);
  const totalFuelCost = filteredFuelLogs.reduce((sum, f) => sum + f.total_cost, 0);
  const totalLiters = filteredFuelLogs.reduce((sum, f) => sum + f.liters_added, 0);
  
  const liquidity = cashSales - totalExpenses - totalFuelCost;
  const blocksSold = filteredSales.reduce((sum, s) => sum + s.quantity_blocks, 0);
  
  const productionCost = totalFuelCost + totalExpenses;
  const costPerBlock = blocksSold > 0 ? productionCost / blocksSold : 0;

  // Fetch intelligence metrics from API
  useEffect(() => {
    const fetchIntelligenceMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const { start, end } = getDateRange(selectedPeriod);
        const startDateStr = start.toISOString().split('T')[0];
        const endDateStr = end.toISOString().split('T')[0];
        
        // Pass date parameters to API
        const response = await apiClient.reports.getDashboard(startDateStr, endDateStr);
        if (response?.success && response.data) {
          setIntelligenceMetrics(response.data);
        } else {
          // If API fails, clear metrics to use fallback calculations
          setIntelligenceMetrics(null);
        }
      } catch (error) {
        console.error('Failed to fetch intelligence metrics:', error);
        // Clear metrics to use fallback calculations
        setIntelligenceMetrics(null);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchIntelligenceMetrics();
  }, [selectedPeriod]);

  // Use API metrics if available, otherwise fallback to calculated values
  const netProfit = intelligenceMetrics?.net_profit ?? (totalRevenue - totalExpenses - totalFuelCost);
  const yieldEfficiency = intelligenceMetrics?.yield_efficiency ?? 0;
  const productionCount = intelligenceMetrics?.production_count ?? 0;
  const finalCostPerUnit = intelligenceMetrics?.cost_per_unit ?? costPerBlock;
  
  // Payment channels - use API data if available
  const apiCashRevenue = intelligenceMetrics?.cash_revenue ?? cashSales;
  const apiCreditRevenue = intelligenceMetrics?.credit_revenue ?? (totalRevenue - cashSales);
  const apiCashPercentage = intelligenceMetrics?.cash_percentage ?? (totalRevenue > 0 ? Math.round((cashSales / totalRevenue) * 100) : 0);
  
  // Comparison data from API
  const comparisonRevenue = intelligenceMetrics?.comparison?.total_revenue ?? 0;
  const revenueTrend = intelligenceMetrics?.comparison?.revenue_trend ?? 0;
  
  // Calculate yield percentage for progress bar (0-100%)
  // If we have production count from API, use it; otherwise calculate from sales
  const displayProductionCount = productionCount > 0 ? productionCount : blocksSold;
  const yieldPercentage = Math.min(100, Math.max(0, yieldEfficiency));
  const isOnTarget = yieldPercentage >= 75;
  const isAboveTarget = yieldPercentage >= 100;

  // --- Chart Data (based on selected period) ---
  const generateChartData = () => {
    const { start, end } = getDateRange(selectedPeriod);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (selectedPeriod === 'today') {
      // For today, show hourly breakdown (last 12 hours or current hour)
      const currentHour = new Date().getHours();
      const startHour = Math.max(0, currentHour - 11);
      const hours = Array.from({ length: Math.min(12, currentHour + 1) }, (_, i) => {
        const hour = startHour + i;
        const hourStart = new Date(start);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(start);
        hourEnd.setHours(hour + 1, 0, 0, 0);
        
        const hourSales = filteredSales.filter(s => {
          const saleDate = new Date(s.created_at);
          return saleDate >= hourStart && saleDate < hourEnd;
        }).reduce((sum, s) => sum + s.total_amount, 0);
        
        return {
          name: `${hour.toString().padStart(2, '0')}:00`,
          value: hourSales,
          gradient: hourSales > 0 ? 'from-teal-500 to-cyan-600' : 'from-slate-400 to-slate-500',
          isActive: hour === currentHour
        };
      });
      return hours;
    } else if (selectedPeriod === 'weekly') {
      // For weekly, show daily breakdown
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return Array.from({ length: 7 }, (_, i) => {
        const dayStart = new Date(start);
        dayStart.setDate(start.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const daySales = filteredSales.filter(s => {
          const saleDate = new Date(s.created_at);
          return saleDate >= dayStart && saleDate <= dayEnd;
        }).reduce((sum, s) => sum + s.total_amount, 0);
        
        const today = new Date();
        const isToday = dayStart.toDateString() === today.toDateString();
        
        return {
          name: days[dayStart.getDay()],
          value: daySales,
          gradient: daySales > 0 ? 'from-teal-500 to-cyan-600' : 'from-slate-400 to-slate-500',
          isActive: isToday || daySales > 0
        };
      });
    } else if (selectedPeriod === 'monthly') {
      // For monthly, show weekly breakdown
      const weeks = Math.ceil(daysDiff / 7);
      return Array.from({ length: Math.min(weeks, 4) }, (_, i) => {
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekSales = filteredSales.filter(s => {
          const saleDate = new Date(s.created_at);
          return saleDate >= weekStart && saleDate <= weekEnd;
        }).reduce((sum, s) => sum + s.total_amount, 0);
        
        return {
          name: `W${i + 1}`,
          value: weekSales,
          gradient: weekSales > 0 ? 'from-teal-500 to-cyan-600' : 'from-slate-400 to-slate-500',
          isActive: weekSales > 0
        };
      });
    } else {
      // For yearly, show monthly breakdown
      return Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(start);
        monthStart.setMonth(i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthSales = filteredSales.filter(s => {
          const saleDate = new Date(s.created_at);
          return saleDate >= monthStart && saleDate <= monthEnd;
        }).reduce((sum, s) => sum + s.total_amount, 0);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const isCurrentMonth = i === new Date().getMonth();
        
        return {
          name: monthNames[i],
          value: monthSales,
          gradient: monthSales > 0 ? 'from-teal-500 to-cyan-600' : 'from-slate-400 to-slate-500',
          isActive: isCurrentMonth || monthSales > 0
        };
      });
    }
  };

  const revenueChartData = useMemo(() => generateChartData(), [filteredSales, selectedPeriod]);

  // Generate Operational Yield data (matching Reports page logic)
  const generateOperationalYieldData = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    
    if (selectedPeriod === 'weekly') {
      // For weekly, show daily breakdown (matching Reports page)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return Array.from({ length: 7 }, (_, i) => {
        const dayStart = new Date(start);
        dayStart.setDate(start.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        const dateOnly = dayStart.toISOString().split('T')[0];
        
        const revenue = filteredSales
          .filter(s => s.created_at.startsWith(dateOnly))
          .reduce((sum, s) => sum + s.total_amount, 0);
        
        const cost = filteredExpenses
          .filter(e => {
            const expenseDate = (e as any).expense_date || e.created_at;
            return expenseDate.startsWith(dateOnly);
          })
          .reduce((sum, e) => sum + e.amount, 0) 
          + filteredFuelLogs
          .filter(f => {
            const fuelDate = (f as any).fuel_date || f.created_at;
            return fuelDate.startsWith(dateOnly);
          })
          .reduce((sum, f) => sum + f.total_cost, 0);

        // Use production logs for blocks, fallback to sales
        const blocks = filteredProductionLogs.length > 0
          ? filteredProductionLogs
              .filter(p => {
                const prodDate = p.production_date || p.created_at;
                return prodDate.startsWith(dateOnly);
              })
              .reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
          : filteredSales
              .filter(s => s.created_at.startsWith(dateOnly))
              .reduce((sum, s) => sum + s.quantity_blocks, 0);

        return {
          date: days[dayStart.getDay()] + ' ' + dayStart.getDate(),
          blocks,
          profit: revenue - cost
        };
      });
    } else if (selectedPeriod === 'monthly') {
      // For monthly, show daily breakdown
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Array.from({ length: Math.min(daysDiff, 31) }, (_, i) => {
        const dayStart = new Date(start);
        dayStart.setDate(start.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dateOnly = dayStart.toISOString().split('T')[0];
        
        const revenue = filteredSales
          .filter(s => s.created_at.startsWith(dateOnly))
          .reduce((sum, s) => sum + s.total_amount, 0);
        
        const cost = filteredExpenses
          .filter(e => {
            const expenseDate = (e as any).expense_date || e.created_at;
            return expenseDate.startsWith(dateOnly);
          })
          .reduce((sum, e) => sum + e.amount, 0) 
          + filteredFuelLogs
          .filter(f => {
            const fuelDate = (f as any).fuel_date || f.created_at;
            return fuelDate.startsWith(dateOnly);
          })
          .reduce((sum, f) => sum + f.total_cost, 0);

        const blocks = filteredProductionLogs.length > 0
          ? filteredProductionLogs
              .filter(p => {
                const prodDate = p.production_date || p.created_at;
                return prodDate.startsWith(dateOnly);
              })
              .reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
          : filteredSales
              .filter(s => s.created_at.startsWith(dateOnly))
              .reduce((sum, s) => sum + s.quantity_blocks, 0);

        return {
          date: dayStart.getDate().toString(),
          blocks,
          profit: revenue - cost
        };
      });
    } else {
      // For today and yearly, return empty or simplified data
      return [];
    }
  }, [filteredSales, filteredExpenses, filteredFuelLogs, filteredProductionLogs, selectedPeriod]);

  // Payment data - use API values for accurate Cash vs Credit breakdown
  const paymentData = [
    { name: 'Cash', value: apiCashRevenue, fill: '#10B981', gradient: 'from-emerald-500 to-teal-600' }, 
    { name: 'Credit', value: apiCreditRevenue, fill: '#8B5CF6', gradient: 'from-purple-500 to-indigo-600' }, 
  ];

  const cashPercentage = Math.round(apiCashPercentage);

  // --- Recent Activity (using filtered data) ---
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // All activities (for modal)
  const allActivities = useMemo(() => {
    const activities = [
      ...filteredSales.map(s => ({ 
        id: s.id,
        type: 'SALE' as const, 
        label: 'Ice Block Sale', 
        sub: `${s.quantity_blocks} Blocks`, 
        amount: s.total_amount, 
        color: 'bg-emerald-100 text-emerald-600',
        icon: ShoppingBag,
        time: formatTimeAgo(s.created_at),
        timestamp: new Date(s.created_at).getTime(),
        date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })),
      ...filteredExpenses.map(e => {
        const expenseDate = e.expense_date || e.created_at;
        return {
          id: e.id,
          type: 'EXPENSE' as const, 
          label: e.category, 
          sub: e.description, 
          amount: e.amount, 
          color: 'bg-rose-100 text-rose-600',
          icon: Wallet,
          time: formatTimeAgo(expenseDate),
          timestamp: new Date(expenseDate).getTime(),
          date: new Date(expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }),
      ...filteredFixedCosts.map(fc => {
        const costDate = (fc as any).cost_date || fc.created_at;
        return {
          id: fc.id,
          type: 'FIXED_COST' as const,
          label: `Fixed Cost: ${fc.category}`,
          sub: fc.description,
          amount: fc.amount,
          color: 'bg-amber-100 text-amber-700',
          icon: Wallet,
          time: formatTimeAgo(costDate),
          timestamp: new Date(costDate).getTime(),
          date: new Date(costDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        };
      }),
      ...filteredFuelLogs.map(f => {
        const fuelDate = f.fuel_date || f.created_at;
        return {
          id: f.id,
          type: 'FUEL' as const, 
          label: 'Generator Refuel', 
          sub: `${f.liters_added} Liters`, 
          amount: f.total_cost, 
          color: 'bg-amber-100 text-amber-600',
          icon: Droplets,
          time: formatTimeAgo(fuelDate),
          timestamp: new Date(fuelDate).getTime(),
          date: new Date(fuelDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      }),
      ...filteredProductionLogs.map(p => {
        const productionDate = p.production_date || p.created_at;
        return {
          id: p.id,
          type: 'PRODUCTION' as const, 
          label: 'Production Entry', 
          sub: `${p.quantity_produced} Blocks - ${p.shift} Shift`, 
          amount: 0, 
          color: 'bg-blue-100 text-blue-600',
          icon: Zap,
          time: formatTimeAgo(productionDate),
          timestamp: new Date(productionDate).getTime(),
          date: new Date(productionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      })
    ];
    
    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredSales, filteredExpenses, filteredFixedCosts, filteredFuelLogs, filteredProductionLogs]);

  // Recent activity (limited to 5)
  const recentActivity = useMemo(() => {
    return allActivities.slice(0, 5);
  }, [allActivities]);

  // Get period label for display
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Today';
      case 'weekly': return 'Last 7 Days';
      case 'monthly': return 'Last 30 Days';
      case 'yearly': return 'This Year';
    }
  };

  // Get comparison period label
  const getComparisonLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'yesterday';
      case 'weekly': return 'previous week';
      case 'monthly': return 'previous month';
      case 'yearly': return 'previous year';
    }
  };

  // Calculate actual total revenue using API or fallback
  const displayTotalRevenue = intelligenceMetrics?.total_revenue ?? totalRevenue;
  const displayTotalBurn = intelligenceMetrics?.total_burn ?? (totalExpenses + totalFuelCost);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Real-time factory overview.</p>
        </div>
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full lg:w-auto">
          <button 
            onClick={() => setSelectedPeriod('today')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedPeriod === 'today' 
                ? 'text-slate-900 bg-slate-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Today
          </button>
          <button 
            onClick={() => setSelectedPeriod('weekly')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedPeriod === 'weekly' 
                ? 'text-slate-900 bg-slate-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setSelectedPeriod('monthly')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedPeriod === 'monthly' 
                ? 'text-slate-900 bg-slate-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setSelectedPeriod('yearly')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              selectedPeriod === 'yearly' 
                ? 'text-slate-900 bg-slate-100 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* --- METRIC CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6">
        
        {/* LIQUIDITY */}
        <div className="nexus-card p-5 lg:p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-teal-50/20 to-white"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-300/20 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <CustomTooltip content="This is the actual cash money you have available right now. It's calculated by taking all the cash sales you made, then subtracting all your expenses (like fuel costs, salaries, maintenance, and other bills). A positive number means you have cash in hand. A negative number means you've spent more than you've received in cash. This helps you know if you can pay bills or need to collect payments from customers.">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1">
                    Net Liquidity
                    <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 transition-colors" />
                  </span>
                </CustomTooltip>
              </div>
              <button className="text-slate-300 hover:text-emerald-600 transition-colors p-1 rounded-lg hover:bg-emerald-50">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <h3 className={`text-3xl font-black monospaced tracking-tight mb-2 ${liquidity >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(liquidity)}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                liquidity >= 0 
                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' 
                  : 'text-rose-700 bg-rose-50 border border-rose-100'
              }`}>
                {liquidity >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {liquidity >= 0 ? '+' : ''}{((liquidity / Math.max(Math.abs(displayTotalRevenue), 1)) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold">vs revenue</span>
            </div>
          </div>
        </div>

        {/* YIELD */}
        <div className="nexus-card p-5 lg:p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-white"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-300/20 transition-all duration-500"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-4 h-4" />
                </div>
                <CustomTooltip content="This shows your production efficiency as a percentage of maximum capacity. It compares your actual production to the factory's maximum daily capacity (1000 blocks). A higher percentage means you're operating closer to full capacity, which is more efficient. The target is 75% or higher for optimal operations.">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1">
                    Yield Efficiency
                    <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 transition-colors" />
                  </span>
                </CustomTooltip>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <h3 className="text-3xl font-black text-slate-900 monospaced tracking-tight">{displayProductionCount}</h3>
              <span className="text-xs text-slate-400 font-bold">blocks</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-bold">Target: 75%</span>
                <span className={`text-[10px] font-bold ${
                  isAboveTarget ? 'text-emerald-600' : 
                  isOnTarget ? 'text-blue-600' : 
                  'text-amber-600'
                }`}>
                  {yieldPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                {/* Target indicator line */}
                <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-slate-300 z-10"></div>
                {/* Progress bar */}
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden shadow-sm ${
                    isAboveTarget 
                      ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500' 
                      : isOnTarget
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, yieldPercentage)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isAboveTarget 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                    : isOnTarget
                    ? 'text-blue-700 bg-blue-50 border border-blue-200'
                    : 'text-amber-700 bg-amber-50 border border-amber-200'
                }`}>
                  {isAboveTarget ? 'Above Target' : isOnTarget ? 'On Target' : 'Below Target'}
                </span>
                {yieldPercentage < 75 && (
                  <span className="text-[9px] text-slate-400 font-bold">
                    {Math.round((0.75 * 1000) - (yieldPercentage / 100 * 1000))} blocks to target
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* EFFICIENCY */}
        <div className="nexus-card p-5 lg:p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-white"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-300/20 transition-all duration-500"></div>
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 text-amber-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-4 h-4" />
                </div>
                <CustomTooltip content="This tells you how much money it costs to produce one ice block. It's calculated by dividing your total production costs (fuel expenses plus all other expenses) by the number of blocks produced. Lower numbers are better - it means you're producing ice blocks cheaply. Higher numbers mean it's costing you more to make each block, which reduces your profit. The target is 45 SSP per block.">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center gap-1">
                    Cost Efficiency
                    <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 transition-colors" />
                  </span>
                </CustomTooltip>
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <h3 className="text-3xl font-black text-slate-900 monospaced tracking-tight">
                {finalCostPerUnit > 0 ? Math.round(finalCostPerUnit) : 0}
              </h3>
              <span className="text-sm text-slate-400 font-bold">SSP</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 font-bold">Cost per unit produced</p>
              <div className="flex items-center gap-2">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  finalCostPerUnit <= 45 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                    : finalCostPerUnit <= 60
                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                    : 'text-rose-700 bg-rose-50 border border-rose-200'
                }`}>
                  {finalCostPerUnit <= 45 ? 'Optimal' : finalCostPerUnit <= 60 ? 'Acceptable' : 'High Cost'}
                </div>
                {finalCostPerUnit > 45 && (
                  <span className="text-[9px] text-slate-400 font-bold">
                    Target: 45 SSP
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT ROW --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
        
        {/* REVENUE CHART */}
        <div className="nexus-card p-6 lg:p-8 xl:col-span-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-1.5 h-8 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full shadow-lg shadow-teal-500/30"></div>
                  <div className="absolute inset-0 w-1.5 h-8 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full animate-pulse opacity-50"></div>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight">
                    {selectedPeriod === 'today' ? 'Today\'s Revenue' :
                     selectedPeriod === 'weekly' ? 'Weekly Revenue' :
                     selectedPeriod === 'monthly' ? 'Monthly Revenue' :
                     'Yearly Revenue'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {selectedPeriod === 'today' ? 'Hourly Breakdown' :
                     selectedPeriod === 'weekly' ? 'Last 7 Days' :
                     selectedPeriod === 'monthly' ? 'This Month' :
                     'This Year'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {/* Show zero state with comparison context */}
                {displayTotalRevenue === 0 ? (
                  <div>
                    <p className="text-3xl font-black text-slate-400 monospaced tracking-tight">0 SSP</p>
                    {comparisonRevenue > 0 && (
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        No sales recorded {getPeriodLabel().toLowerCase()} (vs {formatCurrency(comparisonRevenue)} {getComparisonLabel()})
                      </p>
                    )}
                    {comparisonRevenue === 0 && (
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        No sales recorded {getPeriodLabel().toLowerCase()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-black text-slate-900 monospaced tracking-tight">{formatCurrency(displayTotalRevenue)}</p>
                    <div className="flex items-center gap-1.5 mt-1 justify-end">
                      {revenueTrend !== 0 && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded ${
                          revenueTrend >= 0 
                            ? 'text-emerald-700 bg-emerald-50' 
                            : 'text-rose-700 bg-rose-50'
                        }`}>
                          {revenueTrend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-bold">
                        vs {getComparisonLabel()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-[280px] lg:h-[320px] xl:h-[360px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={revenueChartData} 
                  barSize={52}
                  margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
                  className="w-full"
                >
                  <defs>
                    <linearGradient id="barGradientInactive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.8}/>
                      <stop offset="50%" stopColor="#94a3b8" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#64748b" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#0d9488" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#0f766e" stopOpacity={0.9}/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="#e2e8f0" 
                    strokeWidth={1}
                    opacity={0.4}
                  />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={11} 
                    fontWeight={800} 
                    stroke="#64748b"
                    tickMargin={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={10} 
                    fontWeight={700} 
                    stroke="#94a3b8"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    width={50}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)', radius: 8 }} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-200/50 p-4 min-w-[140px]">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${payload[0].payload.isActive ? 'bg-teal-500' : 'bg-slate-400'}`}></div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{payload[0].payload.name}</p>
                            </div>
                            <p className="text-xl font-black text-slate-900 monospaced">{formatCurrency(payload[0].value as number)}</p>
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <p className="text-[9px] text-slate-400 font-bold">Daily Revenue</p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[12, 12, 0, 0]}
                    animationDuration={1200}
                    animationBegin={0}
                  >
                    {revenueChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isActive ? 'url(#barGradientActive)' : 'url(#barGradientInactive)'}
                        style={{ filter: entry.isActive ? 'url(#glow)' : 'none' }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PAYMENT DISTRIBUTION */}
        <div className="nexus-card p-6 lg:p-8 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h4 className="text-base font-black text-slate-900 tracking-tight mb-1">Payment Channels</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenue Split ({getPeriodLabel()})</p>
            </div>
            <div className="h-[220px] lg:h-[260px] xl:h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="cashGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#059669" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="creditGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="50%" stopColor="#7c3aed" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.9}/>
                    </linearGradient>
                    <filter id="pieGlow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie 
                    data={paymentData} 
                    innerRadius={70} 
                    outerRadius={95} 
                    paddingAngle={3} 
                    dataKey="value" 
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth={3}
                    cornerRadius={12}
                    animationDuration={1500}
                    animationBegin={200}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.name === 'Cash' ? 'url(#cashGradient)' : 'url(#creditGradient)'}
                        style={{ filter: 'url(#pieGlow)' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = displayTotalRevenue > 0 ? Math.round((data.value / displayTotalRevenue) * 100) : 0;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-200/50 p-4 min-w-[160px]">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full shadow-sm" 
                                style={{ backgroundColor: data.fill }}
                              ></div>
                              <p className="text-xs font-bold text-slate-900">{data.name}</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900 monospaced mb-1">{formatCurrency(data.value)}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${percentage}%`,
                                    background: data.name === 'Cash' 
                                      ? 'linear-gradient(90deg, #10b981, #059669)' 
                                      : 'linear-gradient(90deg, #8b5cf6, #7c3aed)'
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-black text-slate-600">{percentage}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-4xl font-black text-slate-900 monospaced tracking-tight">{cashPercentage}%</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cash</p>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-8 mt-8">
              {paymentData.map(item => {
                const percentage = displayTotalRevenue > 0 ? Math.round((item.value / displayTotalRevenue) * 100) : 0;
                return (
                  <div key={item.name} className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3.5 h-3.5 rounded-full shadow-md" 
                        style={{ backgroundColor: item.fill }}
                      ></div>
                      <span className="text-xs font-black text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-lg font-black text-slate-900 monospaced">{formatCurrency(item.value)}</span>
                    <span className="text-[10px] text-slate-400 font-bold">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- FEED --- */}
      <div className="nexus-card p-0 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
               <Clock className="w-4 h-4" />
             </div>
             <div>
               <h4 className="text-sm font-bold text-slate-900">Master Ledger Log</h4>
               <p className="text-[10px] text-slate-400 font-medium">{allActivities.length} transactions in period</p>
             </div>
           </div>
           <button 
             onClick={() => setShowAllHistory(true)}
             className="text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
           >
             <Clock className="w-3 h-3" />
             View All History
           </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Transaction Type</th>
                <th className="py-4 px-6 hidden sm:table-cell">Description</th>
                <th className="py-4 px-6 hidden sm:table-cell">Time</th>
                <th className="py-4 px-6 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.map((item, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/80 transition-all cursor-default">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${item.color}`}>
                         <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{item.label}</p>
                         <p className="text-[11px] text-slate-400 font-bold sm:hidden">{item.sub}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 lg:py-4 px-4 lg:px-6 hidden sm:table-cell">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{item.sub}</span>
                  </td>
                   <td className="py-3 lg:py-4 px-4 lg:px-6 hidden lg:table-cell">
                    <span className="text-xs font-bold text-slate-400">{item.time}</span>
                  </td>
                  <td className="py-3 lg:py-4 px-4 lg:px-6 text-right">
                     {item.type === 'PRODUCTION' ? (
                       <span className="text-xs font-bold text-slate-400 uppercase">N/A</span>
                     ) : (
                       <span className={`text-sm font-black monospaced ${item.type === 'SALE' ? 'text-emerald-600' : 'text-slate-900'}`}>
                         {item.type === 'SALE' ? '+' : '-'}{formatCurrency(item.amount)}
                       </span>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {showAllHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-xl font-black text-white tracking-tight">Transaction History</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {allActivities.length} transactions - {getPeriodLabel()}
                </p>
              </div>
              <button 
                onClick={() => setShowAllHistory(false)}
                className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center relative z-10 border border-white/20 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b border-slate-200">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600 monospaced">
                  +{formatCurrency(allActivities.filter(a => a.type === 'SALE').reduce((sum, a) => sum + a.amount, 0))}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-rose-600 monospaced">
                  -{formatCurrency(allActivities.filter(a => a.type !== 'SALE' && a.type !== 'PRODUCTION').reduce((sum, a) => sum + a.amount, 0))}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Expenses</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-black monospaced ${
                  allActivities.filter(a => a.type === 'SALE').reduce((sum, a) => sum + a.amount, 0) - 
                  allActivities.filter(a => a.type !== 'SALE' && a.type !== 'PRODUCTION').reduce((sum, a) => sum + a.amount, 0) >= 0 
                    ? 'text-slate-900' : 'text-rose-600'
                }`}>
                  {formatCurrency(
                    allActivities.filter(a => a.type === 'SALE').reduce((sum, a) => sum + a.amount, 0) - 
                    allActivities.filter(a => a.type !== 'SALE' && a.type !== 'PRODUCTION').reduce((sum, a) => sum + a.amount, 0)
                  )}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Flow</p>
              </div>
            </div>

            {/* Transactions List */}
            <div className="overflow-y-auto max-h-[50vh]">
              {allActivities.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                      <th className="py-4 px-6">Transaction</th>
                      <th className="py-4 px-6 hidden sm:table-cell">Details</th>
                      <th className="py-4 px-6 hidden md:table-cell">Date</th>
                      <th className="py-4 px-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allActivities.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/80 transition-all">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${item.color}`}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{item.label}</p>
                              <p className="text-[10px] text-slate-400 font-bold sm:hidden">{item.sub}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{item.sub}</span>
                        </td>
                        <td className="py-4 px-6 hidden md:table-cell">
                          <div>
                            <span className="text-xs font-bold text-slate-600">{item.date}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">{item.time}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {item.type === 'PRODUCTION' ? (
                            <span className="text-xs font-bold text-slate-400 uppercase">N/A</span>
                          ) : (
                            <span className={`text-sm font-black monospaced ${item.type === 'SALE' ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {item.type === 'SALE' ? '+' : '-'}{formatCurrency(item.amount)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Clock className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm font-bold">No transactions in this period</p>
                  <p className="text-xs mt-1">Try selecting a different time range</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <p className="text-xs text-slate-400 font-medium">
                Showing {allActivities.length} transactions
              </p>
              <button 
                onClick={() => setShowAllHistory(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
