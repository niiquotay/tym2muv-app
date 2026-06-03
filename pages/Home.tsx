
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../constants';
import ListingCard from '../components/ListingCard';
import AdCard from '../components/AdCard';
import { getListings, getMonetizationAds } from '../services/supabaseService';
import Icon from '../components/Icon';
import { Link } from 'react-router-dom';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { useMixedContent } from '../hooks/useMixedContent';
import ErrorBanner from '../components/ErrorBanner';
import SkeletonCard from '../components/SkeletonCard';
import SmartSearchInput from '../components/SmartSearchInput';

const ITEMS_PER_PAGE = 24; // Reduced for better performance with live data

const Home: React.FC = () => {
  const { location: userLocation } = useAppLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAppending, setIsAppending] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [dbAds, setDbAds] = useState<any[]>([]);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const loaderRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setCurrentPage(1); // Reset page on country change
    setIsAppending(false);
    setError(null);
  }, [userLocation.countryCode]);

  useEffect(() => {
    const fetchDbAds = async () => {
      try {
        const activeAds = await getMonetizationAds(userLocation.countryCode);
        const activeOnly = (activeAds || []).filter((ad: any) => ad.active);
        setDbAds(activeOnly);
      } catch (err) {
        console.warn('Failed to fetch active monetization campaigns:', err);
      }
    };
    fetchDbAds();
  }, [userLocation.countryCode]);

  const fetchListings = async () => {
    // Don't show full loading skeleton if we're just appending
    if (!isAppending) setIsLoading(true);
    setError(null);
    try {
      const { listings: fetchedListings, total } = await getListings({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        countryCode: userLocation.countryCode
      });
      
      if (isAppending) {
          setListings(prev => {
              // Avoid duplicates in case of React double rendering
              const existingIds = new Set(prev.map(l => l.id));
              const uniqueNew = fetchedListings.filter(l => !existingIds.has(l.id));
              return [...prev, ...uniqueNew];
          });
      } else {
          setListings(fetchedListings);
      }
      setTotalItems(total);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError('Failed to load listings. Please check your connection.');
    } finally {
      setIsLoading(false);
      setIsAppending(false);
    }
  };

  useEffect(() => {
    fetchListings();
    
    // Scroll to top of the trending section or page if NOT appending
    if (!isAppending) {
        const trendingSection = document.getElementById('trending-section');
        if (trendingSection && currentPage > 1) {
          trendingSection.scrollIntoView({ behavior: 'smooth' });
        } else if (currentPage === 1) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
  }, [currentPage, userLocation.countryCode]);

  useEffect(() => {
      const observer = new IntersectionObserver(
          (entries) => {
              if (entries[0].isIntersecting && !isLoading && currentPage < totalPages) {
                  // check if on mobile
                  if (window.innerWidth < 768) {
                      setIsAppending(true);
                      setCurrentPage(prev => prev + 1);
                  }
              }
          },
          { threshold: 0.1 }
      );
      
      if (loaderRef.current) {
          observer.observe(loaderRef.current);
      }
      
      return () => {
          if (loaderRef.current) observer.unobserve(loaderRef.current);
      };
  }, [isLoading, currentPage, totalPages]);

  // Define country-specific ads
  const ads = useMemo(() => {
    if (dbAds && dbAds.length > 0) {
      return dbAds.map((ad: any) => ({
        id: ad.id,
        type: ad.type === 'tall' ? 'tall' as const : 'standard' as const,
        title: ad.title,
        description: ad.description,
        cta: ad.cta || 'Learn More',
        image: ad.image,
        color: ad.color || 'from-brand-600 to-indigo-600',
        link: ad.link
      }));
    }

    const countryName = userLocation.country;
    return [
      {
        id: 'fallback-1',
        type: 'tall' as const,
        title: `Real Estate in ${countryName}`,
        description: `Explore the best properties across ${countryName}. From luxury villas to affordable apartments.`,
        cta: 'Explore Now',
        image: `https://picsum.photos/seed/${userLocation.countryCode}1/400/800`,
        color: 'from-brand-600 to-indigo-600'
      },
      {
        id: 'fallback-2',
        type: 'tall' as const,
        title: `${userLocation.currency} Mortgage Deals`,
        description: `Get the best mortgage rates in ${userLocation.country} today.`,
        cta: 'Check Rates',
        image: `https://picsum.photos/seed/${userLocation.countryCode}2/400/800`,
        color: 'from-emerald-600 to-teal-600'
      },
      {
        id: 'fallback-3',
        type: 'tall' as const,
        title: 'Verified Agents',
        description: `Work with top-rated agents in ${countryName} for a safe transaction.`,
        cta: 'Find Agent',
        image: `https://picsum.photos/seed/${userLocation.countryCode}3/400/800`,
        color: 'from-blue-600 to-indigo-600'
      },
      {
        id: 'fallback-4',
        type: 'tall' as const,
        title: 'Post Your Ad',
        description: `Selling in ${countryName}? List your property for free and reach millions.`,
        cta: 'Post Now',
        image: `https://picsum.photos/seed/${userLocation.countryCode}4/400/800`,
        color: 'from-orange-600 to-amber-600'
      }
    ];
  }, [userLocation, dbAds]);

  // Mix listings and ads
  const mixedContent = useMixedContent(listings, ads, 16, 10, true);

  const renderPagination = () => {
    const pages = [];
    const windowStart = Math.max(1, currentPage - 1);
    const windowEnd = Math.min(totalPages, currentPage + 1);

    if (windowStart > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all bg-white text-slate-600 hover:bg-brand-50 border border-slate-200"
        >
          1
        </button>
      );
      if (windowStart > 2) {
         pages.push(<span key={"dots-1"} className="px-2 text-slate-400">...</span>);
      }
    }

    for (let i = windowStart; i <= windowEnd; i++) {
        pages.push(
            <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                currentPage === i
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-110'
                    : 'bg-white text-slate-600 hover:bg-brand-50 border border-slate-200'
                }`}
            >
                {i}
            </button>
        );
    }

    if (windowEnd < totalPages) {
       if (windowEnd < totalPages - 1) {
           pages.push(<span key={"dots-2"} className="px-2 text-slate-400">...</span>);
       }
       pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all bg-white text-slate-600 hover:bg-brand-50 border border-slate-200"
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="hidden md:flex items-center justify-center gap-2 mt-12">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-600 border border-slate-200 disabled:opacity-50 hover:bg-brand-50 transition-all"
        >
          <Icon name="chevronRight" size={20} className="rotate-180" />
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-slate-600 border border-slate-200 disabled:opacity-50 hover:bg-brand-50 transition-all"
        >
          <Icon name="chevronRight" size={20} />
        </button>
      </div>
    );
  };

  return (
    <div className="pt-2 pb-8">
      <div className="container mx-auto px-4 space-y-6 animate-slide-up relative z-10">
         
          {/* Stunning Premium Home Hero Banner */}
          <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-brand-700 text-white p-8 md:p-14 shadow-xl shadow-indigo-500/10 border border-white/10 mt-2">
            {/* Visual background layers */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="relative z-10 max-w-3xl flex flex-col gap-6">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wider uppercase text-purple-200 border border-white/10 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                PREMIUM AFRICAN PROPERTY MARKETPLACE
              </div>
              
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight md:leading-tight font-display text-white">
                Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-amber-200">Verified Space</span> across Africa
              </h1>
              
              <p className="text-slate-100/90 text-[13px] md:text-sm max-w-xl leading-relaxed">
                Connect directly with thousands of verified estate agents, landlords, and commercial vendors with zero hidden broker fees. Secure, live-chat communication.
              </p>
              
              {/* Integrated Hero Smart Search */}
              <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg mt-2">
                <SmartSearchInput 
                  variant="simple" 
                  placeholder="Accra apartment, commercial warehouses, plots of land..." 
                  onSearch={(query, filters) => {
                    const searchParams = new URLSearchParams();
                    if (query) searchParams.set('q', query);
                    if (filters?.minPrice) searchParams.set('minPrice', filters.minPrice);
                    if (filters?.maxPrice) searchParams.set('maxPrice', filters.maxPrice);
                    if (filters?.location) searchParams.set('location', filters.location);
                    if (filters?.propertyType) searchParams.set('propertyType', filters.propertyType);
                    window.location.href = `/search?${searchParams.toString()}`;
                  }}
                  className="w-full bg-white text-slate-900 rounded-xl"
                />
              </div>

              {/* Trust Badge Indicators */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-[10px] md:text-xs font-mono text-purple-200">
                <div className="flex items-center gap-1.5">
                  <Icon name="check" size={14} className="text-emerald-400" />
                  <span>5,000+ Daily Verified Listings</span>
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full hidden sm:block"></div>
                <div className="flex items-center gap-1.5">
                  <Icon name="shield" size={14} className="text-emerald-400" />
                  <span>100% Secure Transactions</span>
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full hidden sm:block"></div>
                <div className="flex items-center gap-1.5">
                  <Icon name="messageCircle" size={14} className="text-emerald-400" />
                  <span>Real-time Seller Connect</span>
                </div>
              </div>
            </div>
          </section>

          {/* Category Quick Filter Bento section */}
          <section className="mt-1">
            <div className="glass-card rounded-[2.2rem] p-6 md:p-8 shadow-sm border border-slate-100/50 bg-white/45 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Icon name="sliders" size={20} className="text-brand-600 animate-pulse" />
                    How can we help you today?
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Select a category to browse active verified properties</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    id: 'houses',
                    name: 'Houses & Apartments',
                    description: 'Explore verified apartments, homes, condos, and premium villas.',
                    textColor: 'text-blue-600',
                    lightBg: 'bg-blue-50/70',
                    icon: 'home',
                  },
                  {
                    id: 'land',
                    name: 'Lands & Plots',
                    description: 'Find verified residential, agricultural, and commercial plots.',
                    textColor: 'text-emerald-600',
                    lightBg: 'bg-emerald-50/70',
                    icon: 'mapPin',
                  },
                  {
                    id: 'offices',
                    name: 'Offices & Shops',
                    description: 'Browse prime corporate offices, co-working, and commercial settings.',
                    textColor: 'text-amber-600',
                    lightBg: 'bg-amber-50/70',
                    icon: 'briefcase',
                  },
                  {
                    id: 'warehouses',
                    name: 'Warehouses & Storage',
                    description: 'Find storage facilities, cold storage, cargo docks, and fulfillment sites.',
                    textColor: 'text-indigo-600',
                    lightBg: 'bg-indigo-50/70',
                    icon: 'package',
                  }
                ].map(cat => (
                  <Link
                    key={cat.id}
                    to={`/search?categoryId=${cat.id}`}
                    className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 border border-slate-200/60 bg-white/80 hover:border-transparent transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between min-h-[155px] duration-300"
                  >
                    {/* Hover subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 from-purple-500 to-indigo-600" />
                    
                    <div className="flex justify-between items-start z-10">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${cat.lightBg} ${cat.textColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <Icon name={cat.icon} size={20} />
                      </div>
                      <span className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all duration-300">
                        <Icon name="chevronRight" size={18} />
                      </span>
                    </div>

                    <div className="mt-4 relative z-10">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-brand-700 transition-colors tracking-tight">{cat.name}</h3>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed group-hover:text-slate-600 transition-colors">{cat.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Luxury Rent Financing Banner */}
          <section className="mt-1 animate-slide-up">
            <div className="relative overflow-hidden rounded-[2.2rem] bg-gradient-to-br from-indigo-900 via-indigo-950 to-emerald-950 text-white p-6 sm:p-10 border border-emerald-500/10 shadow-lg">
              {/* Background accent designs */}
              <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-[180px] h-[180px] bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="max-w-2xl space-y-3">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    CaliberRent Finance Program
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
                    Struggling with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-indigo-200">Huge Landlord Advances</span>?
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Zero worry. CaliberDesk will finance your rent directly and immediately. Secure the space you love today, and pay us back in stress-free monthly tiers over up to <strong>36 months</strong>.
                  </p>
                </div>

                <div className="w-full md:w-auto flex-shrink-0">
                  <Link
                    id="apply-financing-home-banner-btn"
                    to="/rent-financing"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-extrabold text-xs sm:text-sm text-slate-950 px-6 py-4 rounded-2xl shadow-xl shadow-emerald-500/15 duration-300 transition-all hover:scale-[1.03] active:scale-97 w-full sm:w-auto"
                  >
                    <span>Calculate & Apply Now</span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Trending Listings */}
          <section id="trending-section">
            <div className="glass-card rounded-[2rem] p-6 md:p-8 shadow-sm">
              {error ? (
                <ErrorBanner message={error} onRetry={fetchListings} />
              ) : isLoading && !isAppending ? (
                <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {[...Array(12)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="search" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No listings found</h3>
                  <p className="text-slate-500">Try adjusting your filters or location.</p>
                </div>
              ) : (
                <>
                  {/* Grid */}
                  <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                    {mixedContent.map((item, idx) => (
                      item.type === 'listing' ? (
                        <ListingCard key={item.data.id} listing={item.data} />
                      ) : (
                        <AdCard 
                          key={`ad-${idx}`} 
                          id={item.data.id}
                          type={item.data.type}
                          title={item.data.title}
                          description={item.data.description}
                          cta={item.data.cta}
                          image={item.data.image}
                          color={item.data.color}
                          link={item.data.link}
                          className={`${
                            idx % 2 === 0 ? 'col-start-1' : 'col-start-2'
                          } min-[420px]:col-start-${(idx % 3) + 1} sm:col-start-${(idx % 4) + 1} md:col-start-${(idx % 5) + 1} lg:col-start-${(idx % 6) + 1}`}
                        />
                      )
                    ))}
                  </div>

                  {isLoading && isAppending && (
                      <div className="mt-8 flex justify-center">
                          <Icon name="loader" size={24} className="animate-spin text-brand-500" />
                      </div>
                  )}

                  {/* Intersection Observer Target */}
                  <div ref={loaderRef} className="h-4 w-full" />

                  {/* Pagination */}
                  {totalPages > 1 && renderPagination()}
                </>
              )}
            </div>
          </section>
      </div>
    </div>
  );
};

export default Home;
