
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { GHANA_LOCATIONS, LocationStructure } from '../constants/ghanaLocations';

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: boolean;
}

const LocationSelect: React.FC<LocationSelectProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select Location", 
  className = "",
  icon = true 
}) => {
  // State for the three dropdowns
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTown, setSelectedTown] = useState('');

  // Derived options based on selections
  const [regionOptions, setRegionOptions] = useState<LocationStructure[]>([]);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [townOptions, setTownOptions] = useState<string[]>([]);

  // Initialize Region Options
  useEffect(() => {
    setRegionOptions(GHANA_LOCATIONS.sort((a, b) => a.region.localeCompare(b.region)));
  }, []);

  // Parse initial string value to populate dropdowns (e.g. "East Legon, Accra Metropolitan, Greater Accra")
  // Format expectation: "Town, City, Region" or "City, Region" or "Region"
  useEffect(() => {
    if (!value) {
        setSelectedRegion('');
        setSelectedCity('');
        setSelectedTown('');
        return;
    }

    // Try to parse the string roughly
    const parts = value.split(',').map(s => s.trim());
    
    // Reverse map check
    // This is simple parsing; for a real app, storing IDs would be better.
    // For now, we trust the flow of the component or just try to match.
    if (parts.length >= 1) {
        // Find if the last part is a region
        const regionName = parts[parts.length - 1];
        const regionData = GHANA_LOCATIONS.find(r => r.region === regionName);
        
        if (regionData) {
            setSelectedRegion(regionName);
            
            // If we have a city (second to last)
            if (parts.length >= 2) {
                const cityName = parts[parts.length - 2];
                // Check if city exists in region
                // Note: The formatted string in `ghanaLocations.ts` `getFlattenedLocations` uses " - " separator sometimes.
                // But this component constructs it with ", " separator.
                const cityData = regionData.cities.find(c => c.name === cityName);
                
                if (cityData) {
                    setSelectedCity(cityName);
                    
                    // If we have a town (first part)
                    if (parts.length >= 3) {
                        const townName = parts[0];
                        if (cityData.towns.includes(townName)) {
                            setSelectedTown(townName);
                        }
                    }
                }
            }
        }
    }
  }, []); // Only on mount to avoid loops, or we handle updates carefully. 
  // Actually, we shouldn't rely on 'value' prop to drive internal state continuously 
  // unless we want external control. For simple forms, initial sync is usually enough.
  // If we want two-way binding that responds to external resets:
  useEffect(() => {
     if (value === '') {
        setSelectedRegion('');
        setSelectedCity('');
        setSelectedTown('');
     }
  }, [value]);


  // Update City Options when Region Changes
  useEffect(() => {
    const region = GHANA_LOCATIONS.find(r => r.region === selectedRegion);
    if (region) {
      setCityOptions(region.cities);
    } else {
      setCityOptions([]);
    }
  }, [selectedRegion]);

  // Update Town Options when City Changes
  useEffect(() => {
    const region = GHANA_LOCATIONS.find(r => r.region === selectedRegion);
    if (region) {
      const city = region.cities.find(c => c.name === selectedCity);
      if (city) {
        setTownOptions(city.towns.sort());
      } else {
        setTownOptions([]);
      }
    } else {
      setTownOptions([]);
    }
  }, [selectedCity, selectedRegion]);

  // Handle Changes
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value;
    setSelectedRegion(newRegion);
    setSelectedCity('');
    setSelectedTown('');
    updateParent(newRegion, '', '');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setSelectedCity(newCity);
    setSelectedTown('');
    updateParent(selectedRegion, newCity, '');
  };

  const handleTownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTown = e.target.value;
    setSelectedTown(newTown);
    updateParent(selectedRegion, selectedCity, newTown);
  };

  const updateParent = (r: string, c: string, t: string) => {
    // Construct the formatted string expected by the app
    let finalString = r;
    if (c) finalString = `${c}, ${r}`;
    if (t) finalString = `${t}, ${c}, ${r}`;
    
    // If nothing selected
    if (!r) finalString = '';

    onChange(finalString);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      
      {/* Region Select */}
      <div className="relative">
        <select
          value={selectedRegion}
          onChange={handleRegionChange}
          className={`w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-medium text-slate-700 ${icon ? 'pl-9 pr-8' : 'px-4'}`}
        >
          <option value="">Select Region</option>
          {regionOptions.map((r) => (
            <option key={r.region} value={r.region}>{r.region}</option>
          ))}
        </select>
        {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icon name="mapPin" size={16} />
            </div>
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Icon name="chevronRight" size={14} className="rotate-90" />
        </div>
      </div>

      {/* City Select */}
      <div className="relative">
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={!selectedRegion}
          className={`w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-medium text-slate-700 ${icon ? 'pl-9 pr-8' : 'px-4'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">{selectedRegion ? "Select City / District" : "Select Region First"}</option>
          {cityOptions.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icon name="building" size={16} />
            </div>
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Icon name="chevronRight" size={14} className="rotate-90" />
        </div>
      </div>

      {/* Town Select */}
      <div className="relative">
        <select
          value={selectedTown}
          onChange={handleTownChange}
          disabled={!selectedCity}
          className={`w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 font-medium text-slate-700 ${icon ? 'pl-9 pr-8' : 'px-4'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">{selectedCity ? "Select Town / Suburb" : "Select City First"}</option>
          {townOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icon name="mapPin" size={16} />
            </div>
        )}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Icon name="chevronRight" size={14} className="rotate-90" />
        </div>
      </div>
      
    </div>
  );
};

export default LocationSelect;
