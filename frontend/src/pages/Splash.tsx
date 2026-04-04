import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Splash: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="relative h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2C1810] to-[#3E2723] selection:bg-secondary-container selection:text-on-secondary-container overflow-hidden font-manrope">
      {/* Subtle Ambient Background Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <img 
          alt="Coffee Texture" 
          className="w-full h-full object-cover grayscale" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdpua7_oNrmG2IxO6QD4sTk-K01z9NktpFMAvYyfIpUn8-Ogm57vuhvnDrKfRl2JGJ2iRD5KE_bJ3-BOOlu4IE9porFJfl6U5a6OIW-9IZHhLORtyZkZSpFy258T0xq0yqn68rsb_nYi__aok4akw6vijxFKvS9RglTwdTuSfEx_Ppo8ieIrqIWk5goxv1yI_GsBwFbOfUsYJVt-hZA4ZyqEWWOXvtRdL4zI5rwmh2jun49plUtKodD677uHluJMKS14UBMk-Y80zM"
        />
      </div>

      {/* Logo Content Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Centered Logo Icon */}
        <motion.div 
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8"
        >
          <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-tr from-[#271310] to-[#3e2723] shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
            <div className="relative flex flex-col items-center text-[#fed65b]">
              <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
              <div className="absolute -bottom-1 -right-1 bg-[#735c00] text-white rounded-lg p-1.5 shadow-lg flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Brand Typography */}
        <div className="text-center space-y-2">
          <h1 className="font-black text-6xl tracking-tighter text-[#fed65b] uppercase">
            Caffino
          </h1>
          <p className="text-[#fff1ea] text-lg tracking-widest uppercase font-medium opacity-80">
            Smart Cafe Management
          </p>
          <div className="pt-4">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fed65b] mr-2"></span>
              <span className="text-[#ffdcc6] text-xs font-bold tracking-widest uppercase">Complete POS Solution</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Call to Action */}
      <div className="absolute bottom-20 left-0 w-full flex flex-col items-center justify-center z-20">
        <button 
          onClick={() => navigate('/login')}
          className="group flex flex-col items-center gap-4 transition-all duration-500 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
        >
          <motion.div 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-[#ffdcc6] font-bold text-sm tracking-[0.3em] uppercase opacity-60"
          >
            TAP TO CONTINUE
          </motion.div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-white/5 backdrop-blur-md transition-all group-hover:border-[#fed65b]/50 group-hover:bg-white/10">
            <span className="material-symbols-outlined text-[#ffdcc6] group-hover:text-[#fed65b] transition-colors">expand_more</span>
          </div>
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#735c00]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#ffdad4]/5 rounded-full blur-[80px] pointer-events-none"></div>
    </main>
  );
};

export default Splash;
