
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { Link } from 'react-router-dom';

const InteractiveAdBanner: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  const handleClaim = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsClaimed(true);
    // In a real app, this would trigger a modal or redirect
    setTimeout(() => setIsClaimed(false), 3000);
  };

  return (
    <div className="container mx-auto px-4 pt-2 pb-2">
      <motion.div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white p-1 group cursor-pointer shadow-2xl shadow-brand-500/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Dynamic Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-fuchsia-600 to-brand-600 bg-[length:200%_100%] animate-scroll opacity-30 group-hover:opacity-60 transition-opacity duration-700"></div>
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Glass Content Container */}
        <div className="relative z-10 bg-slate-950/90 backdrop-blur-2xl rounded-[1.8rem] sm:rounded-[2.3rem] px-4 sm:px-6 py-3 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 border border-white/10 overflow-hidden">
          
          {/* Left Side: Value Proposition */}
          <div className="flex items-center gap-4 sm:gap-6">
            <motion.div 
              className="relative shrink-0"
              animate={isHovered ? { rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-brand-500 blur-2xl opacity-40 animate-pulse"></div>
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-brand-500/30 relative z-10 border border-white/20">
                <Icon name="zap" size={20} className="sm:w-8 sm:h-8 text-white" />
              </div>
              
              {/* Floating Mini Icons */}
              <AnimatePresence>
                {isHovered && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1, x: -15, y: -15 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-0 left-0 text-fuchsia-400"
                    >
                      <Icon name="star" size={12} />
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1, x: 15, y: 15 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute bottom-0 right-0 text-brand-400"
                    >
                      <Icon name="trendingUp" size={12} />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
            
            <div className="text-left">
              <div className="flex items-center justify-start gap-2 mb-0.5 sm:mb-1">
                <span className="px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-brand-500/30">
                  Premium Boost
                </span>
                <span className="w-0.5 h-0.5 rounded-full bg-slate-700"></span>
                <span className="text-fuchsia-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Limited Offer</span>
              </div>
              <h3 className="text-base sm:text-xl md:text-2xl font-black tracking-tighter leading-none">
                SELL <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-fuchsia-400">10X FASTER</span> TODAY
              </h3>
              <p className="hidden sm:block text-slate-400 text-xs font-medium mt-2 max-w-md">
                Join 5,000+ top sellers using our professional spotlight to reach verified buyers instantly.
              </p>
            </div>
          </div>

          {/* Right Side: Interactive Action */}
          <div className="flex flex-row items-center justify-between md:justify-end gap-4 w-full md:w-auto">
            <div className="flex flex-col items-start md:items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 line-through text-[10px] sm:text-xs font-bold">$29.99</span>
                <span className="text-white font-black text-sm sm:text-lg">$14.99</span>
              </div>
              <span className="text-brand-400 font-bold text-[8px] sm:text-[10px] uppercase tracking-widest animate-pulse">Save 50% Now</span>
            </div>
            
            <Link 
              to="/post"
              onClick={handleClaim}
              className={`relative group/btn overflow-hidden px-4 sm:px-10 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all shadow-2xl flex items-center justify-center gap-2 sm:gap-3 active:scale-95 ${
                isClaimed 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white text-slate-950 hover:bg-brand-50'
              }`}
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:animate-shine"></div>
              
              <AnimatePresence mode="wait">
                {isClaimed ? (
                  <motion.div 
                    key="success"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Icon name="check" size={18} />
                    COUPON APPLIED
                  </motion.div>
                ) : (
                  <motion.div 
                    key="default"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    BOOST NOW
                    <Icon name="chevronRight" size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-600/20 rounded-full blur-[80px] group-hover:bg-brand-600/30 transition-colors"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[80px] group-hover:bg-fuchsia-600/30 transition-colors"></div>
      </motion.div>
    </div>
  );
};

export default InteractiveAdBanner;
