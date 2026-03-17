
import React from 'react';
import { CheckCircle, X, Download } from 'lucide-react';

interface Detail {
  label: string;
  value: string | number;
}

interface Action {
  label: string;
  onClick: () => void;
  icon?: 'download' | 'none';
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  details?: Detail[];
  primaryAction?: Action;
  secondaryAction?: Action;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  title, 
  details = [], 
  primaryAction,
  secondaryAction 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full border border-slate-700 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }} 
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">{detail.label}:</span>
                <span className="text-white font-semibold">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          {secondaryAction && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                secondaryAction.onClick();
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              {secondaryAction.label.toLowerCase().includes('invoice') && (
                <Download className="w-4 h-4" />
              )}
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                primaryAction.onClick();
              }}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

