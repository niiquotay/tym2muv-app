
import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { AFRICAN_COUNTRIES, getCountryByCode } from '../services/location';
import Icon from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

const CountrySelector: React.FC = () => {
  const { location, setCountry } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentCountry = getCountryByCode(location.countryCode) || AFRICAN_COUNTRIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200/50 bg-white/80 hover:bg-white text-slate-700 hover:border-slate-300 transition-all shadow-sm active:scale-95 cursor-pointer flex-shrink-0 group"
      >
        <div className="relative w-6 h-4 overflow-hidden rounded shadow-[0_2px_4px_rgba(0,0,0,0.15)] transform group-hover:scale-110 transition-all duration-300 ease-out select-none border border-white/20">
          <img 
            src={currentCountry.flagUrl} 
            alt={currentCountry.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[110]" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-64 glass-strong rounded-2xl overflow-hidden z-[120] shadow-2xl border border-white/50"
            >
              <div className="p-4 border-bottom border-slate-100 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Country</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                {AFRICAN_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setCountry(country.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      location.countryCode === country.code 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
                        : 'hover:bg-brand-50 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-6 overflow-hidden rounded shadow-sm border border-slate-200 shrink-0">
                      <img 
                        src={country.flagUrl} 
                        alt={country.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-sm">{country.name}</span>
                    </div>
                    {location.countryCode === country.code && (
                      <Icon name="check" size={16} className="ml-auto" />
                    )}
                  </button>
                ))}
              </div>
              <div className="p-3 bg-slate-50/50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center">
                  Listings and ads will be tailored to your selected country.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountrySelector;
