import React from 'react';

const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-2xl p-4 space-y-3 shadow-sm border border-slate-100">
    <div className="h-48 bg-slate-200 rounded-xl w-full"></div>
    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
  </div>
);

export default SkeletonCard;
