import React from 'react';
import { Link } from 'react-router-dom';

const AdBanner: React.FC = () => {
  return (
    <section className="py-4 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-fuchsia-600 text-white shadow-xl">
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-black/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-2xl"></div>
           
           <div className="relative z-10 px-6 py-3 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="max-w-xl">
                <div className="inline-block bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide mb-1 border border-white/20">
                  Premium Feature
                </div>
                <h2 className="text-xl md:text-2xl font-bold mb-1 leading-tight">Advertise your business here</h2>
                <p className="text-purple-100 text-xs md:text-sm leading-relaxed">
                  Reach thousands of potential customers daily. Boost your visibility with our premium placement options.
                </p>
             </div>
             <Link to="/post" className="bg-white/90 backdrop-blur text-brand-700 px-5 py-2.5 rounded-xl font-bold hover:bg-white transition-colors shadow-lg whitespace-nowrap transform hover:-translate-y-0.5 text-sm md:text-base">
                Start Now
             </Link>
           </div>
        </div>
      </div>
    </section>
  );
};

export default AdBanner;