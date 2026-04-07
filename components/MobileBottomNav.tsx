import React from 'react';
import { CreditCard, Edit3, Globe, Menu } from 'lucide-react';

type MobileBottomNavProps = {
  isMobile: boolean;
  canPublish: boolean;
  isPublishing: boolean;
  isSavingProject: boolean;
  isMobileWizardOpen: boolean;
  setIsMobileWizardOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setMobileActiveTab: React.Dispatch<React.SetStateAction<'editar' | 'plano'>>;
  onPublish: () => void;
  onWarnMissingSite: () => void;
};

export default function MobileBottomNav({
  isMobile,
  canPublish,
  isPublishing,
  isSavingProject,
  isMobileWizardOpen,
  setIsMobileWizardOpen,
  setMobileActiveTab,
  onPublish,
  onWarnMissingSite,
}: MobileBottomNavProps) {
  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[260] border-t border-stone-200 bg-white/90 backdrop-blur-xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] pointer-events-auto">
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => { setMobileActiveTab('editar'); setIsMobileWizardOpen(true); }}
          className="h-14 rounded-2xl flex flex-col items-center justify-center text-stone-600 active:scale-95 transition-all touch-manipulation relative z-20"
        >
          <Edit3 size={16} />
          <span className="text-[10px] font-bold mt-1">Editar</span>
        </button>
        <button
          onClick={() => { setMobileActiveTab('plano'); setIsMobileWizardOpen(true); }}
          className="h-14 rounded-2xl flex flex-col items-center justify-center text-stone-600 active:scale-95 transition-all touch-manipulation relative z-20"
        >
          <CreditCard size={16} />
          <span className="text-[10px] font-bold mt-1">Plano</span>
        </button>
        <button
          onClick={() => {
            if (!canPublish) {
              onWarnMissingSite();
              setIsMobileWizardOpen(true);
              setMobileActiveTab('editar');
              return;
            }
            onPublish();
          }}
          disabled={isPublishing || isSavingProject}
          className="h-14 rounded-2xl flex flex-col items-center justify-center text-emerald-700 bg-emerald-50 border border-emerald-200 disabled:opacity-50 active:scale-95 transition-all"
        >
          <Globe size={16} />
          <span className="text-[10px] font-black mt-1">Publicar</span>
        </button>
        <button
          onClick={() => setIsMobileWizardOpen((prev) => !prev)}
          className="h-14 rounded-2xl flex flex-col items-center justify-center text-stone-600 active:scale-95 transition-all"
        >
          <Menu size={16} />
          <span className="text-[10px] font-bold mt-1">{isMobileWizardOpen ? 'Preview' : 'Menu'}</span>
        </button>
      </div>
    </div>
  );
}
