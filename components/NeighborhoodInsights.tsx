
import React from 'react';
import Icon from './Icon';

interface NeighborhoodInsightsProps {
  location: string;
}

const NeighborhoodInsights: React.FC<NeighborhoodInsightsProps> = ({ location }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden relative group">
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-100 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
          <Icon name="activity" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Neighborhood Insights</h3>
          <p className="text-xs text-slate-500">Local area analysis</p>
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-sm text-slate-600 leading-relaxed italic">
          "{location} is a vibrant and growing neighborhood known for its excellent community spirit and accessibility. Recent developments have significantly increased the area's appeal for both residents and investors, offering a balanced lifestyle with modern amenities and green spaces."
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-600 uppercase tracking-wider">
          <Icon name="check" size={12} className="text-brand-500" />
          Verified Data
        </div>
        <div className="text-[10px] text-slate-400">Updated weekly</div>
      </div>
    </div>
  );
};

export default NeighborhoodInsights;
