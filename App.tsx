
import React, { useState } from 'react';
import { ViewState, Sale, FuelLog, Expense, ProductionLog } from './types';
import { MOCK_CUSTOMERS, MOCK_SALES, MOCK_EXPENSES, MOCK_FUEL_LOGS, MOCK_PRODUCTION_LOGS } from './data';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SalesForm from './components/SalesForm';
import FuelForm from './components/FuelForm';
import ExpenseForm from './components/ExpenseForm';
import ProductionForm from './components/ProductionForm';
import Reports from './components/Reports';
import CustomerLedger from './components/CustomerLedger';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(MOCK_FUEL_LOGS);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(MOCK_PRODUCTION_LOGS);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);

  const handleAddSale = (saleData: any) => {
    const newSale: Sale = {
      ...saleData,
      id: `s${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setSales(prev => [...prev, newSale]);
    
    if (saleData.payment_status === 'CREDIT') {
      setCustomers(prev => prev.map(c => 
        c.id === saleData.customer_id 
          ? { ...c, total_credit_due: c.total_credit_due + saleData.total_amount } 
          : c
      ));
    }
    
    setCurrentView('DASHBOARD');
  };

  const handleAddFuel = (fuelData: any) => {
    const newFuelLog: FuelLog = {
      ...fuelData,
      id: `f${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setFuelLogs(prev => [...prev, newFuelLog]);
    setCurrentView('DASHBOARD');
  };

  const handleAddExpense = (expenseData: any) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `e${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setExpenses(prev => [...prev, newExpense]);
    setCurrentView('DASHBOARD');
  };

  const handleAddProduction = (productionData: any) => {
    const newProduction: ProductionLog = {
      ...productionData,
      id: `p${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setProductionLogs(prev => [...prev, newProduction]);
    setCurrentView('DASHBOARD');
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard sales={sales} expenses={expenses} fuelLogs={fuelLogs} customers={customers} />;
      case 'NEW_SALE':
        return <SalesForm customers={customers} onSave={handleAddSale} />;
      case 'LOG_FUEL':
        return <FuelForm onSave={handleAddFuel} />;
      case 'ADD_EXPENSE':
        return <ExpenseForm onSave={handleAddExpense} />;
      case 'PRODUCTION_LOG':
        return <ProductionForm onSave={handleAddProduction} />;
      case 'REPORTS':
        return <Reports sales={sales} expenses={expenses} fuelLogs={fuelLogs} customers={customers} />;
      case 'CUSTOMERS':
        return <CustomerLedger customers={customers} />;
      default:
        return <Dashboard sales={sales} expenses={expenses} fuelLogs={fuelLogs} customers={customers} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
