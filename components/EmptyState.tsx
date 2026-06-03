import React from 'react';
import Icon from './Icon';

interface EmptyStateProps {
  title: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  onAction, 
  actionLabel,
  icon = "search"
}) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-3xl border border-slate-100">
    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-6 shadow-inner">
      <Icon name={icon as any} size={40} />
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 mb-6 max-w-md">{message}</p>
    {onAction && actionLabel && (
      <button 
        onClick={onAction}
        className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
