
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { Logo } from './Logo';
import SmartSearchInput from './SmartSearchInput';
import { SearchFilters } from '../types';
import FuturisticBackground from './FuturisticBackground';
import { useAuth } from '../context/AuthContext';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { AFRICAN_COUNTRIES } from '../services/location';
import { motion } from 'framer-motion';
import AdBanner from './AdBanner';
import AdvertisementPopup from './AdvertisementPopup';
import InteractiveAdBanner from './InteractiveAdBanner';

import CountrySelector from './CountrySelector';

import NotificationDropdown from './NotificationDropdown';
import MobileBottomNav from './MobileBottomNav';
import ProfileDropdown from './ProfileDropdown';

interface LayoutProps {
  children: React.ReactNode;
}

const CountrySelectionModal: React.FC = () => {
  const { setCountry, completeCountrySelection, location } = useAppLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(location.countryCode || 'GH');

  const currentCountry = AFRICAN_COUNTRIES.find(c => c.code === selectedCountry) || AFRICAN_COUNTRIES[0];

  const handleConfirm = () => {
    setCountry(selectedCountry);
    completeCountrySelection();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-visible border border-slate-100"
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="globe" size={24} className="text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight font-sans">tym2muv</h2>
          <p className="text-slate-400 text-sm mb-6 font-medium font-sans">
            Select your country to get started.
          </p>

          <div className="relative text-left mb-6">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-brand-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 overflow-hidden rounded shadow-sm border border-slate-200 shrink-0">
                  <img 
                    src={currentCountry.flagUrl} 
                    alt={currentCountry.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-semibold text-slate-700 text-sm">{currentCountry.name}</span>
              </div>
              <Icon name="chevronDown" size={18} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                {AFRICAN_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      setSelectedCountry(country.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-brand-50 transition-all text-left ${selectedCountry === country.code ? 'bg-brand-50/50' : ''}`}
                  >
                    <div className="w-8 h-6 overflow-hidden rounded shadow-sm border border-slate-200 shrink-0">
                      <img 
                        src={country.flagUrl} 
                        alt={country.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">{country.name}</span>
                    {selectedCountry === country.code && (
                      <Icon name="check" size={14} className="ml-auto text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-all active:scale-[0.98] shadow-md shadow-brand-100"
            >
              Continue
            </button>
            <button
              onClick={completeCountrySelection}
              className="w-full py-3 bg-slate-50 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              I'll browse for now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { location: userLocData, refreshLocation, isLoading: isLocating, needsCountrySelection } = useAppLocation();

  const handleSearch = (query: string, filters?: SearchFilters) => {
    console.log("Searching for:", query, filters);
    
    // Navigate to a generic search results page
    const searchParams = new URLSearchParams();
    if (query) searchParams.set('q', query);
    if (filters?.minPrice) searchParams.set('minPrice', filters.minPrice);
    if (filters?.maxPrice) searchParams.set('maxPrice', filters.maxPrice);
    if (filters?.location) searchParams.set('location', filters.location);
    if (filters?.propertyType) searchParams.set('propertyType', filters.propertyType);
    
    navigate(`/search?${searchParams.toString()}`);
  };

  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup' || location.pathname === '/admin-login';

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-white font-sans">
        <main className="flex-grow flex items-center justify-center relative z-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-white font-sans">
      {needsCountrySelection && <CountrySelectionModal />}
      
      {/* 3D Animated Background */}
      <FuturisticBackground />

      {/* Global Auto Popup (Placed here for correct Z-Index stacking over header) */}
      <AdvertisementPopup />

      {/* Unified Floating Header Card */}
      <header className="sticky top-0 z-[100] pt-4 pb-2 pointer-events-none transition-all duration-300">
        <div className="container mx-auto px-4 max-w-7xl">
            <div className="pointer-events-auto w-full glass-card rounded-2xl transition-all relative">
            
            {/* Top Bar: Brand, Search, Actions */}
            <div className="flex items-center justify-between px-2 sm:px-6 py-2 sm:py-3 gap-1 sm:gap-8 h-14 sm:h-[72px]">
                
                {/* Logo */}
                <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                    <Link to="/" className="hover:opacity-80 transition-opacity">
                        <Logo />
                    </Link>
                    <Link to="/rent-financing" className="hidden border border-emerald-100 bg-white/70 hover:bg-white text-slate-700 hover:text-emerald-600 font-extrabold text-xs tracking-wide rounded-xl px-3.5 py-2 hover:shadow-sm sm:flex gap-1.5 items-center transition-all">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Rent Financing</span>
                    </Link>
                </div>

                {/* Search - Centered */}
                <div className="hidden md:block flex-1 max-w-3xl">
                    <SmartSearchInput 
                    variant="simple" 
                    placeholder="Search properties..." 
                    onSearch={handleSearch}
                    className="w-full"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
                    
                    {/* Country Selector */}
                    <CountrySelector />

                    {/* Post Button */}
                    <Link 
                      to={isAuthenticated && (user?.role !== 'Agent' && user?.role !== 'Admin') ? "/create-vendor" : "/post"} 
                      className="flex items-center justify-center w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md shadow-red-500/15 hover:shadow-red-500/25 hover:scale-105 active:scale-95 flex-shrink-0"
                      title="Post Listing"
                    >
                      <Icon name="plus" size={18} strokeWidth={3} className="w-[18px] h-[18px]" />
                    </Link>

                    {/* Auth */}
                    {isAuthenticated ? (
                    <>
                        {/* Admin Link */}
                        {(user?.role === 'Admin' || user?.socials?.email === 'info@caliberdesk.com') && (
                          <Link to="/admin" className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all group animate-fade-in" title="Admin Panel">
                            <Icon name="settings" size={20} className="w-5 h-5" />
                          </Link>
                        )}
                        {user?.role === 'Agent' && (
                          <Link to="/agent-dashboard" className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-full transition-all group animate-fade-in" title="Agent Dashboard">
                            <Icon name="layout" size={20} className="w-5 h-5" />
                          </Link>
                        )}
                        <NotificationDropdown />
                        <Link to="/chat" className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all relative group">
                        <Icon name="messageCircle" size={20} className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 border border-white rounded-full"></span>
                        </Link>
                        <ProfileDropdown />
                    </>
                    ) : (
                    <>
                      <Link 
                          to="/signin" 
                          className="flex items-center justify-center w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all shadow-md shadow-purple-500/15 hover:shadow-purple-500/25 hover:scale-105 active:scale-95 flex-shrink-0"
                          title="Sign In / Join"
                      >
                          <Icon name="user" size={18} className="w-[18px] h-[18px]" />
                      </Link>
                    </>
                    )}
                </div>
            </div>

            {/* Search Mobile - Show only on mobile */}
            <div className="md:hidden px-4 pb-4">
                <SmartSearchInput variant="simple" onSearch={handleSearch} placeholder="Search..." />
            </div>

            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow relative z-0">
        <InteractiveAdBanner />
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-brand-950 text-purple-100 py-6 mt-0 relative z-10">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
          
          {/* Brand & CMS Links */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <Link to="/" className="scale-90 opacity-90 grayscale brightness-200 hover:opacity-100 transition-all duration-300">
                <Logo />
            </Link>
            <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-semibold text-purple-200">
              <Link to="/info/about-us" className="hover:text-white transition-colors">About Us</Link>
              <span>•</span>
              <Link to="/info/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link to="/info/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>

          {/* Contact & Socials */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            
            {/* Contact Info */}
            <div className="flex items-center gap-4 text-sm font-medium">
                <a href="mailto:support@tym2muv.com" className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors group">
                    <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-brand-600 transition-colors">
                        <Icon name="mail" size={14} />
                    </div>
                    <span className="hidden sm:inline">support@tym2muv.com</span>
                </a>
                <a href="https://wa.me/233530483353" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-200 hover:text-[#25D366] transition-colors group">
                    <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-[#25D366] transition-colors">
                        <Icon name="whatsapp" size={14} />
                    </div>
                    <span className="hidden sm:inline">WhatsApp</span>
                </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating App WhatsApp Button */}
      <a 
        href="https://wa.me/233530483353" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-24 md:bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg shadow-[#25D366]/30 hover:bg-[#128C7E] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group"
        aria-label="Chat with us on WhatsApp"
      >
        <Icon name="whatsapp" size={28} />
        <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          App Support
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-slate-800"></div>
        </span>
      </a>

      <MobileBottomNav />
    </div>
  );
};

export default Layout;
