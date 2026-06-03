
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Listing, User } from '../types';
import { CATEGORIES } from '../constants';
import Icon from './Icon';
import { generateListingTitle } from '../utils/listingUtils';
import { useAuth } from '../context/AuthContext';
import { getSymbolFromCode } from '../services/location';
import { getOptimizedImageUrl } from '../utils/imageOptimization';
import ResponsiveImage from './ResponsiveImage';

interface ListingCardProps {
  listing?: Listing;
  seller?: User;
  isLoading?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, seller, isLoading }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  if (isLoading || !listing) {
    return (
      <div className="w-full h-full bg-white rounded-xl shadow-sm flex flex-col ring-1 ring-slate-100 overflow-hidden animate-pulse">
        <div className="aspect-[3/2] bg-slate-200" />
        <div className="p-3">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-full" />
          </div>
        </div>
        <div className="mt-auto p-3 border-t border-slate-100 bg-slate-50/80">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.sellerId;

  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop';

  const images = useMemo(() => {
    const list = listing.images && listing.images.length > 0 ? listing.images : [listing.imageUrl];
    return list.filter(Boolean).length > 0 ? list.filter(Boolean) as string[] : [FALLBACK_IMAGE];
  }, [listing.images, listing.imageUrl]);

  const [isFlipped, setIsFlipped] = useState(false);
  const [frontImageIndex, setFrontImageIndex] = useState(0);
  const [backImageIndex, setBackImageIndex] = useState(1 % images.length);

  // Touch state for swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleNext = () => {
    if (images.length <= 1) return;
    if (!isFlipped) {
      setBackImageIndex((frontImageIndex + 1) % images.length);
      setIsFlipped(true);
    } else {
      setFrontImageIndex((backImageIndex + 1) % images.length);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (images.length <= 1) return;
    if (!isFlipped) {
      setBackImageIndex((frontImageIndex - 1 + images.length) % images.length);
      setIsFlipped(true);
    } else {
      setFrontImageIndex((backImageIndex - 1 + images.length) % images.length);
      setIsFlipped(false);
    }
  };

  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 28000);
    
    return () => clearInterval(interval);
  }, [images.length, frontImageIndex, backImageIndex, isFlipped]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) handleNext();
    else if (isRightSwipe) handlePrev();
  };



  const CardFace = ({ imageIndex, isBack = false }: { imageIndex: number; isBack?: boolean }) => (
    <div 
      className={`${isBack ? 'absolute inset-0' : 'relative'} w-full h-full bg-white rounded-xl shadow-sm flex flex-col isolate ring-1 ring-slate-100 hover:ring-brand-200 backface-hidden font-nunito ${isBack ? '[transform:rotateY(180deg)]' : ''}`}
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      {/* Main Card Link - Absolute Overlay */}
      <Link to={`/listing/${listing.id}`} className="absolute inset-0 z-[25] rounded-xl" aria-label={`View ${listing.title}`} />

      {/* Image Section */}
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100 rounded-t-xl group/image z-10">
        <ResponsiveImage 
          src={images[imageIndex]} 
          sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={`${listing.title}`}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          fallbackSrc={FALLBACK_IMAGE}
        />
        
        {/* Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-row flex-wrap gap-1 z-30 pointer-events-none drop-shadow-md">
           {listing.isVerified && (
             <div className="text-slate-700 flex items-center justify-center" title="Verified">
               <Icon name="shieldCheck" size={10} />
             </div>
           )}
           {listing.isPremium && (
             <div className="text-amber-600 flex items-center justify-center bg-amber-50 rounded-full p-0.5" title="Premium">
               <Icon name="award" size={10} />
             </div>
           )}
           <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">
             {listing.type}
           </span>
        </div>

        {/* Location Badge (Top Right) - Hidden on mobile, shown in footer instead */}
        <div className="absolute top-2 right-2 hidden sm:flex items-center gap-1 z-30 pointer-events-none drop-shadow-md bg-white/80 backdrop-blur-md px-1.5 py-0.5 rounded-md text-slate-700">
           <Icon name="mapPin" size={8} />
           <span className="text-[8px] font-bold line-clamp-1 max-w-[100px]">{listing.location}</span>
        </div>

        {/* Pagination Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1 h-1 rounded-full transition-all ${idx === imageIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-grow relative z-10 pointer-events-none">
         <div className="p-2 pb-1">
            <h3 className="text-[11px] font-bold text-slate-800 leading-snug mb-1.5 line-clamp-2">
               {generateListingTitle({ 
                 bedrooms: listing.bedrooms, 
                 propertyType: listing.propertyType
               })}
            </h3>

            <div className="grid grid-cols-4 gap-1.5 mb-3">
               {listing.bedrooms && (
                 <div className="flex items-center justify-start gap-1 h-7 w-full" title="Bedrooms">
                   <Icon name="bed" size={14} className="text-slate-500 shrink-0" />
                   <span className="text-[11px] font-bold text-slate-700 truncate">{listing.bedrooms}</span>
                 </div>
               )}
               {listing.bathrooms && (
                 <div className="flex items-center justify-start gap-1 h-7 w-full" title="Bathrooms">
                   <Icon name="bath" size={14} className="text-slate-500 shrink-0" />
                   <span className="text-[11px] font-bold text-slate-700 truncate">{listing.bathrooms}</span>
                 </div>
               )}
               {listing.parking && (
                 <div className="flex items-center justify-start gap-1 h-7 w-full" title="Parking Available">
                   <Icon name="parking" size={14} className="text-slate-500 shrink-0" />
                 </div>
               )}
               {listing.petsAllowed && (
                 <div className="flex items-center justify-start gap-1 h-7 w-full" title="Pets Allowed">
                   <Icon name="paw" size={14} className="text-slate-500 shrink-0" />
                 </div>
               )}
            </div>
         </div>

          <div className="mt-auto p-2 pt-1.5 flex items-center justify-between border-t border-slate-100 bg-slate-50/80 rounded-b-xl pointer-events-auto">
             <div className="flex flex-col gap-0.5">
               <div className="flex items-baseline gap-0.5 text-brand-600">
                 <span className="text-[11px] font-bold">{getSymbolFromCode(listing.currency || 'USD')}</span>
                 <span className="text-[11px] font-bold tracking-tight">{listing.price.toLocaleString()}</span>
               </div>
               {/* Mobile Location Tag */}
               <div className="flex items-center gap-1 text-slate-500 sm:hidden">
                 <Icon name="mapPin" size={8} />
                 <span className="text-[9px] font-medium truncate max-w-[120px]">{listing.location}</span>
               </div>
             </div>
             
             {isOwner ? (
               <Link 
                 to={`/post?edit=${listing.id}`}
                 className="p-1.5 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors z-30"
                 onClick={(e) => e.stopPropagation()}
               >
                 <Icon name="edit" size={12} />
               </Link>
             ) : (
               isBack && (
                 <div className="flex items-center gap-2">
                     <div className="relative group/avatar cursor-pointer z-30">
                       <div className="w-6 h-6 rounded-full border border-white shadow-sm overflow-hidden bg-slate-100">
                          <ResponsiveImage 
                            src={seller?.avatar || ''}
                            generateSrcSet={false}
                            alt="Seller" 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover" 
                            fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.name || 'User')}&background=random`}
                          />
                       </div>
                       {seller?.socials.phone && (
                         <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover/avatar:flex items-center gap-1 bg-white p-1 rounded-lg shadow-lg border border-slate-100 z-50">
                             <a href={`tel:${seller.socials.phone}`} className="w-6 h-6 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-100"><Icon name="phone" size={12} /></a>
                         </div>
                       )}
                     </div>
                 </div>
               )
             )}
          </div>
      </div>
    </div>
  );

  return (
    <div 
      className="group block select-none relative perspective-1000 font-nunito h-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ perspective: '1000px' }}
    >
      <motion.div 
        className="relative w-full h-full transition-all duration-500"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <CardFace imageIndex={frontImageIndex} />
        <CardFace imageIndex={backImageIndex} isBack />
      </motion.div>
    </div>
  );
};

export default ListingCard;
