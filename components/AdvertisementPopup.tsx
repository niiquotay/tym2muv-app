import React, { useState, useEffect } from 'react';
import Icon from './Icon';

const ADS = [
  {
    id: 1,
    title: "Protect Your Home Today",
    description: "Get comprehensive home insurance starting at just $15/month. Instant quotes available now.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80",
    cta: "Get Quote",
    sponsor: "SafeGuard Insurance",
    color: "from-blue-600 to-cyan-500"
  },
  {
    id: 2,
    title: "Upgrade Your Ride",
    description: "0% APR financing on select EV models this month only. Experience the future of driving.",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80",
    cta: "View Offers",
    sponsor: "City Motors",
    color: "from-red-600 to-orange-500"
  },
  {
    id: 3,
    title: "Learn Full Stack Dev",
    description: "Master React, Node, and modern development with our specialized bootcamp. 50% off for early birds.",
    image: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=600&q=80",
    cta: "Start Learning",
    sponsor: "DevAcademy",
    color: "from-violet-600 to-fuchsia-500"
  },
  {
    id: 4,
    title: "Dream Vacation Deals",
    description: "All-inclusive packages to Bali starting at $999. Book now and get a free spa day.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
    cta: "Book Now",
    sponsor: "Wanderlust Travel",
    color: "from-teal-500 to-emerald-500"
  }
];

const AdvertisementPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [ad, setAd] = useState(ADS[0]);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Select a random ad on mount
    setAd(ADS[Math.floor(Math.random() * ADS.length)]);

    // Trigger every 8 minutes (continuous cycle)
    const interval = setInterval(() => {
      setAd(ADS[Math.floor(Math.random() * ADS.length)]);
      setIsClosing(false); // Reset closing animation state
      setIsVisible(true);
    }, 480000); // 8 minutes = 480,000 ms

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => setIsVisible(false), 300); // Wait for animation
  };

  const handleCtaClick = () => {
    // Simulate navigation or tracking
    console.log(`Clicked ad: ${ad.title}`);
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>

      {/* Card */}
      <div className={`relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-500 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0 animate-slide-up'}`}>
        
        {/* Ad Image */}
        <div className="relative h-48 sm:h-56">
          <img src={ad.image} alt={ad.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t ${ad.color} opacity-40 mix-blend-multiply`}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          
          {/* Close Button */}
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Advertisement • {ad.sponsor}</p>
          <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight font-display">{ad.title}</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">
            {ad.description}
          </p>

          <button 
            onClick={handleCtaClick}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r ${ad.color}`}
          >
            {ad.cta} <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementPopup;