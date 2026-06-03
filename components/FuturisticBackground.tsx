import React from 'react';

const FuturisticBackground: React.FC = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return null;

  const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4;
  if (isLowEnd) {
    return <div className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-br from-slate-50 to-brand-50" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] select-none bg-white">
      {/* Container for 3D perspective */}
      <div className="absolute inset-0" style={{ perspective: '1200px' }}>
        
        {/* --- EXISTING SHAPES (Refined for White/Purple Theme) --- */}

        {/* Shape 1: Floating Wireframe Cube (Top Right) */}
        <div className="absolute top-[10%] right-[5%] w-32 h-32 animate-float-slow opacity-30 md:opacity-40">
             <div className="relative w-full h-full animate-rotate-3d" style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 border-2 border-brand-400/40 bg-brand-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-[1px]" style={{ transform: 'translateZ(64px)' }}></div>
                <div className="absolute inset-0 border-2 border-brand-400/40 bg-brand-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-[1px]" style={{ transform: 'rotateY(180deg) translateZ(64px)' }}></div>
                <div className="absolute inset-0 border-2 border-brand-400/40 bg-brand-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-[1px]" style={{ transform: 'rotateY(90deg) translateZ(64px)' }}></div>
                <div className="absolute inset-0 border-2 border-brand-400/40 bg-brand-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-[1px]" style={{ transform: 'rotateY(-90deg) translateZ(64px)' }}></div>
                <div className="absolute inset-0 border-2 border-brand-400/40 bg-brand-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-[1px]" style={{ transform: 'rotateX(90deg) translateZ(64px)' }}></div>
                <div className="absolute inset-0 border-2 border-brand-400/40 bg-brand-500/5 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-[1px]" style={{ transform: 'rotateX(-90deg) translateZ(64px)' }}></div>
             </div>
        </div>

        {/* Shape 2: Gyroscope / Atom rings (Bottom Left) */}
        <div className="absolute bottom-[20%] left-[5%] w-64 h-64 animate-float-medium opacity-20">
             <div className="relative w-full h-full animate-rotate-3d-reverse" style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 rounded-full border border-purple-300/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]" style={{ transform: 'rotateX(70deg)' }}></div>
                <div className="absolute inset-0 rounded-full border border-purple-300/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]" style={{ transform: 'rotateY(70deg)' }}></div>
                <div className="absolute inset-0 rounded-full border border-purple-300/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]" style={{ transform: 'rotateX(70deg) rotateY(70deg)' }}></div>
                <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-brand-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-sm animate-pulse"></div>
             </div>
        </div>
        
        {/* Shape 3: Floating Grid Plane (Bottom) */}
         <div className="absolute bottom-[-10%] left-[-20%] right-[-20%] h-96 opacity-10 pointer-events-none" style={{ transform: 'perspective(500px) rotateX(60deg)' }}>
            <div className="w-full h-full bg-[linear-gradient(to_right,#9333ea15_1px,transparent_1px),linear-gradient(to_bottom,#9333ea15_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
         </div>

         {/* Shape 4: Floating Prism/Pyramid (Top Left) */}
         <div className="absolute top-[15%] left-[15%] w-24 h-24 animate-float-fast opacity-20">
             <div className="relative w-full h-full animate-rotate-complex" style={{ transformStyle: 'preserve-3d' }}>
                 <div className="absolute top-0 left-0 border-l-[50px] border-r-[50px] border-b-[86px] border-l-transparent border-r-transparent border-b-fuchsia-400/20" style={{ transform: 'rotateY(0deg) translateZ(28px) rotateX(30deg)', transformOrigin: '50% 100%' }}></div>
                 <div className="absolute top-0 left-0 border-l-[50px] border-r-[50px] border-b-[86px] border-l-transparent border-r-transparent border-b-fuchsia-400/20" style={{ transform: 'rotateY(120deg) translateZ(28px) rotateX(30deg)', transformOrigin: '50% 100%' }}></div>
                 <div className="absolute top-0 left-0 border-l-[50px] border-r-[50px] border-b-[86px] border-l-transparent border-r-transparent border-b-fuchsia-400/20" style={{ transform: 'rotateY(240deg) translateZ(28px) rotateX(30deg)', transformOrigin: '50% 100%' }}></div>
             </div>
         </div>

        {/* Shape 5: Left Side Cyber Crystal (Fills Left Area) */}
        <div className="absolute top-[35%] left-[2%] w-32 h-32 md:w-48 md:h-48 animate-float-slow opacity-20 hidden md:block">
           <div className="relative w-full h-full animate-rotate-complex-reverse" style={{ transformStyle: 'preserve-3d' }}>
               {/* Multiple intersecting planes */}
               {[0, 60, 120].map((deg) => (
                 <div key={deg} className="absolute inset-0 border border-brand-300/30 bg-brand-500/5 shadow-[0_0_10px_rgba(147,51,234,0.1)]" style={{ transform: `rotateY(${deg}deg) rotateX(45deg)` }}></div>
               ))}
               <div className="absolute inset-[25%] border border-white/40 rounded-full animate-pulse bg-brand-400/10"></div>
           </div>
        </div>

        {/* Shape 6: Right Side Vertical Data Spiral (Fills Right Area) */}
        <div className="absolute top-[30%] right-[3%] w-24 h-80 opacity-20 hidden md:block">
            <div className="relative w-full h-full flex flex-col justify-around items-center perspective-500">
               {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-16 h-16 border border-fuchsia-400/30 rounded-lg animate-spin-slow bg-fuchsia-500/5 shadow-[0_0_15px_rgba(236,72,153,0.1)]" 
                       style={{ 
                           animationDelay: `${i * -2}s`, 
                           transform: `rotateX(${i * 25}deg) rotateY(${i * 15}deg)` 
                       }}>
                  </div>
               ))}
            </div>
        </div>

        {/* Shape 8: Top Center Data Cloud */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-64 h-32 opacity-20 pointer-events-none">
             {[...Array(6)].map((_, i) => (
                <div key={i} 
                     className="absolute border border-purple-200/50 bg-white/40 backdrop-blur-[1px] animate-float-variable"
                     style={{
                         width: Math.random() * 40 + 20 + 'px',
                         height: Math.random() * 30 + 10 + 'px',
                         left: Math.random() * 100 + '%',
                         top: Math.random() * 100 + '%',
                         animationDuration: Math.random() * 5 + 10 + 's',
                         transform: `translateZ(${Math.random() * 50}px)`
                     }}
                ></div>
             ))}
        </div>

        {/* Side Data Highways */}
        <div className="absolute top-0 bottom-0 left-[6%] w-px bg-gradient-to-b from-transparent via-brand-300/20 to-transparent"></div>
        <div className="absolute top-[-20%] left-[6%] w-[2px] h-32 bg-brand-400/30 blur-[2px] animate-data-stream"></div>

        <div className="absolute top-0 bottom-0 right-[6%] w-px bg-gradient-to-b from-transparent via-fuchsia-300/20 to-transparent"></div>
        <div className="absolute top-[-20%] right-[6%] w-[2px] h-32 bg-fuchsia-400/30 blur-[2px] animate-data-stream" style={{ animationDelay: '1.5s' }}></div>


        {/* Particle Stream: Left Side (Purple) */}
        <div className="absolute top-0 bottom-0 left-0 w-32 md:w-48 overflow-hidden pointer-events-none">
           {[...Array(15)].map((_, i) => (
              <div key={`pl-${i}`} 
                   className="absolute rounded-full blur-[2px] animate-rise bg-brand-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                   style={{
                       width: Math.random() * 4 + 2 + 'px',
                       height: Math.random() * 4 + 2 + 'px',
                       left: Math.random() * 80 + 10 + '%',
                       bottom: '-20px', 
                       opacity: 0,
                       animationDuration: Math.random() * 10 + 10 + 's',
                       animationDelay: Math.random() * -20 + 's' 
                   }}
              ></div>
           ))}
        </div>

        {/* Particle Stream: Right Side (Fuchsia) */}
        <div className="absolute top-0 bottom-0 right-0 w-32 md:w-48 overflow-hidden pointer-events-none">
           {[...Array(15)].map((_, i) => (
              <div key={`pr-${i}`} 
                   className="absolute rounded-full blur-[2px] animate-rise bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.5)]"
                   style={{
                       width: Math.random() * 4 + 2 + 'px',
                       height: Math.random() * 4 + 2 + 'px',
                       left: Math.random() * 80 + 10 + '%',
                       bottom: '-20px', 
                       opacity: 0,
                       animationDuration: Math.random() * 10 + 10 + 's',
                       animationDelay: Math.random() * -20 + 's'
                   }}
              ></div>
           ))}
        </div>
        
        {/* Floating Particles Center Field */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
                <div key={`pc-${i}`}
                    className="absolute bg-brand-500/10 rounded-full animate-float-variable"
                    style={{
                        width: Math.random() * 4 + 1 + 'px',
                        height: Math.random() * 4 + 1 + 'px',
                        left: Math.random() * 100 + '%',
                        top: Math.random() * 100 + '%',
                        opacity: Math.random() * 0.3 + 0.1,
                        animationDuration: Math.random() * 20 + 20 + 's',
                    }}
                ></div>
            ))}
        </div>

      </div>
      
      <style>{`
        @keyframes rotate-3d {
          0% { transform: rotateX(0deg) rotateY(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg); }
        }
        @keyframes rotate-3d-reverse {
            0% { transform: rotateX(0deg) rotateY(0deg); }
            100% { transform: rotateX(-360deg) rotateY(-360deg); }
        }
        @keyframes rotate-complex {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            100% { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
        }
        @keyframes rotate-complex-reverse {
            0% { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
            100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-40px) translateX(20px); }
        }
        @keyframes float-medium {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-60px) translateX(-30px); }
        }
        @keyframes float-fast {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(30px) translateX(-40px); }
        }
        @keyframes float-variable {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-20px) translateX(15px); }
            50% { transform: translateY(10px) translateX(-10px); }
            75% { transform: translateY(-15px) translateX(-20px); }
        }
        @keyframes rise {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 0.6; }
            50% { opacity: 0.8; }
            90% { opacity: 0.6; }
            100% { transform: translateY(-110vh); opacity: 0; }
        }
        @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
            0% { transform: rotate(0deg) rotateX(20deg); }
            100% { transform: rotate(-360deg) rotateX(20deg); }
        }
        @keyframes data-stream {
            0% { top: -20%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 120%; opacity: 0; }
        }
        .animate-rotate-3d { animation: rotate-3d 20s linear infinite; will-change: transform; }
        .animate-rotate-3d-reverse { animation: rotate-3d-reverse 25s linear infinite; will-change: transform; }
        .animate-rotate-complex { animation: rotate-complex 15s linear infinite; will-change: transform; }
        .animate-rotate-complex-reverse { animation: rotate-complex-reverse 20s linear infinite; will-change: transform; }
        .animate-float-slow { animation: float-slow 15s ease-in-out infinite; will-change: transform; }
        .animate-float-medium { animation: float-medium 18s ease-in-out infinite; will-change: transform; }
        .animate-float-fast { animation: float-fast 12s ease-in-out infinite; will-change: transform; }
        .animate-float-variable { animation: float-variable 25s ease-in-out infinite; will-change: transform; }
        .animate-rise { animation: rise linear infinite; will-change: transform, opacity; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; will-change: transform; }
        .animate-spin-reverse-slow { animation: spin-reverse-slow 15s linear infinite; will-change: transform; }
        .animate-data-stream { animation: data-stream 3s linear infinite; will-change: top, opacity; }
      `}</style>
    </div>
  );
};

export default FuturisticBackground;