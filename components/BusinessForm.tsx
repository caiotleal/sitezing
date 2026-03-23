import React from 'react';
import { motion } from 'framer-motion';
import { SiteFormData, ToneOfVoice } from '../types';
import { 
  Building2, Users2, MessageCircle, Instagram, Facebook, Linkedin,
  FileText, ImagePlus, LayoutTemplate, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

interface BusinessFormProps {
  data: SiteFormData;
  onChange: (name: keyof SiteFormData, value: string) => void;
}

const BusinessForm: React.FC<BusinessFormProps> = ({ data, onChange }) => {
  const inputClass = "w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600 text-white";
  const labelClass = "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1";

  const [domainStatus, setDomainStatus] = React.useState<{ loading: boolean; available?: boolean; slug?: string; alternatives?: string[] }>({ loading: false });
  const checkTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (data.businessName && data.businessName.length >= 3) {
      checkAvailability(data.businessName);
    }
  }, []);

  const checkAvailability = (val: string) => {
    if (val.length < 3) {
      setDomainStatus({ loading: false });
      return;
    }
    setDomainStatus({ loading: true });
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    checkTimeout.current = setTimeout(async () => {
      try {
        const checkFn = httpsCallable(functions, 'checkDomainAvailability');
        const res: any = await checkFn({ projectSlug: val });
        if (res.data?.available) {
          setDomainStatus({ loading: false, available: true, slug: res.data.checkedSlug });
        } else if (res.data && res.data.available === false) {
          const slug = res.data.checkedSlug || val.toLowerCase().replace(/[^a-z0-9]/g, '');
          setDomainStatus({ 
            loading: false, available: false, slug, 
            alternatives: [`${slug}-br`, `${slug}-oficial`, `site-${slug}`]
          });
        }
      } catch (e) {
        setDomainStatus({ loading: false });
      }
    }, 800);
  };

  const handleNameChange = (val: string) => {
    onChange('businessName', val);
    checkAvailability(val);
  };

  // A Lógica de Pré-seleção Inteligente
  const handleSegmentChange = (segmento: string) => {
    onChange('segment', segmento);

    // Mapa de Sugestões (O "Cérebro" do UX)
    const sugestoes: Record<string, { layout: string, paleta: string }> = {
      'Advocacia':   { layout: 'Autoridade Máxima', paleta: 'p4' }, // Azul Oceano
      'Tecnologia':  { layout: 'Tecnologia & Inovação', paleta: 'p1' }, // Azul Tech
      'Saúde':       { layout: 'Nossos Serviços', paleta: 'p3' }, // Verde Fresh
      'Restaurante': { layout: 'Vitrine de Destaque', paleta: 'p5' }, // Pôr do Sol
      'Estética':    { layout: 'Simplicidade Pura', paleta: 'p6' }, // Rosa Algodão
      'Imobiliária': { layout: 'Painel Moderno', paleta: 'p7' }, // Cinza Urbano
      'Educação':    { layout: 'Nossa Jornada', paleta: 'p8' }, // Roxo Galáxia
      'Vendas':      { layout: 'Foco em Vendas', paleta: 'p2' }, // Preto e Ouro
      'Serviços':    { layout: 'Nossos Serviços', paleta: 'p7' }, 
      'Outros':      { layout: 'Simplicidade Pura', paleta: 'p1' }
    };

    const config = sugestoes[segmento];
    if (config) {
      onChange('layoutId', config.layout);
      onChange('paletteId', config.paleta);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Nome da Empresa */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <label className={labelClass}>Nome da Empresa</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input 
            type="text" 
            placeholder="Ex: Consultoria Silva"
            className={`${inputClass} pl-10`}
            value={data.businessName}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        {/* DOMAIN CHECKER FEEDBACK */}
        <div className="mt-2 text-xs">
          {domainStatus.loading && (
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Verificando domínio...
            </div>
          )}
          {!domainStatus.loading && domainStatus.available && domainStatus.slug && (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" /> Site disponível: {domainStatus.slug}.sitezing.com.br
            </div>
          )}
          {!domainStatus.loading && domainStatus.available === false && (
             <div className="space-y-1.5 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
               <div className="flex items-center gap-1.5 text-red-400">
                 <AlertCircle className="w-3.5 h-3.5" /> Nome já em uso por outro cliente.
               </div>
               <div className="text-zinc-500 text-[10px] pl-5">Sugestões de variação (basta clicar):</div>
               <div className="flex flex-wrap gap-1.5 pl-5">
                 {domainStatus.alternatives?.map(alt => (
                   <button type="button" key={alt} onClick={() => handleNameChange(alt)} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[10px] rounded-md border border-zinc-700 transition-colors text-white">
                     {alt}
                   </button>
                 ))}
               </div>
             </div>
          )}
        </div>
      </motion.div>

      {/* 2. Segmento (Com Inteligência) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <label className={labelClass}>Qual o seu Ramo?</label>
        <div className="relative">
          <LayoutTemplate className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <select 
            className={`${inputClass} pl-10 appearance-none cursor-pointer`}
            value={data.segment}
            onChange={(e) => handleSegmentChange(e.target.value)}
          >
            <option value="">Selecione para configurar o site...</option>
            <option value="Advocacia">Advocacia / Jurídico</option>
            <option value="Tecnologia">Tecnologia / Startup</option>
            <option value="Saúde">Saúde / Clínica</option>
            <option value="Restaurante">Restaurante / Bar</option>
            <option value="Estética">Estética / Beleza</option>
            <option value="Imobiliária">Imobiliária / Engenharia</option>
            <option value="Educação">Educação / Cursos</option>
            <option value="Vendas">Loja / Vendas</option>
            <option value="Serviços">Prestação de Serviços</option>
            <option value="Outros">Outro</option>
          </select>
        </div>
      </motion.div>

      {/* 3. Sobre a Empresa (Crucial para a IA) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <label className={labelClass}>Sobre o Negócio</label>
        <div className="relative">
          <FileText className="absolute left-3 top-4 w-4 h-4 text-zinc-600" />
          <textarea 
            placeholder="Conte o que sua empresa faz, seus diferenciais e história. Quanto mais detalhes, melhor o site ficará."
            className={`${inputClass} pl-10 resize-none h-24`}
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </div>
      </motion.div>

      {/* 4. Logo e Público */}
      <div className="grid grid-cols-2 gap-4">
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <label className={labelClass}>Link do Logo</label>
          <div className="relative">
            <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              placeholder="URL da imagem"
              className={`${inputClass} pl-10`}
              value={data.logoUrl}
              onChange={(e) => onChange('logoUrl', e.target.value)}
            />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <label className={labelClass}>Público-Alvo</label>
          <div className="relative">
            <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Ex: Jovens, Empresas..."
              className={`${inputClass} pl-10`}
              value={data.targetAudience}
              onChange={(e) => onChange('targetAudience', e.target.value)}
            />
          </div>
        </motion.div>
      </div>

      {/* 5. Contatos (Rodapé) */}
      <div className="pt-4 border-t border-zinc-800">
        <label className={labelClass}>Contatos Rápidos</label>
        <div className="grid grid-cols-1 gap-3">
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            <input 
              type="tel" 
              placeholder="WhatsApp"
              className={`${inputClass} pl-10`}
              value={data.whatsapp}
              onChange={(e) => onChange('whatsapp', e.target.value)}
            />
          </div>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
            <input 
              type="text" 
              placeholder="@seu.instagram"
              className={`${inputClass} pl-10`}
              value={data.instagram}
              onChange={(e) => onChange('instagram', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessForm;
