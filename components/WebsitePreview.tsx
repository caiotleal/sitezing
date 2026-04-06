import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFormData, Palette } from '../types';
import { 
  Instagram, 
  MessageCircle,
  ChevronRight,
  Menu,
  Sparkles,
  Loader2
} from 'lucide-react';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

interface WebsitePreviewProps {
  data: SiteFormData;
  palette: Palette;
}

const WebsitePreview: React.FC<WebsitePreviewProps> = ({ data, palette }) => {
  const [aiContent, setAiContent] = useState<{ headline: string; subheadline: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchAIContent = async () => {
      if (!data.businessName || !data.targetAudience) return;
      setIsGenerating(true);

      try {
        const functions = getFunctions(getApp());
        const criarPublicarSite = httpsCallable(functions, 'criarPublicarSite');

        const result = await criarPublicarSite({
          prompt: `Gere apenas headline e subheadline para: Empresa ${data.businessName}, Público ${data.targetAudience}`,
          previewOnly: true
        });

        const resData = result.data as any;
        setAiContent({
          headline: resData.headline || "Título gerado por IA",
          subheadline: resData.subheadline || "Subtítulo gerado por IA"
        });

      } catch (err) {
        console.error("Erro no preview:", err);
      } finally {
        setIsGenerating(false);
      }
    };

    const debounce = setTimeout(fetchAIContent, 2000);
    return () => clearTimeout(debounce);
  }, [data.businessName, data.targetAudience]);

  // FUNÇÃO DE PUBLICAR CORRIGIDA
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const functions = getFunctions(getApp());
      const criarPublicarSite = httpsCallable(functions, 'criarPublicarSite');

      // Gera o nome seguro e único para o subdomínio do Firebase
      const safeName = data.businessName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-');
      const dominioInterno = `${safeName}-${Math.floor(Math.random() * 10000)}`;

      // Chama o back-end passando os dados necessários
      const result = await criarPublicarSite({
        prompt: `Crie um site completo para a empresa ${data.businessName}, focada em ${data.targetAudience}. Estilo: ${data.tone}`,
        nomeEmpresa: dominioInterno
      });

      // Recebe a resposta e abre o site
      const resData = result.data as any;
      if (resData && resData.url) {
        window.open(resData.url, '_blank');
      } else {
        alert("Site publicado, mas a URL não foi retornada pelo servidor.");
      }
    } catch (err) {
      console.error("Erro ao publicar:", err);
      alert("Erro ao publicar o site. Verifique o console.");
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

      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: `${palette.primary}20` }}>
        <div className="font-bold text-lg tracking-tight" style={{ color: palette.primary }}>
          {businessName}
        </div>
        <Menu className="w-5 h-5 md:hidden" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto w-full">
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
    </div>
  );
};

export default WebsitePreview;
