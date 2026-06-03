import React, { useRef, useState, useEffect } from 'react';
import { getOptimizedImageUrl } from '../utils/imageOptimization';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  fallbackSrc?: string;
  generateSrcSet?: boolean;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({ 
  src, 
  fallbackSrc, 
  generateSrcSet = true, 
  className,
  ...props 
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Intersection Observer for lazy loading
    let observer: IntersectionObserver;
    
    if (imgRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              // Stop observing once loaded
              if (imgRef.current) {
                observer.unobserve(imgRef.current);
              }
            }
          });
        },
        { rootMargin: '100px' } // Load slightly before it comes into view
      );
      
      observer.observe(imgRef.current);
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  const fallbackUri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3C/svg%3E";
  const targetSrc = src || fallbackSrc || fallbackUri;
  const optimizedSrc = isVisible ? (getOptimizedImageUrl(targetSrc, { width: 800 }) || targetSrc) : fallbackUri;
  const srcSet = (isVisible && generateSrcSet && src) 
    ? `${getOptimizedImageUrl(src, { width: 400 })} 400w, ${getOptimizedImageUrl(src, { width: 800 })} 800w, ${getOptimizedImageUrl(src, { width: 1200 })} 1200w` 
    : undefined;

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      srcSet={srcSet || undefined}
      className={`${className} ${!isVisible ? 'bg-slate-200 animate-pulse' : ''}`}
      onError={(e) => {
        if (fallbackSrc) {
          (e.target as HTMLImageElement).src = fallbackSrc;
        }
      }}
      loading="lazy"
      {...props}
    />
  );
};

export default ResponsiveImage;
