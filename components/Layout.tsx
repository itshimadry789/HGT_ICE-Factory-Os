
import React, { useState } from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, PlusCircle, Fuel, Receipt, ArrowLeft, BarChart3, 
  Settings, ShieldCheck, UserCircle, MessageSquare, 
  FileText, Zap, Shield, HelpCircle, Bell, Search, Menu, Calculator, Droplets, X, ChevronRight, Snowflake
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isFormView = currentView !== 'DASHBOARD' && currentView !== 'REPORTS' && currentView !== 'CUSTOMERS';

  const handleSetView = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ id, label, icon: Icon, onClick }: { id?: ViewState, label: string, icon: any, onClick?: () => void }) => (
    <button
      onClick={() => {
        if (onClick) onClick();
        else if (id) handleSetView(id);
      }}
      className={`w-full flex items-center gap-3 px-6 py-3 transition-all font-medium text-sm active-tap ${
        currentView === id 
          ? 'sidebar-active' 
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      <Icon className={`w-4 h-4 ${currentView === id ? 'text-sky-600' : 'text-slate-400'}`} />
      <span>{label}</span>
      {currentView === id && <ChevronRight className="w-3 h-3 ml-auto text-sky-600" />}
    </button>
  );

  // --- CUSTOM LOGO COMPONENT ---
  const HanaanoLogo = () => (
    <div className="flex items-center gap-3 select-none">
      {/* Visual HGT Mark Simulation */}
      <div className="relative w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-teal-500/10 to-blue-600/10"></div>
         <span className="text-base font-black bg-clip-text text-transparent bg-gradient-to-br from-amber-500 via-teal-500 to-blue-700 tracking-tighter transform -skew-x-6">
           HGT
         </span>
      </div>
      
      {/* Brand Name Only - Clean */}
      <h1 className="text-2xl font-black tracking-tight text-[#0055ff] font-sans leading-none">
        HANAANO
      </h1>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      {/* --- MOBILE MENU OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
           <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <HanaanoLogo />
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <p className="sidebar-label">COMMAND</p>
                <nav className="space-y-1">
                  <NavItem id="DASHBOARD" label="Overview" icon={LayoutDashboard} />
                  <NavItem id="NEW_SALE" label="Sales Terminal" icon={Calculator} />
                  <NavItem id="REPORTS" label="Intelligence" icon={BarChart3} />
                </nav>

                <p className="sidebar-label">OPERATIONS</p>
                <nav className="space-y-1">
                  <NavItem id="PRODUCTION_LOG" label="Production Log" icon={Snowflake} />
                  <NavItem id="LOG_FUEL" label="Generator Log" icon={Droplets} />
                  <NavItem id="ADD_EXPENSE" label="Expense Registry" icon={Receipt} />
                  <NavItem id="CUSTOMERS" label="Customer Ledger" icon={UserCircle} />
                </nav>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center">
                        <span className="text-xs text-white font-bold">MO</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-900">Mustafa Osman</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Lead Architect</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex-col z-50">
        <div className="p-8 pb-4">
          <div className="cursor-pointer" onClick={() => handleSetView('DASHBOARD')}>
            <HanaanoLogo />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-4">
          <p className="sidebar-label">COMMAND</p>
          <nav>
            <NavItem id="DASHBOARD" label="Overview" icon={LayoutDashboard} />
            <NavItem id="NEW_SALE" label="Sales Terminal" icon={Calculator} />
            <NavItem id="REPORTS" label="Intelligence" icon={BarChart3} />
          </nav>

          <p className="sidebar-label">OPERATIONS</p>
          <nav>
            <NavItem id="PRODUCTION_LOG" label="Production Log" icon={Snowflake} />
            <NavItem id="LOG_FUEL" label="Generator Log" icon={Droplets} />
            <NavItem id="ADD_EXPENSE" label="Expense Registry" icon={Receipt} />
            <NavItem id="CUSTOMERS" label="Customer Ledger" icon={UserCircle} />
          </nav>
        </div>

        <div className="p-6 mt-auto border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-3 border border-slate-100">
             <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600">
                <ShieldCheck className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">System Status</p>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                </p>
             </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#f8fafc] pb-20 md:pb-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 md:px-10 py-4 flex justify-between items-center bg-opacity-90 backdrop-blur-sm">
          <div className="flex items-center gap-8 flex-1">
            {isFormView ? (
              <button 
                onClick={() => handleSetView('DASHBOARD')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
              >
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="hidden md:inline font-bold text-sm">Back to Command</span>
              </button>
            ) : (
              <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search ledger, clients, or assets..." 
                  className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            )}
            <div className="md:hidden flex items-center gap-2">
               {/* Mobile Logo Condensed */}
               <HanaanoLogo />
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">Mustafa Osman</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Lead Architect</p>
               </div>
               <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-900 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                  <span className="text-xs text-white font-bold">MO</span>
               </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-10 w-full mx-auto max-w-7xl">
          {children}
        </main>
      </div>

      {/* --- MOBILE NAV BOTTOM --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-end z-50 pb-safe shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => handleSetView('DASHBOARD')} 
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[60px] ${currentView === 'DASHBOARD' ? 'text-sky-600' : 'text-slate-400'}`}
        >
          <LayoutDashboard className={`w-6 h-6 ${currentView === 'DASHBOARD' ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Home</span>
        </button>

        <button 
          onClick={() => handleSetView('REPORTS')} 
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[60px] ${currentView === 'REPORTS' ? 'text-sky-600' : 'text-slate-400'}`}
        >
          <BarChart3 className={`w-6 h-6 ${currentView === 'REPORTS' ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Reports</span>
        </button>
        
        {/* Floating Action Button for Sales */}
        <button 
          onClick={() => handleSetView('NEW_SALE')} 
          className="relative -top-6 bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-xl shadow-sky-900/30 active:scale-95 transition-all border-4 border-slate-50 flex items-center justify-center group"
        >
          <Calculator className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>

        <button 
          onClick={() => handleSetView('CUSTOMERS')} 
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[60px] ${currentView === 'CUSTOMERS' ? 'text-sky-600' : 'text-slate-400'}`}
        >
          <UserCircle className={`w-6 h-6 ${currentView === 'CUSTOMERS' ? 'fill-current' : ''}`} />
          <span className="text-[9px] font-bold tracking-wide">Ledger</span>
        </button>

        <button 
          onClick={() => setIsMobileMenuOpen(true)} 
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[60px] text-slate-400 hover:text-slate-900`}
        >
          <Menu className="w-6 h-6" />
          <span className="text-[9px] font-bold tracking-wide">Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
