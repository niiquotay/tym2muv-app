
import React from 'react';
import Icon from './Icon';

interface SafetyDisclaimerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-slate-900/5">
        
        {/* Header */}
        <div className="bg-orange-50 p-6 border-b border-orange-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Icon name="shield" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-800">Safety Warning</h3>
                <p className="text-orange-600 text-xs font-bold uppercase tracking-wider">Read before proceeding</p>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <Icon name="alert" size={16} className="text-red-500" /> 
                    Avoid Scams
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                    Be cautious of agents asking for rent advance or security deposits before you have physically inspected the property and verified the landlord's identity.
                </p>
            </div>

            <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                    <div className="mt-0.5 min-w-[6px] h-[6px] rounded-full bg-slate-400"></div>
                    <span><strong>Verify Ownership:</strong> Always confirm the property's ownership and the agent's authorization before making any payments.</span>
                </li>
                <li className="flex items-start gap-3">
                    <div className="mt-0.5 min-w-[6px] h-[6px] rounded-full bg-slate-400"></div>
                    <span><strong>Inspect Physically:</strong> Never pay for a property you haven't visited in person. Scammers often use fake photos.</span>
                </li>
            </ul>

            <div className="pt-4 flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
                >
                    I Understand
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyDisclaimer;
