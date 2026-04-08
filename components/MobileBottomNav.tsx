import React, { useEffect, useRef } from 'react';
import { 
  CreditCard, 
  Edit3, 
  Globe, 
  LayoutDashboard, 
  Palette, 
  Instagram, 
  Rocket, 
  Phone,
  ChevronRight,
  User,
  LogOut,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

type MobileBottomNavProps = {
  isMobile: boolean;
  canPublish: boolean;
  isPublishing: boolean;
  isSavingProject: boolean;
  isMobileWizardOpen: boolean;
  activeMobileSheet: string | number | null;
  setIsMobileWizardOpen: (open: boolean) => void;
  setActiveMobileSheet: (id: string | number | null) => void;
  onPublish: () => void;
  onWarnMissingSite: () => void;
  generatedHtml: string | null;
  loggedUserEmail: string | null;
  onLogin: () => void;
  onLogout: () => void;
};

import { useState } from 'react';

export default function MobileBottomNav({
  isMobile,
  canPublish,
  isPublishing,
  isSavingProject,
  isMobileWizardOpen,
  activeMobileSheet,
  setIsMobileWizardOpen,
  setActiveMobileSheet,
  onPublish,
  onWarnMissingSite,
  generatedHtml,
  loggedUserEmail,
  onLogin,
  onLogout
}: MobileBottomNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    // Initial scroll hint animation
    if (isMobile && isMobileWizardOpen && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ left: 40, behavior: 'smooth' });
        setTimeout(() => {
          scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
        }, 600);
      }, 800);
    }
  }, [isMobile, isMobileWizardOpen]);

  if (!isMobile) return null;

  const categories = [
    { id: 'dashboard', title: 'Painel', icon: <LayoutDashboard size={14} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'visual', title: 'Visual', icon: <Palette size={14} />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'social', title: 'Redes', icon: <Instagram size={14} />, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'delivery', title: 'Delivery', icon: <Rocket size={14} />, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'contato', title: 'Contato', icon: <Phone size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'plano', title: 'Plano', icon: <CreditCard size={14} />, color: 'text-stone-600', bg: 'bg-stone-50' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[260] pointer-events-none pb-[max(12px,env(safe-area-inset-bottom))]">
      {/* Floating Toggle Button (When menu is hidden) */}
      {!isMobileWizardOpen && (
        <div className="flex justify-center mb-4">
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={() => setIsMobileWizardOpen(true)}
            className="pointer-events-auto bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            <Edit3 size={14} />
            Configurar Site
          </motion.button>
        </div>
      )}

      {/* Ribbon Navigation */}
      {isMobileWizardOpen && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="pointer-events-auto mx-4 bg-white/90 backdrop-blur-2xl rounded-[2rem] border border-stone-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden"
        >
          <div className="p-2 flex items-center">
            {/* Account Icon (Fixed Left) */}
            <div className="pr-2 mr-2 border-r border-stone-100 flex items-center shrink-0">
               <button 
                onClick={loggedUserEmail ? onLogout : onLogin}
                className={`p-3 rounded-xl transition-all active:scale-90 ${loggedUserEmail ? 'bg-stone-100 text-stone-900' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}
               >
                 {loggedUserEmail ? <LogOut size={16} /> : <User size={16} />}
               </button>
            </div>

            {/* Scroll Area */}
            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex-1 flex gap-2 overflow-x-auto scrollbar-hide px-2 py-1 mask-linear-right no-scrollbar select-none cursor-grab active:cursor-grabbing`}
            >
              {categories.map((c) => {
                const isActive = activeMobileSheet === c.id;
                const isDisabled = !generatedHtml && c.id !== 'dashboard' && c.id !== 'plano';
                
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (isDisabled) return;
                      setActiveMobileSheet(c.id);
                      setIsMobileWizardOpen(false); // Auto-hide on select
                    }}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all active:scale-95 ${isActive ? 'bg-stone-900 text-white shadow-lg' : `${c.bg} ${c.color} border border-transparent hover:border-stone-200`} ${isDisabled ? 'opacity-30 grayscale' : ''}`}
                  >
                    {c.icon}
                    <span className="text-[10px] font-black uppercase tracking-tight">{c.title}</span>
                  </button>
                );
              })}

              {/* Sequential Action: Save & Publish */}
              <button
                onClick={() => {
                   if (!canPublish) {
                     onWarnMissingSite();
                     return;
                   }
                   onPublish();
                }}
                disabled={isPublishing || isSavingProject}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 ml-2"
              >
                <Globe size={14} className={isPublishing ? 'animate-spin' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">Publicar Agora</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Preview/Hide Toggle (Fixed Right) */}
            <div className="pl-2 pr-1 border-l border-stone-100 flex items-center shrink-0">
               <button 
                onClick={() => setIsMobileWizardOpen(false)}
                className="p-3 text-stone-400 active:scale-90 hover:text-stone-600 transition-all font-bold flex flex-col items-center gap-0.5"
               >
                 <EyeOff size={18} />
                 <span className="text-[7px] uppercase font-black">Hide</span>
               </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
