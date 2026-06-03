
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import { trackAdClick, trackAdImpression } from '../services/supabaseService';

interface AdCardProps {
  id?: string;
  type: 'standard' | 'tall' | 'card' | 'banner' | 'popup';
  title: string;
  description: string;
  cta: string;
  image: string;
  color?: string;
  link?: string;
  className?: string;
}

const AdCard: React.FC<AdCardProps> = ({ id, type, title, description, cta, image, color = 'from-brand-600 to-fuchsia-600', link, className = '' }) => {
  const isTall = type === 'tall';

  useEffect(() => {
    if (id) {
      trackAdImpression(id).catch((err) => console.warn('Impression log failed', err));
    }
  }, [id]);

  const handleClick = (e: React.MouseEvent) => {
    if (id) {
      trackAdClick(id).catch((err) => console.warn('Click log failed', err));
    }
  };

  const CardBody = (
    <>
      {/* Background Image with Overlay */}
      <div className={`absolute inset-0 z-0`}>
        <img 
          src={image || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E'} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-80 mix-blend-multiply`}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-3 sm:p-4 mt-auto flex flex-col h-full justify-end">
        <div className="mb-1 sm:mb-2 flex justify-between items-center w-full">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider border border-white/30">
            <Icon name="star" size={10} className="fill-white" />
            Sponsored
          </span>
        </div>
        
        <h3 className={`font-black text-white leading-tight mb-1 sm:mb-2 ${isTall ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'}`}>
          {title}
        </h3>
        
        <p className="text-white/80 text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2 mb-3 sm:mb-4">
          {description}
        </p>
        
        <span className="w-full py-1.5 sm:py-2 bg-white text-slate-900 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-brand-50 transition-colors flex items-center justify-center gap-2 group/btn">
          {cta}
          <Icon name="chevronRight" size={14} className="sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-1" />
        </span>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-2 right-2 z-10 font-sans text-[9px] font-semibold text-white/50 pointer-events-none">
        AD
      </div>
    </>
  );

  const containerClasses = `relative overflow-hidden rounded-2xl flex flex-col ${isTall ? 'row-span-2 h-full' : 'min-h-[160px] sm:h-full'} group shadow-sm border border-slate-100 cursor-pointer block w-full text-left ${className}`;

  if (link) {
    return (
      <motion.a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        whileHover={{ y: -5 }}
        className={containerClasses}
      >
        {CardBody}
      </motion.a>
    );
  }

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -5 }}
      className={containerClasses}
    >
      {CardBody}
    </motion.div>
  );
};

export default AdCard;
