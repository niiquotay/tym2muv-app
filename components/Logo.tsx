import React from 'react';
import { motion } from 'motion/react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center gap-1 sm:gap-2 group cursor-pointer ${className}`}>
    <div className="relative w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden rounded-lg">
      <motion.img 
        src="https://lh3.googleusercontent.com/d/1nXeWtvOyKeF8bk9Ph3Y6euvNKzLuSVV5" 
        alt="tym2muv logo" 
        className="w-full h-full object-contain"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          y: [0, -2, 0]
        }}
        whileHover={{
          scale: 1.12,
          rotate: -6,
          y: -4
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
          y: {
            repeat: Infinity,
            repeatType: "reverse",
            duration: 2.2,
            ease: "easeInOut"
          }
        }}
      />
    </div>
    <div className="flex flex-col justify-center">
      <span className="font-bold text-lg sm:text-2xl tracking-tight leading-none text-slate-800 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-600 group-hover:to-fuchsia-500 transition-all font-display">
        tym2muv
      </span>
    </div>
  </div>
);