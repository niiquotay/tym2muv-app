import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { CATEGORIES } from '../constants';
import { SearchFilters } from '../types';
import LocationSelect from './LocationSelect';
import useDebounce from '../hooks/useDebounce';

interface SmartSearchInputProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string, filters?: SearchFilters) => void;
  variant?: 'simple' | 'hero';
}

const SmartSearchInput: React.FC<SmartSearchInputProps> = ({ 
  placeholder = "Search...", 
  className = "", 
  onSearch,
  variant = 'simple'
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Filter States
  const [filters, setFilters] = useState<SearchFilters>({
    categoryId: '',
    subcategoryId: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    type: undefined,
    propertyType: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    sortBy: 'newest'
  });

  const debouncedQuery = useDebounce(query, 500);
  const isFirstMount = React.useRef(true);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    // Only trigger if we aren't showing filters. If showing filters, user will click "Apply Filters"
    if (onSearch && !showFilters) {
      onSearch(debouncedQuery, filters);
    }
  }, [debouncedQuery]);

  const handleFilterChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(query, filters);
      setShowFilters(false);
    }
  };

  const handleApplyFilters = () => {
    if (onSearch) {
      onSearch(query, filters);
    }
    setShowFilters(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (showSort) setShowSort(false);
  };

  const toggleSort = () => {
    setShowSort(!showSort);
    if (showFilters) setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({ 
        categoryId: '', 
        subcategoryId: '',
        minPrice: '', 
        maxPrice: '', 
        location: '', 
        type: undefined,
        propertyType: undefined,
        bedrooms: undefined,
        bathrooms: undefined,
        sortBy: 'newest' 
    });
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (onSearch) onSearch(transcript, filters);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center z-20 group">
        {variant === 'simple' && (
          <div className="absolute left-3 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none">
             <Icon name="search" size={18} />
          </div>
        )}
        
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full bg-slate-50/80 backdrop-blur-sm transition-all outline-none font-medium text-sm ${
             variant === 'simple' 
               ? 'pl-10 pr-32 py-3 rounded-2xl border border-slate-200 shadow-inner focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
               : 'text-slate-800 placeholder-slate-400 pr-32'
          }`}
        />

        <div className={`absolute flex items-center gap-1 ${variant === 'simple' ? 'right-2' : 'right-0'}`}>
          <button 
            onClick={handleVoiceSearch}
            className={`p-2 rounded-xl transition-all relative ${isListening ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-brand-600 hover:bg-white/80'}`}
            title="Voice Search"
          >
            <Icon name="mic" size={18} />
          </button>
          <button 
            onClick={toggleSort}
            className={`p-2 rounded-xl transition-all relative ${showSort ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-brand-600 hover:bg-white/80'}`}
            title="Sort Order"
          >
            <Icon name="sort" size={18} />
          </button>
          <button 
            onClick={toggleFilters}
            className={`p-2 rounded-xl transition-all relative ${showFilters ? 'text-brand-600 bg-brand-50' : 'text-slate-400 hover:text-brand-600 hover:bg-white/80'}`}
            title="Advanced Filters"
          >
            <Icon name="sliders" size={18} />
          </button>
        </div>
      </div>

      {/* Sort Dropdown */}
      {showSort && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)}></div>
          <div className="absolute top-full right-0 mt-3 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fade-in flex flex-col gap-1">
             <div className="text-xs font-bold text-slate-400 px-3 py-2 uppercase tracking-wide">Sort Results By</div>
             {[
                 { label: 'Newest First', value: 'newest' },
                 { label: 'Price: Low to High', value: 'price_asc' },
                 { label: 'Price: High to Low', value: 'price_desc' },
                 { label: 'Relevance', value: 'relevance' }
             ].map(opt => (
                 <button
                    key={opt.value}
                    onClick={() => {
                        handleFilterChange('sortBy', opt.value);
                        setShowSort(false);
                        if (onSearch) onSearch(query, { ...filters, sortBy: opt.value });
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filters.sortBy === opt.value ? 'bg-brand-50 text-brand-600' : 'text-slate-600 hover:bg-slate-50'}`}
                 >
                    {opt.label}
                 </button>
             ))}
          </div>
        </>
      )}

      {/* Advanced Filters Dropdown */}
      {showFilters && (
        <>
          {/* Overlay to close on click outside */}
          <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)}></div>
          
          <div className="absolute top-full left-0 mt-3 w-full bg-white border border-slate-200 rounded-3xl shadow-[0_20px_40px_-10px_rgba(147,51,234,0.15)] p-6 z-50 animate-fade-in">
            <div className="flex justify-between items-center mb-5">
               <h3 className="font-bold text-slate-800 flex items-center gap-2 font-display">
                 <Icon name="sliders" size={18} className="text-brand-600" /> Filter Options
               </h3>
               <button onClick={handleResetFilters} className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                 Reset All
               </button>
            </div>

            <div className="space-y-5">
              {/* Price Range */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Price Range</label>
                <div className="flex gap-3">
                  <div className="relative w-1/2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input 
                        type="number" 
                        placeholder="Min" 
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-medium"
                    />
                  </div>
                  <div className="relative w-1/2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                    <input 
                        type="number" 
                        placeholder="Max" 
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Location Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Category</label>
                    <div className="relative">
                        <select 
                        value={filters.categoryId || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilters(prev => ({ 
                            ...prev, 
                            categoryId: val,
                            // Autofill propertyType sensibly
                            propertyType: val === 'houses' ? 'Apartment' : val === 'land' ? 'Land' : val === 'offices' ? 'Office' : val === 'warehouses' ? 'Warehouse' : undefined
                          }));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 appearance-none font-medium"
                        >
                        <option value="">Any Category</option>
                        <option value="houses">Houses & Apartments</option>
                        <option value="land">Lands & Plots</option>
                        <option value="offices">Offices & Shops</option>
                        <option value="warehouses">Warehouses & Storage</option>
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Icon name="chevronRight" size={12} className="rotate-90" />
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Location</label>
                    <LocationSelect 
                        value={filters.location || ''}
                        onChange={(val) => handleFilterChange('location', val)}
                        placeholder="Region, City..."
                     />
                 </div>
              </div>

              {/* Property Type & Beds Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Property Type</label>
                    <div className="relative">
                        <select 
                        value={filters.propertyType || ''} 
                        onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 appearance-none font-medium"
                        >
                        <option value="">Any Type</option>
                        <option value="Apartment">Apartment</option>
                        <option value="House">House</option>
                        <option value="Condo">Condo</option>
                        <option value="Villa">Villa</option>
                        <option value="Office">Office</option>
                        <option value="Land">Land</option>
                        <option value="Warehouse">Warehouse</option>
                        <option value="Storage">Storage</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Retail">Retail</option>
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Icon name="chevronRight" size={12} className="rotate-90" />
                        </div>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Beds</label>
                    <div className="relative">
                        <select 
                        value={filters.bedrooms || ''} 
                        onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 appearance-none font-medium"
                        >
                        <option value="">Any</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Icon name="chevronRight" size={12} className="rotate-90" />
                        </div>
                    </div>
                 </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={handleApplyFilters}
                  className="w-full bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-fuchsia-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartSearchInput;