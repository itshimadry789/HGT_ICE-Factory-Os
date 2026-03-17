
import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface Alert {
  priority: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  read?: boolean;
}

interface NotificationBellProps {
  alerts?: Alert[];
}

export default function NotificationBell({ alerts = [] }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alerts.filter(a => !a.read).length;

  const priorityConfig = {
    high: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    medium: {
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    },
    low: {
      icon: Info,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 animate-scale-in max-h-[500px] overflow-y-auto z-50">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Notifications</h3>
            <p className="text-slate-400 text-sm">{unreadCount} unread alerts</p>
          </div>

          <div className="divide-y divide-slate-700">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No notifications
              </div>
            ) : (
              alerts.map((alert, index) => {
                const config = priorityConfig[alert.priority];
                const Icon = config.icon;

                return (
                  <div key={index} className={`p-4 hover:bg-slate-700/50 transition-colors ${config.bgColor}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1">
                        <p className="text-white text-sm">{alert.message}</p>
                        <p className="text-slate-400 text-xs mt-1">{alert.timestamp}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {alerts.length > 0 && (
            <div className="p-3 border-t border-slate-700">
              <button className="text-blue-400 text-sm font-semibold hover:underline">
                View All Notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

