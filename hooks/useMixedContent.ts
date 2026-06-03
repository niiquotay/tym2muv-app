import { useMemo } from 'react';

export function useMixedContent(listings: any[], ads: any[], interval = 16, maxAds = 10, insertAdAtStart = false) {
  return useMemo(() => {
    const result: { type: 'listing' | 'ad', data: any }[] = [];
    let adCount = 0;
    
    if (insertAdAtStart && ads && ads.length > 0) {
      result.push({ type: 'ad' as const, data: ads[adCount % ads.length] });
      adCount++;
    }
    
    listings.forEach((listing, index) => {
      result.push({ type: 'listing' as const, data: listing });
      
      if ((index + 1) % interval === 0 && adCount < maxAds && ads && ads.length > 0) {
        result.push({ type: 'ad' as const, data: ads[adCount % ads.length] });
        adCount++;
      }
    });
    
    return result;
  }, [listings, ads, interval, maxAds, insertAdAtStart]);
}
