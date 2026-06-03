import React, { useState } from 'react';
import Icon from './Icon';

const AgentMonetizationDash = () => {
  const [activePlan, setActivePlan] = useState<'free' | 'premium'>('free');
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold font-display mb-2 flex items-center gap-2">
              <Icon name="rocket" size={24} className="text-brand-400" />
              Boost Your Real Estate Business
            </h2>
            <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
              Unlock premium visibility, get exclusive lead metrics, and stand out with verified agent badges. Upgrade and manage your Agent Pro plan here.
            </p>
          </div>
          <div className="shrink-0 bg-white/10 backdrop-blur border border-white/20 p-4 rounded-2xl text-center min-w-[150px]">
            <p className="text-xs text-brand-300 font-bold uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-2xl font-bold font-display capitalize">{activePlan}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Subscriptions */}
        <div className="lg:col-span-3">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Icon name="creditCard" size={20} className="text-slate-400" /> Subscription Plans
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
             {/* Free Plan */}
             <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 relative">
                 <h4 className="text-xl font-bold text-slate-800 mb-2">Basic free</h4>
                 <p className="text-3xl font-bold text-slate-900 font-display mb-6">$0<span className="text-sm font-medium text-slate-400">/mo</span></p>
                 <ul className="space-y-3 mb-8">
                     <li className="flex items-start gap-2 text-sm text-slate-600"><Icon name="check" size={16} className="text-brand-500 mt-0.5 shrink-0" /> List up to 10 properties</li>
                     <li className="flex items-start gap-2 text-sm text-slate-600"><Icon name="check" size={16} className="text-brand-500 mt-0.5 shrink-0" /> Basic visibility in search</li>
                     <li className="flex items-start gap-2 text-sm text-slate-600"><Icon name="check" size={16} className="text-brand-500 mt-0.5 shrink-0" /> Direct chat with tenants</li>
                 </ul>
                 <button onClick={() => setActivePlan('free')} disabled={activePlan === 'free'} className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-500 disabled:opacity-50">
                    {activePlan === 'free' ? 'Current Plan' : 'Downgrade'}
                 </button>
             </div>
             {/* Pro Plan */}
             <div className="bg-gradient-to-b from-brand-50 to-white border-2 border-brand-500 rounded-3xl p-6 relative shadow-lg shadow-brand-500/10">
                 <div className="absolute top-0 right-6 translate-y-[-50%] bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                 <h4 className="text-xl font-bold text-brand-900 mb-2">Agent Pro <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded ml-2">Annual</span></h4>
                 <p className="text-3xl font-bold text-slate-900 font-display mb-6">$99<span className="text-sm font-medium text-slate-400">/year</span></p>
                 <ul className="space-y-3 mb-8">
                     <li className="flex items-start gap-2 text-sm text-slate-700"><Icon name="check" size={16} className="text-brand-500 mt-0.5 shrink-0" /> Unlimited property listings</li>
                     <li className="flex items-start gap-2 text-sm text-slate-700"><Icon name="check" size={16} className="text-brand-500 mt-0.5 shrink-0" /> <strong>Premium visibility</strong> for all listings</li>
                     <li className="flex items-start gap-2 text-sm text-slate-700"><Icon name="check" size={16} className="text-brand-500 mt-0.5 shrink-0" /> Verified <strong>Agent Badge</strong></li>
                     <li className="flex items-start gap-2 text-sm text-slate-700"><Icon name="check" size={16} className="text-brand-500 mt-0.5 shrink-0" /> Analytics subscription (views, clicks)</li>
                 </ul>
                 <button onClick={() => setActivePlan('premium')} disabled={activePlan === 'premium'} className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md ${activePlan === 'premium' ? 'bg-slate-300' : 'bg-brand-600 hover:bg-brand-700 hover:-translate-y-0.5'} transition-all`}>
                    {activePlan === 'premium' ? 'Current Plan' : 'Upgrade to Pro'}
                 </button>
             </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
           <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
             <Icon name="star" size={24} />
           </div>
           <h3 className="font-bold text-slate-900 mb-2">Sponsored Listings</h3>
           <p className="text-sm text-slate-500 mb-4 line-clamp-3">Boost individual listings to the top of search results in specific locations to increase views and leads.</p>
           <button className="text-amber-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">Buy Boost Credits <Icon name="arrowRight" size={16} /></button>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
             <Icon name="users" size={24} />
           </div>
           <h3 className="font-bold text-slate-900 mb-2">Lead Purchase System</h3>
           <p className="text-sm text-slate-500 mb-4 line-clamp-3">Directly purchase high-intent tenant leads and viewing requests in your specialized areas.</p>
           <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">View Market Leads <Icon name="arrowRight" size={16} /></button>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
             <Icon name="barChart2" size={24} />
           </div>
           <h3 className="font-bold text-slate-900 mb-2">Analytics Subscription</h3>
           <p className="text-sm text-slate-500 mb-4 line-clamp-3">Access deep market insights, average prices, and performance metrics for your portfolio.</p>
           <button className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">Unlock Analytics <Icon name="arrowRight" size={16} /></button>
        </div>

      </div>
    </div>
  );
};

export default AgentMonetizationDash;
