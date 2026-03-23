
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, ArrowRight, Loader2, CheckCircle, AlertCircle, Zap, Shield, Layout, X, Globe, Sparkles
} from 'lucide-react';
import { db, functions, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface LandingPageProps {
  onStart: (initialData?: { businessName: string; segment: string }) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [businessName, setBusinessName] = useState('');
  const [segment, setSegment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showFloatModal, setShowFloatModal] = useState(false);
  const [domainStatus, setDomainStatus] = useState<{ loading: boolean; available?: boolean; slug?: string; alternatives?: string[] }>({ loading: false });
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowFloatModal(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleNameChange = (val: string) => {
    setBusinessName(val);
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

  const selectAlternative = (alt: string) => {
    handleNameChange(alt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || businessName.length < 3) return;

    if (domainStatus.available === false) {
      setError("Este nome já está em uso. Escolha uma das alternativas abaixo.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await addDoc(collection(db, 'subscriptions'), {
        businessName: businessName.trim(),
        status: 'paid', 
        createdAt: serverTimestamp(),
        source: 'main_portal_v2',
        platformVersion: '2.0'
      });
      
      setSuccess(true);
      setTimeout(() => onStart({ businessName, segment }), 1500);
    } catch (err: any) {
      setError("Não foi possível conectar ao servidor. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-indigo-500/30">
      {/* Background Decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-24">
        {/* Nav Minimalista */}
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SiteCraft</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#" className="hover:text-white transition-colors">Preços</a>
            <a href="#" className="hover:text-white transition-colors">Showcase</a>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-6">
              <Zap className="w-3 h-3 fill-current" /> NOVO: DEPLOY INSTANTÂNEO
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              Sua empresa merece um <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">site de elite.</span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 max-w-lg leading-relaxed">
              Esqueça editores complexos. Digite o nome da sua empresa e nós geramos, configuramos e publicamos seu site profissional em segundos.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                </div>
                <p className="text-sm text-zinc-500">Hospedagem inclusa</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                </div>
                <p className="text-sm text-zinc-500">Design responsivo</p>
              </div>
            </div>
          </motion.div>

          {/* Card de Conversão */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Layout className="w-32 h-32" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Pronto para começar?</h2>
            <p className="text-zinc-500 text-sm mb-8">Nenhuma configuração técnica necessária.</p>

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-600 ml-1">Nome do seu Negócio</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Studio de Design Loft"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-700 text-white"
                    value={businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                {domainStatus.loading && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verificando domínio...
                  </div>
                )}
                {!domainStatus.loading && domainStatus.available && domainStatus.slug && (
                   <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                     <CheckCircle className="w-4 h-4" /> Domínio disponível: {domainStatus.slug}.sitezing.com.br
                   </div>
                )}
                {!domainStatus.loading && domainStatus.available === false && (
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                       <AlertCircle className="w-4 h-4" /> Nome já em uso. Sugestões:
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {domainStatus.alternatives?.map(alt => (
                         <button type="button" key={alt} onClick={() => selectAlternative(alt)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-full border border-zinc-700 transition-colors text-white">
                           {alt}
                         </button>
                       ))}
                     </div>
                   </div>
                )}
                
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={loading || businessName.length < 3 || domainStatus.available === false}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-indigo-600/20 group mt-4"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      Criar meu Site Grátis
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-zinc-600 mt-4">
                  Ao clicar, você concorda com nossos termos de serviço.
                </p>
              </form>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="py-12 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400">Quase lá!</h3>
                <p className="text-zinc-400 text-sm">Registro salvo. Abrindo o editor...</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer Minimal */}
        <div className="mt-32 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 pb-20 md:pb-0">
          <div className="flex items-center gap-6">
            <Shield className="w-4 h-4 text-zinc-600" />
            <span className="text-xs text-zinc-600 uppercase tracking-widest font-bold">100% Seguro & Protegido</span>
          </div>
          <p className="text-xs text-zinc-700">© 2024 SiteCraft Global. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* MODAL FLUTUANTE DE CRIAÇÃO (Aparece após 10s) */}
      <AnimatePresence>
        {showFloatModal && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-4 md:bottom-10 right-4 md:right-10 z-[100] w-[calc(100%-32px)] md:w-[400px] bg-zinc-900 border border-zinc-700 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xl"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 relative">
              <button 
                onClick={() => setShowFloatModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-300" /> Crie seu site em 30s
              </h3>
              <p className="text-indigo-100 text-sm">Nossa IA monta tudo para você automaticamente. Sem código.</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400 mb-1 block">1. Qual o nome da empresa?</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Pizzaria do Mario"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white text-sm"
                    value={businessName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                
                {/* Repetindo os feedbacks de domínio minimalistas para o modal */}
                {!domainStatus.loading && domainStatus.available === false && (
                   <div className="text-xs text-red-400">Nome em uso. Tente: {domainStatus.alternatives?.join(', ')}</div>
                )}
                {!domainStatus.loading && domainStatus.available && domainStatus.slug && (
                   <div className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {domainStatus.slug}.sitezing.com.br</div>
                )}

                <div>
                  <label className="text-[11px] uppercase tracking-widest font-bold text-zinc-400 mb-1 block">2. Qual o segmento?</label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none text-white text-sm"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Serviços">Prestação de Serviços</option>
                    <option value="Vendas">Loja / Vendas</option>
                    <option value="Saúde">Saúde / Clínica</option>
                    <option value="Imobiliária">Imóveis / Eng.</option>
                    <option value="Beleza">Beleza / Estética</option>
                    <option value="Outros">Outro Ramo</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={loading || businessName.length < 3 || !segment || domainStatus.available === false}
                  className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-xl font-black text-[15px] flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>✨ Gerar com IA agora</>}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
