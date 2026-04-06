import React, { useMemo, useState } from 'react';
import { Home, Eye, Send, Menu, X, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from './firebase';
import { PALETTES } from './constants';
import { SiteFormData } from './types';
import BusinessForm from './components/BusinessForm';
import WebsitePreview from './components/WebsitePreview';
import LoginPage from './components/LoginPage';

const initialData: SiteFormData = {
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
  layoutId: 'layout_modern_center',
};

type MobileTab = 'edit' | 'preview' | 'publish';

const App: React.FC = () => {
  const [formData, setFormData] = useState<SiteFormData>(initialData);
  const [activeTab, setActiveTab] = useState<MobileTab>('edit');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const selectedPalette = useMemo(
    () => PALETTES.find((palette) => palette.id === formData.paletteId) || PALETTES[0],
    [formData.paletteId]
  );

  const updateField = (name: keyof SiteFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitAuth = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsLoginOpen(false);
    } catch {
      await createUserWithEmailAndPassword(auth, email, pass);
      setIsLoginOpen(false);
    }
  };

  const handlePublish = async () => {
    if (!auth.currentUser) {
      setIsLoginOpen(true);
      return;
    }

    setIsPublishing(true);
    try {
      const createSiteProject = httpsCallable(functions, 'createSiteProject');
      const publishUserProject = httpsCallable(functions, 'publishUserProject');

      const createRes: any = await createSiteProject({
        businessName: formData.businessName,
        generatedHtml: '<div>Gerando...</div>',
        formData,
        aiContent: {
          headline: `Conheça ${formData.businessName || 'nosso negócio'}`,
          subheadline: formData.description || 'Site gerado com SiteZing',
        },
      });

      const projectSlug = createRes?.data?.projectSlug;
      if (!projectSlug) {
        throw new Error('Não foi possível criar o projeto para publicação.');
      }

      const publishRes: any = await publishUserProject({ projectSlug });
      const url = publishRes?.data?.publishUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error: any) {
      alert(error?.message || 'Falha ao publicar no mobile.');
    } finally {
      setIsPublishing(false);
    }
  };

  const tabButton = (tab: MobileTab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-black uppercase tracking-wide ${activeTab === tab ? 'text-orange-600' : 'text-stone-500'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="sticky top-0 z-40 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur px-4 py-3 flex items-center justify-between">
        <h1 className="font-black text-sm uppercase tracking-wide">SiteZing Builder</h1>
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-lg border border-zinc-700 text-white"
          aria-label="Abrir menu"
        >
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {isMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-900 px-4 py-3 space-y-2">
          <button onClick={() => { setActiveTab('edit'); setIsMenuOpen(false); }} className="w-full text-left py-2 text-sm font-bold">Editar</button>
          <button onClick={() => { setActiveTab('preview'); setIsMenuOpen(false); }} className="w-full text-left py-2 text-sm font-bold">Preview</button>
          <button onClick={() => { setActiveTab('publish'); setIsMenuOpen(false); }} className="w-full text-left py-2 text-sm font-bold">Publicar</button>
        </div>
      )}

      <main className="flex-1 pb-24 md:pb-6">
        <div className="hidden md:grid md:grid-cols-2 gap-6 p-6">
          <BusinessForm data={formData} onChange={updateField} />
          <WebsitePreview data={formData} palette={selectedPalette} />
        </div>

        <div className="md:hidden p-4">
          {activeTab === 'edit' && <BusinessForm data={formData} onChange={updateField} />}
          {activeTab === 'preview' && <WebsitePreview data={formData} palette={selectedPalette} />}
          {activeTab === 'publish' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-black uppercase">Publicação mobile</h2>
              <p className="text-xs text-zinc-400">Publique com um toque. Se não estiver logado, será solicitado login.</p>
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wide rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />} Publicar agora
              </button>
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur flex">
        {tabButton('edit', 'Editar', <Home size={18} />)}
        {tabButton('preview', 'Preview', <Eye size={18} />)}
        {tabButton('publish', 'Publicar', <Send size={18} />)}
      </nav>

      <LoginPage isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSubmit={onSubmitAuth} />
    </div>
  );
};

export default App;
