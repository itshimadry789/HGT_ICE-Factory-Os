
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Info, X, ArrowRight } from 'lucide-react';

interface AlertBannerProps {
  type?: 'warning' | 'success' | 'info';
  message: string;
  action?: () => void;
  onDismiss?: () => void;
  actionLabel?: string;
}

export default function AlertBanner({ type = 'info', message, action, onDismiss, actionLabel }: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const config = {
    warning: {
      icon: AlertCircle,
      bgGradient: 'from-amber-50 via-yellow-50/50 to-orange-50/30',
      borderColor: 'border-amber-300/50',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      glow: 'shadow-amber-200/50'
    },
    success: {
      icon: CheckCircle,
      bgGradient: 'from-emerald-50 via-green-50/50 to-teal-50/30',
      borderColor: 'border-emerald-300/50',
      textColor: 'text-emerald-700',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      glow: 'shadow-emerald-200/50'
    },
    info: {
      icon: Info,
      bgGradient: 'from-blue-50 via-cyan-50/50 to-indigo-50/30',
      borderColor: 'border-blue-300/50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      glow: 'shadow-blue-200/50'
    }
  };

  const { icon: Icon, bgGradient, borderColor, textColor, iconColor, iconBg, glow } = config[type];

  return (
    <div className={`bg-gradient-to-br ${bgGradient} ${borderColor} border rounded-xl p-4 mb-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm ${glow} relative overflow-hidden`}>
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '16px 16px'
        }}></div>
      </div>
      
      <div className={`${iconBg} rounded-lg p-2.5 flex-shrink-0 relative z-10 shadow-sm`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      
      <div className="flex-1 relative z-10">
        <p className={`${textColor} text-sm font-semibold leading-relaxed`}>{message}</p>
        {action && (
          <button
            onClick={action}
            className={`${textColor} text-xs font-bold mt-3 inline-flex items-center gap-1.5 hover:gap-2 transition-all group`}
          >
            <span>{actionLabel || 'Learn More'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
      
      {onDismiss && (
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className={`${textColor} hover:opacity-70 transition-opacity p-1 rounded-lg hover:bg-white/50 flex-shrink-0 relative z-10`}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

