import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutPanelLeft, Smartphone, Sparkles } from 'lucide-react';
import BusinessForm from './components/BusinessForm';
import WebsitePreview from './components/WebsitePreview';
import { SiteFormData } from './types';
import { PALETTES } from './constants';

type MobileTab = 'editor' | 'preview';

const INITIAL_FORM: SiteFormData = {
  businessName: '',
  segment: '',
  description: '',
  logoUrl: '',
  targetAudience: '',
  tone: 'Descontraído',
  whatsapp: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  paletteId: 'p1',
  layoutId: 'Simplicidade Pura',
  googlePlaceUrl: '',
  showReviews: false,
  address: '',
  phone: ''
};

const App: React.FC = () => {
  const [formData, setFormData] = useState<SiteFormData>(INITIAL_FORM);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');

  const selectedPalette = useMemo(
    () => PALETTES.find(p => p.id === formData.paletteId) || PALETTES[0],
    [formData.paletteId]
  );

  const handleFormChange = (name: keyof SiteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-[Inter]">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm md:text-lg font-black uppercase tracking-wide">SiteZing Studio</h1>
          <p className="text-[10px] md:text-xs text-zinc-400 font-medium">Editor mobile-first com preview em tempo real</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles size={14} /> Atualização instantânea
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-64px)]">
        <section className={`${mobileTab === 'editor' ? 'block' : 'hidden'} md:block p-4 md:p-6 border-r border-zinc-900 pb-24 md:pb-6`}>
          <BusinessForm data={formData} onChange={handleFormChange} />
        </section>

        <section className={`${mobileTab === 'preview' ? 'block' : 'hidden'} md:block p-0 md:p-6 pb-24 md:pb-6`}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full rounded-none md:rounded-2xl overflow-hidden border border-zinc-800">
            <WebsitePreview data={formData} palette={selectedPalette} />
          </motion.div>
        </section>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-4 py-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileTab === 'editor' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-300'}`}
          >
            <LayoutPanelLeft size={14} /> Editor
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileTab === 'preview' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-300'}`}
          >
            <Smartphone size={14} /> Preview
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
