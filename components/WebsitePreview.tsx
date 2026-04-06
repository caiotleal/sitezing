import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFormData, Palette } from '../types';
import { 
  Instagram, 
  MessageCircle,
  Menu,
  Sparkles,
  Loader2,
  Eye,
  Rocket,
  Home,
  X
} from 'lucide-react';

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

interface WebsitePreviewProps {
  data: SiteFormData;
  palette: Palette;
}

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ data, palette }) => {
  const [aiContent, setAiContent] = useState<{ headline: string; subheadline: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchAIContent = async () => {
      if (!data.businessName) return;
      setIsGenerating(true);

      try {
        const generateSite = httpsCallable(functions, 'generateSite');

        const result = await generateSite({
          businessName: data.businessName,
          description: data.description || data.targetAudience || '',
          region: data.address || 'Brasil',
        });

        const resData = result.data as any;
        setAiContent({
          headline: resData.heroTitle || "Título gerado por IA",
          subheadline: resData.heroSubtitle || "Subtítulo gerado por IA"
        });

      } catch (err: any) {
        console.error("Erro no preview:", err);
        setAiContent({
          headline: `Transforme sua experiência com ${data.businessName || 'sua empresa'}`,
          subheadline: "Não foi possível carregar IA agora. Continue editando e tente novamente."
        });
      } finally {
        setIsGenerating(false);
      }
    };

    const debounce = setTimeout(fetchAIContent, 2000);
    return () => clearTimeout(debounce);
  }, [data.businessName, data.targetAudience]);

  // FUNÇÃO DE PUBLICAR CORRIGIDA
  const handlePublish = async () => {
    if (!data.businessName) {
      alert("Preencha ao menos o nome da empresa para publicar.");
      return;
    }
    setIsPublishing(true);
    try {
      const generateSite = httpsCallable(functions, 'generateSite');
      const saveSiteProject = httpsCallable(functions, 'saveSiteProject');
      const publishUserProject = httpsCallable(functions, 'publishUserProject');

      // Gera o nome seguro e único para o subdomínio do Firebase
      const safeNameBase = data.businessName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `site-${Date.now()}`;
      const dominioInterno = `${safeNameBase}-${Math.floor(Math.random() * 10000)}`;

      const generation: any = await generateSite({
        businessName: data.businessName,
        description: data.description || data.targetAudience || '',
        region: data.address || 'Brasil',
      });

      const generatedData = generation.data || {};
      const saveResult: any = await saveSiteProject({
        businessName: data.businessName,
        internalDomain: dominioInterno,
        generatedHtml: generatedData.customTemplate || generatedData.generatedHtml || '',
        formData: data,
        aiContent: generatedData
      });

      const projectSlug = saveResult?.data?.projectSlug || dominioInterno;
      const publishResult: any = await publishUserProject({ projectSlug });
      const publishUrl = publishResult?.data?.publishUrl;

      if (publishUrl) {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.assign(publishUrl);
        } else {
          window.open(publishUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        alert("Site publicado, mas a URL final não foi retornada.");
      }
    } catch (err: any) {
      console.error("Erro ao publicar:", err);
      alert(err?.message || "Erro ao publicar o site. Verifique o console.");
    } finally {
      setIsPublishing(false);
    }
  };

  const businessName = data.businessName || 'Sua Empresa';
  const headline = aiContent?.headline || `Transforme sua experiência com ${businessName}!`;
  const subheadline = aiContent?.subheadline || 'A melhor escolha para quem busca qualidade e inovação.';

  return (
    <div 
      className="flex-1 flex flex-col transition-colors duration-500 relative min-h-[500px]" 
      style={{ backgroundColor: palette.bg, color: palette.text }}
    >
      <AnimatePresence>
        {(isGenerating || isPublishing) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg"
          >
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span className="text-[11px] font-bold text-white uppercase tracking-widest">
              {isPublishing ? 'Publicando Site Real...' : 'IA Pensando...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="px-4 md:px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: `${palette.primary}20` }}>
        <div className="font-bold text-lg tracking-tight" style={{ color: palette.primary }}>
          {businessName}
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          className="md:hidden p-2 rounded-xl border border-white/20 bg-black/20 text-white shadow-sm active:scale-95 transition-transform"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden absolute top-[74px] right-4 z-30 w-60 rounded-2xl border border-white/20 bg-black/85 backdrop-blur-md p-3 space-y-2"
          >
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors">
              Editar conteúdo
            </button>
            <button className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors">
              Alterar estilo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handlePublish();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ backgroundColor: palette.primary }}
            >
              Publicar agora
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-24 md:p-8 text-center max-w-4xl mx-auto w-full">
        <motion.div
          key={headline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6 inline-flex p-3 rounded-2xl bg-white/5 border border-white/10">
            <Sparkles className="w-6 h-6" style={{ color: palette.primary }} />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            {headline}
          </h2>
          
          <p className="text-lg md:text-xl opacity-80 mb-10 max-w-2xl mx-auto">
            {subheadline}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-8 py-4 rounded-full font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: palette.primary, color: '#fff' }}
            >
              {isPublishing ? 'Criando Link Real...' : 'Publicar Site Agora 🚀'}
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="p-8 border-t mt-auto" style={{ borderColor: `${palette.primary}10` }}>
        <div className="flex justify-between items-center text-xs opacity-50">
          <div>&copy; {new Date().getFullYear()} {businessName}.</div>
          <div className="flex gap-4">
            {data.whatsapp && <MessageCircle className="w-4 h-4 text-green-500" />}
            {data.instagram && <Instagram className="w-4 h-4" />}
          </div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur-xl px-4 py-2 safe-area-inset-bottom">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="h-12 rounded-xl text-white/80 flex flex-col items-center justify-center text-[11px] font-semibold active:scale-95">
            <Home className="w-4 h-4 mb-1" />
            Início
          </button>
          <button type="button" className="h-12 rounded-xl text-white/80 flex flex-col items-center justify-center text-[11px] font-semibold active:scale-95">
            <Eye className="w-4 h-4 mb-1" />
            Preview
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-12 rounded-xl text-white flex flex-col items-center justify-center text-[11px] font-bold disabled:opacity-60 active:scale-95"
            style={{ backgroundColor: palette.primary }}
          >
            <Rocket className="w-4 h-4 mb-1" />
            Publicar
          </button>
        </div>
      </nav>
    </div>
  );
};

export default WebsitePreview;
