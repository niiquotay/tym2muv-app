import React from 'react';
import Icon from './Icon';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col items-center justify-center text-center my-8 shadow-sm">
    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
      <Icon name="alertTriangle" size={24} />
    </div>
    <p className="font-bold mb-1 text-lg">Error</p>
    <p className="font-medium mb-6 opacity-90">{message}</p>
    <button 
      onClick={onRetry} 
      className="bg-red-600 border border-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
    >
      <Icon name="refreshCcw" size={16} />
      Try Again
    </button>
  </div>
);

export default ErrorBanner;
