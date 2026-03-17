
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Sale, FuelLog, Expense, ProductionLog, FixedCost } from './types';
import { MOCK_CUSTOMERS, MOCK_SALES, MOCK_EXPENSES, MOCK_FUEL_LOGS, MOCK_PRODUCTION_LOGS } from './data';

// Import API client and auth helpers
import apiClient from './lib/api-client';
import { isAuthenticated } from './lib/auth';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SalesForm from './components/SalesForm';
import FuelForm from './components/FuelForm';
import ExpenseForm from './components/ExpenseForm';
import FixedCostForm from './components/FixedCostForm';
import ProductionForm from './components/ProductionForm';
import Reports from './components/Reports';
import CustomerLedger from './components/CustomerLedger';
import AlertBanner from './components/shared/AlertBanner';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(MOCK_FUEL_LOGS);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(MOCK_PRODUCTION_LOGS);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const isLoadingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const storedTheme = window.localStorage.getItem('hgt-theme');
    const prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const enabled = storedTheme === 'dark' || (!storedTheme && prefersDark);
    setIsDarkMode(enabled);
    document.body.classList.toggle('dark', enabled);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      document.body.classList.toggle('dark', next);
      window.localStorage.setItem('hgt-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Check if backend API is available with retry logic
  const testBackendConnection = async (maxRetries = 3, retryDelay = 2000): Promise<{ connected: boolean; error?: string }> => {
    let lastError = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Backend connection attempt ${attempt}/${maxRetries}...`);
        const healthResponse = await apiClient.auth.health();
        console.log('Health check response:', healthResponse);
        
        // Health endpoint returns { success: true, message: '...', timestamp: '...' }
        // Check for success property explicitly (handle both true and truthy values)
        const responseSuccess = healthResponse && (
          (healthResponse as any).success === true || 
          (healthResponse as any).success === 'true' ||
          (typeof (healthResponse as any).success !== 'undefined' && (healthResponse as any).success)
        );
        
        if (responseSuccess) {
          console.log('Backend connection successful!');
          return { connected: true };
        }
        lastError = `Health check returned unexpected response: ${JSON.stringify(healthResponse)}`;
      } catch (err: any) {
        lastError = err.message || 'Unable to connect to backend API';
        console.warn(`Backend connection attempt ${attempt} failed:`, lastError);
        
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    console.error('All backend connection attempts failed');
    return { 
      connected: false, 
      error: `${lastError}. Please ensure the backend server is running (npm run dev starts both servers).` 
    };
  };

  // Check authentication status and listen for auth changes
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setShowAuth(!authenticated);
      setIsAuthChecked(true);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        console.log('[AUTH] User signed in, re-initializing...');
        setShowAuth(false);
        setError(null);
        // Clear any existing loading state before re-initializing
        isLoadingRef.current = false;
        setLoading(false);
        hasInitializedRef.current = false; // Reset initialization flag
        // Re-initialize app with authenticated user (only if not already loading)
        // Small delay to ensure state updates are processed
        setTimeout(async () => {
          if (!isLoadingRef.current) {
            const connectionResult = await testBackendConnection();
            if (connectionResult.connected) {
              setUseBackend(true);
              await loadAllData();
            }
          }
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH] User signed out');
        setShowAuth(true);
        setUseBackend(false);
        // Clear all loading states on logout
        isLoadingRef.current = false;
        setLoading(false);
        hasInitializedRef.current = false; // Reset initialization flag
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load initial data from backend API or use mock data
  useEffect(() => {
    let isMounted = true;
    let loadingTimeoutId: NodeJS.Timeout | null = null;
    
    const initializeApp = async () => {
      // Prevent multiple initializations
      if (hasInitializedRef.current) {
        console.log('[initializeApp] Already initialized, skipping...');
        return;
      }
      
      if (showAuth) {
        console.log('[initializeApp] Showing auth screen, skipping initialization');
        return; // Don't initialize if showing auth screen
      }
      
      console.log('[initializeApp] Starting initialization...');
      hasInitializedRef.current = true;
      setHasInitialized(true);
      setConnecting(true);
      
      // Safety timeout: if loading takes more than 45 seconds, force clear
      loadingTimeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('[initializeApp] Loading timeout - forcing state clear');
          isLoadingRef.current = false;
          setLoading(false);
          setConnecting(false);
          setError('Loading took too long. Please refresh the page.');
        }
      }, 45000);
      
      try {
        // Test backend connection first (health endpoint doesn't require auth)
        const connectionResult = await testBackendConnection();
        setConnecting(false);
        
        if (!isMounted) {
          hasInitializedRef.current = false;
          return;
        }
        
        if (connectionResult.connected) {
          console.log('[initializeApp] Backend API connection successful!');
          
          // Clear any previous connection errors since we're now connected
          if (isMounted) {
            setError(null);
            setUseBackend(true);
          }
          
          // Check authentication
          const authenticated = await isAuthenticated();
          if (!isMounted) {
            hasInitializedRef.current = false;
            return;
          }
          
          if (!authenticated) {
            console.warn('[initializeApp] User not authenticated. Showing login screen.');
            setShowAuth(true);
            hasInitializedRef.current = false; // Reset so it can initialize after login
            return;
          }
          
          // useBackend is already set to true above
          await loadAllData();
        } else {
          console.warn('[initializeApp] Backend API connection failed:', connectionResult.error);
          if (isMounted) {
            // Only set error and useBackend to false if we've completed initialization
            // This prevents showing errors during the initial connection attempt
            setError(`Backend API connection failed: ${connectionResult.error}`);
            setUseBackend(false);
            // Ensure loading state is cleared
            isLoadingRef.current = false;
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error('[initializeApp] Error during initialization:', err);
        if (isMounted) {
          setError(`Initialization error: ${err.message || 'Unknown error'}`);
          isLoadingRef.current = false;
          setLoading(false);
          setConnecting(false);
        }
      } finally {
        // Clear timeout if initialization completes
        if (loadingTimeoutId) {
          clearTimeout(loadingTimeoutId);
        }
      }
    };
    
    if (isAuthChecked && !showAuth && !hasInitializedRef.current) {
      initializeApp();
    }
    
    return () => {
      isMounted = false;
      // Cleanup: ensure loading states are cleared on unmount
      if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
      }
      isLoadingRef.current = false;
      setLoading(false);
      setConnecting(false);
    };
  }, [isAuthChecked, showAuth]);

  const loadAllData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('[loadAllData] Already in progress, skipping...');
      return;
    }
    
    console.log('[loadAllData] Starting data load...');
    
    // Set loading state immediately
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    // Safety timeout: force clear loading state after 35 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn('[loadAllData] Safety timeout triggered - forcing state clear');
      isLoadingRef.current = false;
      setLoading(false);
      setError('Data loading took too long. Some data may not have loaded. Please refresh the page.');
    }, 35000);
    
    try {
      // Create a timeout wrapper function
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      // Load all data with individual timeouts (10 seconds each)
      const loadWithTimeout = async <T,>(apiCall: () => Promise<T>, name: string): Promise<T | []> => {
        try {
          return await withTimeout(apiCall(), 10000);
        } catch (err: any) {
          console.warn(`[loadAllData] Failed to load ${name}:`, err.message || err);
          return [];
        }
      };

      // Load all data in parallel with proper timeout handling
      const [customersData, salesData, expensesData, fixedCostsData, fuelData, productionData] = await Promise.all([
        loadWithTimeout(() => apiClient.customers.getAll({ limit: 100 }), 'customers'),
        loadWithTimeout(() => apiClient.sales.getAll({ limit: 100 }), 'sales'),
        loadWithTimeout(() => apiClient.expenses.getAll({ limit: 100 }), 'expenses'),
        loadWithTimeout(() => apiClient.fixedCosts.getAll({ limit: 100 }), 'fixed costs'),
        loadWithTimeout(() => apiClient.fuel.getAll({ limit: 100 }), 'fuel logs'),
        loadWithTimeout(() => apiClient.production.getAll({ limit: 100 }), 'production logs')
      ]);

      // Process customers data
      if (Array.isArray(customersData) && customersData.length > 0) {
        // Remove duplicates by ID and name
        const uniqueCustomers = customersData.filter((customer, index, self) =>
          index === self.findIndex((c) => c.id === customer.id || c.name === customer.name)
        );
        setCustomers(uniqueCustomers);
        console.log(`[loadAllData] Loaded ${uniqueCustomers.length} unique customers from backend API`);
      } else {
        console.warn('[loadAllData] No customers found in backend. Database may be empty, but backend is connected.');
        // Don't set useBackend to false here - backend is still connected, just no data yet
        setCustomers(MOCK_CUSTOMERS);
      }
      
      // Process other data
      if (Array.isArray(salesData) && salesData.length > 0) {
        setSales(salesData);
        console.log(`[loadAllData] Loaded ${salesData.length} sales from backend API`);
      }
      if (Array.isArray(expensesData) && expensesData.length > 0) {
        setExpenses(expensesData);
        console.log(`[loadAllData] Loaded ${expensesData.length} expenses from backend API`);
      }
      if (Array.isArray(fixedCostsData) && fixedCostsData.length > 0) {
        setFixedCosts(fixedCostsData);
        console.log(`[loadAllData] Loaded ${fixedCostsData.length} fixed costs from backend API`);
      }
      if (Array.isArray(fuelData) && fuelData.length > 0) {
        setFuelLogs(fuelData);
        console.log(`[loadAllData] Loaded ${fuelData.length} fuel logs from backend API`);
      }
      if (Array.isArray(productionData) && productionData.length > 0) {
        setProductionLogs(productionData);
        console.log(`[loadAllData] Loaded ${productionData.length} production logs from backend API`);
      }
      
      console.log('[loadAllData] Data loading completed successfully');
    } catch (err: any) {
      console.error('[loadAllData] Error loading data:', err);
      // Don't show error banner for data loading issues - backend is still connected
      // Just log the error and use fallback data
      // Only set error if this is a critical failure (which shouldn't happen if backend is connected)
      if (err.message && err.message.includes('Network error')) {
        // Network error means backend might have disconnected
        setError(`Backend connection lost: ${err.message}`);
        setUseBackend(false);
      }
      // Fallback to mock data for customers only
      setCustomers(MOCK_CUSTOMERS);
    } finally {
      // CRITICAL: Always clear loading state, even if there's an error
      console.log('[loadAllData] Clearing loading state');
      clearTimeout(safetyTimeout);
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  // Check if a string is a valid UUID
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleAddSale = async (saleData: any) => {
    console.log('[handleAddSale] Called with:', saleData);
    console.log('[handleAddSale] Current loading state:', loading);
    console.log('[handleAddSale] isLoadingRef.current:', isLoadingRef.current);
    
    // CRITICAL: If loading is true, it means loadAllData() is running
    // We should NOT proceed with adding data if a full data load is in progress
    if (loading || isLoadingRef.current) {
      console.warn('[handleAddSale] Cannot add sale - data is currently loading. Please wait...');
      setError('Please wait for data to finish loading before adding new data.');
      return;
    }
    
    if (useBackend) {
      // Check if customer_id is a valid UUID
      if (!isValidUUID(saleData.customer_id)) {
        const errorMsg = `Invalid customer ID. The customer "${saleData.customer_id}" is from mock data. Please select a customer from your database.`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }

      try {
        console.log('Attempting to save to backend API...');
        const newSale = await apiClient.sales.create({
          customer_id: saleData.customer_id,
          quantity_blocks: saleData.quantity_blocks,
          unit_price: saleData.unit_price,
          payment_status: saleData.payment_status,
          amount_paid: saleData.payment_status === 'CASH' ? saleData.total_amount : (saleData.amount_paid || 0),
          notes: saleData.notes
        });

        if (newSale) {
          console.log('Sale saved successfully to backend API:', newSale);
          setSales(prev => [newSale, ...prev]);
          // Refresh customers to get updated balance (without triggering full reload)
          // Use a timeout to prevent hanging
          try {
            const customerRefreshPromise = apiClient.customers.getAll({ limit: 100 });
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Customer refresh timeout')), 5000)
            );
            
            const updatedCustomers = await Promise.race([
              customerRefreshPromise,
              timeoutPromise
            ]) as any[];
            
            if (updatedCustomers && updatedCustomers.length > 0) {
              setCustomers(updatedCustomers);
            }
          } catch (err) {
            console.warn('Failed to refresh customers, but sale was saved:', err);
            // Update customer balance locally if refresh fails
            if (saleData.payment_status === 'CREDIT') {
              setCustomers(prev => prev.map(c => 
                c.id === saleData.customer_id 
                  ? { ...c, total_credit_due: (c.total_credit_due || 0) + saleData.total_amount } 
                  : c
              ));
            }
          }
          // REMOVED: setCurrentView('DASHBOARD') - Let user stay on SalesForm to generate invoice
          setError(null);
          return;
        }
      } catch (err: any) {
        console.error('Error creating sale:', err);
        setError(`Failed to save sale: ${err.message || 'Unknown error'}. Please try again.`);
        return;
      }
    }
    
    // Fallback to local state (only if backend is not available)
    console.log('Saving locally (fallback mode)');
    const newSale: Sale = {
      ...saleData,
      id: `s${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setSales(prev => [newSale, ...prev]);
    
    if (saleData.payment_status === 'CREDIT') {
      setCustomers(prev => prev.map(c => 
        c.id === saleData.customer_id 
          ? { ...c, total_credit_due: c.total_credit_due + saleData.total_amount } 
          : c
      ));
    }
    
    // REMOVED: setCurrentView('DASHBOARD') - Let user stay on SalesForm to generate invoice
  };

  const handleAddFuel = async (fuelData: any) => {
    console.log('[handleAddFuel] Called with:', fuelData);
    
    // CRITICAL: If loading is true, it means loadAllData() is running
    if (loading || isLoadingRef.current) {
      console.warn('[handleAddFuel] Cannot add fuel - data is currently loading. Please wait...');
      setError('Please wait for data to finish loading before adding new data.');
      return;
    }
    
    if (useBackend) {
      try {
        const newFuelLog = await apiClient.fuel.create({
          liters_added: fuelData.liters_added,
          cost_per_liter: fuelData.cost_per_liter,
          total_cost: fuelData.total_cost,
          generator_hours_run: fuelData.generator_hours_run,
          boxes_produced: fuelData.boxes_produced || 0,
          fuel_date: new Date().toISOString().split('T')[0],
          notes: fuelData.notes
        });

        if (newFuelLog) {
          setFuelLogs(prev => [newFuelLog, ...prev]);
          setCurrentView('DASHBOARD');
          setError(null);
          return;
        }
      } catch (err: any) {
        console.error('Error creating fuel log:', err);
        setError(`Failed to save fuel log: ${err.message || 'Unknown error'}. Please try again.`);
        return;
      }
    }
    
    // Fallback to local state (only if backend is not available)
    const newFuelLog: FuelLog = {
      ...fuelData,
      id: `f${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setFuelLogs(prev => [newFuelLog, ...prev]);
    setCurrentView('DASHBOARD');
  };

  const handleAddExpense = async (expenseData: any) => {
    console.log('[handleAddExpense] Called with:', expenseData);
    
    // CRITICAL: If loading is true, it means loadAllData() is running
    if (loading || isLoadingRef.current) {
      console.warn('[handleAddExpense] Cannot add expense - data is currently loading. Please wait...');
      setError('Please wait for data to finish loading before adding new data.');
      return;
    }
    
    if (useBackend) {
      try {
        const newExpense = await apiClient.expenses.create({
          category: expenseData.category,
          description: expenseData.description,
          amount: expenseData.amount,
          currency: expenseData.currency || 'SSP',
          vendor: expenseData.vendor,
          expense_date: new Date().toISOString().split('T')[0],
          notes: expenseData.notes
        });

        if (newExpense) {
          setExpenses(prev => [newExpense, ...prev]);
          setCurrentView('DASHBOARD');
          setError(null);
          return;
        }
      } catch (err: any) {
        console.error('Error creating expense:', err);
        setError(`Failed to save expense: ${err.message || 'Unknown error'}. Please try again.`);
        return;
      }
    }
    
    // Fallback to local state (only if backend is not available)
    const newExpense: Expense = {
      ...expenseData,
      id: `e${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);
    setCurrentView('DASHBOARD');
  };

  const handleAddFixedCost = async (fixedCostData: any) => {
    console.log('[handleAddFixedCost] Called with:', fixedCostData);

    if (loading || isLoadingRef.current) {
      console.warn('[handleAddFixedCost] Cannot add fixed cost - data is currently loading. Please wait...');
      setError('Please wait for data to finish loading before adding new data.');
      return;
    }

    if (useBackend) {
      try {
        const newFixedCost = await apiClient.fixedCosts.create({
          category: fixedCostData.category,
          description: fixedCostData.description,
          amount: fixedCostData.amount,
          currency: fixedCostData.currency || 'SSP',
          vendor: fixedCostData.vendor,
          receipt_number: fixedCostData.receipt_number,
          cost_date: fixedCostData.cost_date,
          notes: fixedCostData.notes,
        });

        if (newFixedCost) {
          setFixedCosts((prev) => [newFixedCost, ...prev]);
          setCurrentView('DASHBOARD');
          setError(null);
          return;
        }
      } catch (err: any) {
        console.error('Error creating fixed cost:', err);
        setError(`Failed to save fixed cost: ${err.message || 'Unknown error'}. Please try again.`);
        return;
      }
    }

    // Fallback to local state (only if backend is not available)
    const newFixedCost: FixedCost = {
      ...fixedCostData,
      id: `fc${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setFixedCosts((prev) => [newFixedCost, ...prev]);
    setCurrentView('DASHBOARD');
  };

  const handleAddProduction = async (productionData: any) => {
    console.log('[handleAddProduction] Called with:', productionData);
    
    // CRITICAL: If loading is true, it means loadAllData() is running
    if (loading || isLoadingRef.current) {
      console.warn('[handleAddProduction] Cannot add production - data is currently loading. Please wait...');
      setError('Please wait for data to finish loading before adding new data.');
      return;
    }
    
    if (useBackend) {
      try {
        const newProduction = await apiClient.production.create({
          quantity_produced: productionData.quantity_produced,
          waste_blocks: productionData.waste || 0,
          shift: productionData.shift,
          runtime_hours: productionData.runtime_hours,
          machine_issues: productionData.machine_issues,
          notes: productionData.notes,
          production_date: new Date().toISOString().split('T')[0]
        });

        if (newProduction) {
          setProductionLogs(prev => [newProduction, ...prev]);
          setCurrentView('DASHBOARD');
          setError(null);
          return;
        }
      } catch (err: any) {
        console.error('Error creating production log:', err);
        setError(`Failed to save production log: ${err.message || 'Unknown error'}. Please try again.`);
        return;
      }
    }
    
    // Fallback to local state (only if backend is not available)
    const newProduction: ProductionLog = {
      ...productionData,
      id: `p${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setProductionLogs(prev => [newProduction, ...prev]);
    setCurrentView('DASHBOARD');
  };

  const refreshCustomers = async () => {
    if (!useBackend) return;
    try {
      const updatedCustomers = await apiClient.customers.getAll({ limit: 100 });
      if (Array.isArray(updatedCustomers)) setCustomers(updatedCustomers);
    } catch (err) {
      console.warn('Failed to refresh customers:', err);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard sales={sales} expenses={expenses} fixedCosts={fixedCosts} fuelLogs={fuelLogs} customers={customers} productionLogs={productionLogs} />;
      case 'NEW_SALE':
        return (
          <SalesForm
            customers={customers}
            onSave={handleAddSale}
            onCustomerCreated={async () => {
              await refreshCustomers();
            }}
          />
        );
      case 'LOG_FUEL':
        return <FuelForm onSave={handleAddFuel} />;
      case 'ADD_EXPENSE':
        return <ExpenseForm onSave={handleAddExpense} />;
      case 'FIXED_COSTS':
        return <FixedCostForm onSave={handleAddFixedCost} />;
      case 'PRODUCTION_LOG':
        return <ProductionForm onSave={handleAddProduction} />;
      case 'REPORTS':
        return <Reports sales={sales} expenses={expenses} fixedCosts={fixedCosts} fuelLogs={fuelLogs} customers={customers} productionLogs={productionLogs} />;
      case 'CUSTOMERS':
        return <CustomerLedger customers={customers} onRefreshCustomers={refreshCustomers} />;
      default:
        return <Dashboard sales={sales} expenses={expenses} fixedCosts={fixedCosts} fuelLogs={fuelLogs} customers={customers} productionLogs={productionLogs} />;
    }
  };

  // Show auth screen if not authenticated
  if (showAuth) {
    return <Auth onAuthSuccess={() => setShowAuth(false)} />;
  }

  return (
    <Layout
      currentView={currentView}
      setView={setCurrentView}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
    >
      {connecting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Connecting to backend server...</p>
            <p className="text-slate-400 text-sm mt-2">Waiting for API on port 3001</p>
          </div>
        </div>
      )}
      {loading && !connecting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading data from database...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="p-4">
          <AlertBanner
            type="warning"
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      )}
      {/* Only show "Using local data" banner if:
          1. Backend is not connected (useBackend is false)
          2. Not showing auth screen
          3. Not currently connecting
          4. No error is set (error banner will show instead)
          5. Auth check is complete
          6. Initialization is complete
          7. We've actually attempted to connect (hasInitialized is true) */}
      {/* Only show "Using local data" banner if backend is definitively not connected
          AND we've completed initialization AND there's no error (error banner shows instead) */}
      {!useBackend && !showAuth && !connecting && !error && isAuthChecked && hasInitialized && !loading && (
        <div className="p-4">
          <AlertBanner
            type="info"
            message="Using local data. Backend API not connected. Data will be saved locally only. Run 'npm run dev' from the project root to start both servers."
            onDismiss={() => {
              // Allow dismissing this banner - it's informational, not critical
            }}
          />
        </div>
      )}
      {renderView()}
    </Layout>
  );
};

export default App;
