import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star } from 'lucide-react';

const PromoView: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#050505] text-white relative font-sans selection:bg-indigo-500 selection:text-white">
      {/* Efeitos de Fundo Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pt-24 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col justify-center min-h-full relative z-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center md:text-left max-w-3xl mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest text-indigo-400 mb-6 uppercase backdrop-blur-md">
            O futuro da web
          </div>
          <h1 className="text-[3rem] md:text-[5.5rem] font-black leading-[0.9] tracking-tighter mb-6 uppercase italic">
            Sua presença digital em <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">segundos.</span>
          </h1>
          <p className="text-lg md:text-2xl text-white/60 font-light leading-relaxed">
            Não perca vendas por não estar no Google. A nossa inteligência artificial cria, escreve e publica o seu site automaticamente. Preencha o menu ao lado e veja a mágica acontecer.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
          
          {/* Card: Teste Grátis */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2rem] relative overflow-hidden group hover:-translate-y-2 hover:border-white/20 transition-all duration-300">
            <h3 className="text-2xl font-black mb-1 italic uppercase text-white">Teste Grátis</h3>
            <p className="text-white/50 mb-6 text-sm">Veja o seu site pronto hoje mesmo.</p>
            <div className="text-4xl font-black mb-1">R$ 0 <span className="text-sm text-white/40 font-normal">/ 5 dias</span></div>
            <p className="text-[11px] text-blue-400 font-bold mb-6">Após 5 dias, o site é congelado.</p>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center"><CheckCircle size={12} className="text-blue-400" /></span> 
                Geração por IA
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center"><CheckCircle size={12} className="text-blue-400" /></span> 
                Domínio gratuito (.web.app)
              </li>
            </ul>
          </div>

          {/* Card: Mensal */}
          <div className="bg-white/5 backdrop-blur-md border border-zinc-500/30 p-8 rounded-[2rem] relative overflow-hidden group hover:-translate-y-2 hover:border-zinc-400/50 transition-all duration-300">
            <h3 className="text-2xl font-black mb-1 italic uppercase text-zinc-300">Mensal</h3>
            <p className="text-white/50 mb-6 text-sm">Ideal para validar seu negócio.</p>
            <div className="text-4xl font-black mb-1">R$ 49<span className="text-2xl">,90</span> <span className="text-sm text-white/40 font-normal">/ mês</span></div>
            <p className="text-[11px] text-zinc-400 font-bold mb-6">Cancele quando quiser.</p>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-500/20 flex items-center justify-center"><CheckCircle size={12} className="text-zinc-300" /></span> 
                Site online 24/7
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-500/20 flex items-center justify-center"><CheckCircle size={12} className="text-zinc-300" /></span> 
                Domínio próprio (.com.br)
              </li>
            </ul>
          </div>

          {/* Card: Anual */}
          <div className="bg-indigo-950/20 backdrop-blur-md border border-indigo-500/30 p-8 rounded-[2rem] relative overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.15)] md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black tracking-widest px-4 py-1.5 rounded-bl-2xl uppercase">Mais Assinado</div>
            <h3 className="text-2xl font-black mb-1 italic uppercase text-indigo-400">Anual</h3>
            <p className="text-white/50 mb-6 text-sm">A solução definitiva e econômica.</p>
            <div className="text-4xl font-black mb-1">R$ 499 <span className="text-sm text-white/40 font-normal">/ 1º ano</span></div>
            <p className="text-[11px] text-indigo-300/70 font-medium mb-6">Equivale a R$ 41,58 por mês.</p>
            <ul className="space-y-3 text-white/70 text-sm">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center"><Star size={12} className="text-indigo-400" fill="currentColor" /></span> 
                2 meses grátis
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center"><Star size={12} className="text-indigo-400" fill="currentColor" /></span> 
                Apontamento de Domínio
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center"><Star size={12} className="text-indigo-400" fill="currentColor" /></span> 
                Alta velocidade Google
              </li>
            </ul>
          </div>

        </motion.div>
      </motion.main>
    </div>
  );
};

export default PromoView;
