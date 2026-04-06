
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, CreditCard, Phone, MapPin, Calendar, CheckCircle2, Loader2, X, ShieldAlert 
} from 'lucide-react';

interface ProfileFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    document: initialData?.document || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    birthDate: initialData?.birthDate || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação Básica
    if (!formData.fullName || !formData.document || !formData.phone || !formData.address) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-stone-950/40 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="bg-white rounded-[2.5rem] overflow-hidden max-w-[500px] w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative border border-stone-100 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><User size={22} /></div>
            <div>
              <h3 className="font-black text-stone-900 uppercase text-xs tracking-[0.1em]">Identidade Verificada</h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Segurança obrigatória para publicação</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 transition-colors bg-white p-2 border border-stone-200 rounded-full shadow-sm hover:rotate-90">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start">
            <ShieldAlert className="text-amber-600 shrink-0" size={18} />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Para garantir a segurança da plataforma e prevenir atividades ilícitas, solicitamos a identificação completa do responsável pelo site antes da publicação oficial.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-1.5 block ml-1">Nome Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={16} />
                </div>
                <input 
                  type="text" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-stone-800"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-1.5 block ml-1">CPF ou CNPJ</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-indigo-600 transition-colors">
                    <CreditCard size={16} />
                  </div>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-stone-800"
                    placeholder="000.000.000-00"
                    value={formData.document}
                    onChange={e => setFormData({...formData, document: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-1.5 block ml-1">Telefone / WhatsApp</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-indigo-600 transition-colors">
                    <Phone size={16} />
                  </div>
                  <input 
                    type="tel" 
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-stone-800"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-1.5 block ml-1">Endereço Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-indigo-600 transition-colors">
                  <MapPin size={16} />
                </div>
                <input 
                  type="text" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-stone-800"
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-stone-500 mb-1.5 block ml-1">Data de Nascimento (Opcional)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-indigo-600 transition-colors">
                  <Calendar size={16} />
                </div>
                <input 
                  type="date" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-stone-800 uppercase"
                  value={formData.birthDate}
                  onChange={e => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-[11px] font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100 flex items-center justify-center gap-2">
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <div className="pt-4 mt-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 hover:translate-y-[-2px] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 size={16} /> Salvar Minha Identidade</>}
            </button>
            <p className="text-center text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-4">
              Ao salvar, você declara que as informações são verdadeiras.
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileForm;
