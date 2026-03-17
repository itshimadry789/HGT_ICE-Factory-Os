
import React from 'react';
import { ShoppingCart, Fuel, Receipt } from 'lucide-react';

interface QuickActionsProps {
  onNewSale?: () => void;
  onLogFuel?: () => void;
  onAddExpense?: () => void;
}

export default function QuickActions({ onNewSale, onLogFuel, onAddExpense }: QuickActionsProps) {
  const actions = [
    {
      icon: ShoppingCart,
      label: 'New Sale',
      emoji: '🧊',
      onClick: onNewSale,
      color: 'blue'
    },
    {
      icon: Fuel,
      label: 'Log Fuel',
      emoji: '⛽',
      onClick: onLogFuel,
      color: 'orange'
    },
    {
      icon: Receipt,
      label: 'Add Expense',
      emoji: '💸',
      onClick: onAddExpense,
      color: 'red'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    red: 'bg-red-600 hover:bg-red-700'
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`${colorClasses[action.color as keyof typeof colorClasses]} text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors hover:scale-105 transition-transform`}
          >
            <Icon className="w-5 h-5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

