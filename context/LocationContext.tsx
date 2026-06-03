import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectUserLocation, UserLocationData, getCountryByCode } from '../services/location';

interface ConvertedPrice {
  price: number;
  formatted: string;
  currency: string;
  symbol: string;
}

interface LocationContextType {
  location: UserLocationData;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
  setCountry: (countryCode: string) => void;
  convertPrice: (priceInUsd: number) => ConvertedPrice;
  needsCountrySelection: boolean;
  completeCountrySelection: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Mock exchange rates relative to USD (Updated to include African currencies)
const RATES: Record<string, number> = {
  USD: 1,
  GHS: 12.5,
  NGN: 1500,
  KES: 132,
  ZAR: 18.9,
  EGP: 48.5,
  MAD: 10.1,
  ETB: 56.5,
  TZS: 2550,
  UGX: 3900,
  RWF: 1280,
  XOF: 605,
  XAF: 605,
  ZMW: 25.5,
  EUR: 0.92,
  GBP: 0.79,
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [needsCountrySelection, setNeedsCountrySelection] = useState(false);
  const [location, setLocation] = useState<UserLocationData>(() => {
    const saved = localStorage.getItem('user_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved location", e);
      }
    }
    return {
      city: 'Accra',
      country: 'Ghana',
      countryCode: 'GH',
      currency: 'GHS',
      symbol: 'GH₵',
      formattedAddress: 'Accra, Ghana'
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshLocation = async () => {
    setIsLoading(true);
    const data = await detectUserLocation();
    setLocation(data);
    localStorage.setItem('user_location', JSON.stringify(data));
    
    // If detection failed to find a known country, we might need selection
    if (data.country === 'Unknown') {
      setNeedsCountrySelection(true);
    }
    
    setIsLoading(false);
  };

  const setCountry = (countryCode: string) => {
    const countryInfo = getCountryByCode(countryCode);
    if (countryInfo) {
      const newLoc = {
        ...location,
        country: countryInfo.name,
        countryCode: countryInfo.code,
        currency: countryInfo.currency,
        symbol: countryInfo.symbol,
        formattedAddress: `${countryInfo.name}`
      };
      setLocation(newLoc);
      localStorage.setItem('user_location', JSON.stringify(newLoc));
      localStorage.setItem('user_country_selected', 'true');
      setNeedsCountrySelection(false);
    }
  };

  const completeCountrySelection = () => {
    localStorage.setItem('user_country_selected', 'true');
    setNeedsCountrySelection(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('user_location');
    const selected = localStorage.getItem('user_country_selected');
    
    if (!saved) {
      refreshLocation().then(() => {
        if (!localStorage.getItem('user_country_selected')) {
          setNeedsCountrySelection(true);
        }
      });
    } else {
      if (!selected) {
        setNeedsCountrySelection(true);
      }
      setIsLoading(false);
    }
  }, []);

  const convertPrice = (priceInUsd: number): ConvertedPrice => {
    const finalRate = RATES[location.currency] ? RATES[location.currency] : 1;
    const finalCurrency = RATES[location.currency] ? location.currency : 'USD';
    const finalSymbol = RATES[location.currency] ? location.symbol : '$';

    const converted = Math.round(priceInUsd * finalRate);
    
    return {
      price: converted,
      formatted: converted.toLocaleString(),
      currency: finalCurrency,
      symbol: finalSymbol
    };
  };

  return (
    <LocationContext.Provider value={{ 
      location, 
      isLoading, 
      refreshLocation, 
      setCountry, 
      convertPrice,
      needsCountrySelection,
      completeCountrySelection
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};