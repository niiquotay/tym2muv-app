
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import AdCard from '../components/AdCard';
import { getListings, getMonetizationAds } from '../services/supabaseService';
import Icon from '../components/Icon';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { useMixedContent } from '../hooks/useMixedContent';
import ErrorBanner from '../components/ErrorBanner';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import useDebounce from '../hooks/useDebounce';

const ITEMS_PER_BATCH = 24; 

const SearchPage: React.FC = () => {
  const { location: userLocation } = useAppLocation();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const query = searchParams.get('q') || '';
  
  // Data State
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [dbAds, setDbAds] = useState<any[]>([]);

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

  const [localFilters, setLocalFilters] = useState({
    priceRange: searchParams.get('minPrice') ? (searchParams.get('maxPrice') ? `$${searchParams.get('minPrice')} - $${searchParams.get('maxPrice')}` : '$10,000+') : 'Price Range',
    bedrooms: searchParams.get('bedrooms') ? `${searchParams.get('bedrooms')}+ Beds` : 'Beds',
    bathrooms: searchParams.get('bathrooms') ? `${searchParams.get('bathrooms')}+ Baths` : 'Baths',
    propertyType: searchParams.get('propertyType') || 'Property Type'
  });

  const debouncedFilters = useDebounce(localFilters, 500);

  useEffect(() => {
    // Sync debounced filters to URL
    const params = new URLSearchParams(location.search);
    let changed = false;
    
    // Bedrooms
    if (debouncedFilters.bedrooms && debouncedFilters.bedrooms !== 'Beds') {
      const val = debouncedFilters.bedrooms.replace('+', '').replace(' Beds', '');
      if (params.get('bedrooms') !== val) { params.set('bedrooms', val); changed = true; }
    } else if (params.has('bedrooms')) {
      params.delete('bedrooms'); changed = true;
    }
    
    // Bathrooms
    if (debouncedFilters.bathrooms && debouncedFilters.bathrooms !== 'Baths') {
      const val = debouncedFilters.bathrooms.replace('+', '').replace(' Baths', '');
      if (params.get('bathrooms') !== val) { params.set('bathrooms', val); changed = true; }
    } else if (params.has('bathrooms')) {
      params.delete('bathrooms'); changed = true;
    }

    // Property Type
    if (debouncedFilters.propertyType && debouncedFilters.propertyType !== 'Property Type') {
      if (params.get('propertyType') !== debouncedFilters.propertyType) { 
        params.set('propertyType', debouncedFilters.propertyType); 
        changed = true; 
      }
    } else if (params.has('propertyType')) {
      params.delete('propertyType'); changed = true;
    }

    // Price Range
    if (debouncedFilters.priceRange && debouncedFilters.priceRange !== 'Price Range') {
      if (debouncedFilters.priceRange === '$10,000+') {
         if (params.get('minPrice') !== '10000' || params.has('maxPrice')) {
           params.set('minPrice', '10000');
           params.delete('maxPrice');
           changed = true;
         }
      } else {
         const parts = debouncedFilters.priceRange.replace(/\$/g, '').replace(/,/g, '').split(' - ');
         if (parts.length === 2 && (params.get('minPrice') !== parts[0] || params.get('maxPrice') !== parts[1])) {
            params.set('minPrice', parts[0]);
            params.set('maxPrice', parts[1]);
            changed = true;
         }
      }
    } else if (params.has('minPrice') || params.has('maxPrice')) {
      params.delete('minPrice');
      params.delete('maxPrice');
      changed = true;
    }

    if (query && !params.has('location') && !['real-estate', 'jobs', 'vehicles', 'services'].includes(query.toLowerCase())) {
        if (params.get('location') !== query) {
            params.set('location', query);
            changed = true;
        }
    }

    if (changed) {
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [debouncedFilters]);

  const handleFilterChange = (field: keyof typeof localFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

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
      }
    ];
  }, [userLocation, dbAds]);

  // Mix listings and ads
  const mixedContent = useMixedContent(listings, ads, 10, 10, false);

  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // Reset and load initial batch when query or country changes
  useEffect(() => {
    const fetchInitialListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const initialFilters: any = {
          page: 1,
          limit: ITEMS_PER_BATCH,
          countryCode: userLocation.countryCode,
        };

        if (query) {
          // If query looks like a category id, use it, else use search term (location for simplicity)
          if (['real-estate', 'jobs', 'vehicles', 'services'].includes(query.toLowerCase())) {
            initialFilters.categoryId = query;
          } else {
             initialFilters.location = query; // Simple search proxy
          }
        }
        
        // Take extra parameters from URL if using Smart Search Input
        if (searchParams.has('location')) initialFilters.location = searchParams.get('location');
        if (searchParams.has('categoryId')) initialFilters.categoryId = searchParams.get('categoryId');
        if (searchParams.has('propertyType')) initialFilters.propertyType = searchParams.get('propertyType');
        if (searchParams.has('minPrice')) initialFilters.minPrice = searchParams.get('minPrice');
        if (searchParams.has('maxPrice')) initialFilters.maxPrice = searchParams.get('maxPrice');
        if (searchParams.has('bedrooms')) initialFilters.bedrooms = searchParams.get('bedrooms');

        const { listings: fetchedListings, total } = await getListings(initialFilters);
        setListings(fetchedListings);
        setTotalItems(total);
        setPage(1);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError('Failed to load listings. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialListings();
  }, [query, userLocation.countryCode, location.search, retryKey]);

  const handleLoadMore = async () => {
    if (isLoading || listings.length >= totalItems) return;
    
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const nextFilters: any = {
        page: nextPage,
        limit: ITEMS_PER_BATCH,
        countryCode: userLocation.countryCode,
      };
      if (searchParams.has('location')) nextFilters.location = searchParams.get('location');
      if (searchParams.has('categoryId')) nextFilters.categoryId = searchParams.get('categoryId');
      if (searchParams.has('propertyType')) nextFilters.propertyType = searchParams.get('propertyType');
      if (searchParams.has('minPrice')) nextFilters.minPrice = searchParams.get('minPrice');
      if (searchParams.has('maxPrice')) nextFilters.maxPrice = searchParams.get('maxPrice');
      if (searchParams.has('bedrooms')) nextFilters.bedrooms = searchParams.get('bedrooms');

      const { listings: nextBatch } = await getListings(nextFilters);
      setListings(prev => [...prev, ...nextBatch]);
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayListings = listings; 

  return (
    <div className="bg-brand-50 min-h-screen pb-8 pt-4">
      
      <div className="container mx-auto px-4">
           
         {error ? (
           <ErrorBanner message={error} onRetry={() => setRetryKey(k => k + 1)} />
        ) : isLoading && page === 1 ? (
          <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
             {Array.from({ length: 12 }).map((_, idx) => (
                <SkeletonCard key={`skeleton-${idx}`} />
             ))}
          </div>
        ) : displayListings.length === 0 ? (
          <EmptyState 
            title="No properties found" 
            message="We couldn't find any properties matching your search criteria. Try adjusting your filters or search terms."
            actionLabel="Clear Filters"
            onAction={() => navigate('/')}
          />
        ) : (
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
        )}
           
        {/* Load More Button */}
        <div className="mt-12 flex justify-center">
           <button 
             onClick={handleLoadMore}
             disabled={isLoading}
             className="flex items-center gap-3 px-8 py-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-700 font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed group active:scale-95"
           >
             {isLoading ? (
               <>
                 <span className="w-5 h-5 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin"></span>
                 Loading more items...
               </>
             ) : (
               <>
                 Load More Results
                 <Icon name="chevronRight" size={14} className="rotate-90 group-hover:translate-y-0.5 transition-transform" />
               </>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
