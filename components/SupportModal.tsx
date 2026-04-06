import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Loader2, AlertCircle, HelpCircle, FileText, CreditCard } from 'lucide-react';

interface SupportModalProps {
  onClose: () => void;
  onSubmit: (subject: string, message: string) => Promise<void>;
}

const SUBJ_OPTIONS = [
  { id: 'duvida', label: 'Dúvidas Gerais', icon: <HelpCircle size={16} /> },
  { id: 'financeiro', label: 'Financeiro / Planos', icon: <CreditCard size={16} /> },
  { id: 'tecnico', label: 'Problema Técnico', icon: <AlertCircle size={16} /> },
  { id: 'outro', label: 'Outro Assunto', icon: <FileText size={16} /> },
];

const SupportModal: React.FC<SupportModalProps> = ({ onClose, onSubmit }) => {
  const [subject, setSubject] = useState(SUBJ_OPTIONS[0].label);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Por favor, digite sua mensagem antes de enviar.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(subject, message);
      onClose(); // Parent exibe a Toast de Sucesso
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar ticket. Tente novamente mais tarde.');
      setIsSubmitting(false); // apenas desliga o loading para tentar dnv
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2rem] overflow-hidden max-w-[480px] w-full shadow-2xl relative border border-stone-100 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-black text-stone-900 uppercase text-xs tracking-[0.1em]">Central de Atendimento</h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Fale diretamente com a equipe</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-stone-400 hover:text-stone-800 transition-colors bg-white p-2 border border-stone-200 rounded-full shadow-sm hover:rotate-90">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-2 block ml-1">Sobre o que deseja falar?</label>
            <div className="grid grid-cols-2 gap-2">
              {SUBJ_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSubject(opt.label)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-[11px] font-bold transition-all ${
                    subject === opt.label 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm ring-1 ring-indigo-500/10' 
                      : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  <span className={subject === opt.label ? 'text-indigo-500' : 'text-stone-400'}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-2 block ml-1">Sua Mensagem</label>
            <textarea
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-stone-800 min-h-[140px] resize-none"
              placeholder="Descreva detalhadamente como podemos te ajudar hoje..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-2.5 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2 mt-auto">
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 disabled:text-stone-500 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 hover:translate-y-[-2px]"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send size={16} /> Enviar Chamado Seguro</>}
            </button>
            <p className="text-center text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-4">
              A resposta será enviada e notificada no seu e-mail de cadastro.
            </p>
          </div>

        </form>
      </motion.div>
    </div>
  );
};

export default SupportModal;
